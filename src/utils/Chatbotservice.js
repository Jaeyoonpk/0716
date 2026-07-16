// src/utils/chatbotService.js
// Vue3 프론트엔드에서 OpenAI API를 직접 호출하는 챗봇 서비스 모듈

const CATEGORY_KEYWORDS = {
  accommodations: ['숙박', '호텔', '모텔', '펜션', '게스트하우스', '숙소', '잘 곳', '잘곳'],
  touristSites: ['관광', '명소', '가볼', '놀거리', '여행지', '구경', '코스'],
  culture: ['문화', '박물관', '미술관', '전시', '공연', '갤러리'],
  festivals: ['축제', '행사', '이벤트', '일정', '언제'],
  shopping: ['쇼핑', '시장', '백화점', '아울렛', '살 곳', '살곳', '기념품']
};

const CATEGORY_LABELS = {
  accommodations: '숙박',
  touristSites: '관광지',
  culture: '문화시설',
  festivals: '축제',
  shopping: '쇼핑'
};

/**
 * 질문 키워드를 바탕으로 관련성 높은 카테고리의 데이터만 추려서
 * 토큰 사용량을 줄인 컨텍스트 JSON을 생성한다.
 */
function buildContext(question, regionData) {
  if (!regionData) return '{}';

  let targetCategories = Object.keys(CATEGORY_KEYWORDS).filter((cat) =>
    CATEGORY_KEYWORDS[cat].some((kw) => question.includes(kw))
  );

  // 질문에서 카테고리를 특정할 수 없으면 전체 카테고리를 조금씩 포함
  if (targetCategories.length === 0) {
    targetCategories = Object.keys(CATEGORY_KEYWORDS);
  }

  const summary = {};
  targetCategories.forEach((cat) => {
    const items = regionData[cat] || [];
    const limit = targetCategories.length === 1 ? 20 : 8;
    summary[CATEGORY_LABELS[cat]] = items.slice(0, limit).map((item) => ({
      이름: item.title,
      주소: item.addr1,
      전화: item.tel || undefined
    }));
  });

  return JSON.stringify(summary);
}

/**
 * 최근 대화 이력(최대 6개)을 OpenAI 메시지 포맷으로 변환
 */
function buildHistoryMessages(history = []) {
  return history
    .slice(-6)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * 사용자 질문에 대한 챗봇 응답을 OpenAI API로부터 받아온다.
 * @param {string} question - 사용자 질문
 * @param {object} regionData - App.vue의 regionData (accommodations, touristSites 등)
 * @param {Array} history - 지금까지의 대화 이력 [{role, content}, ...]
 * @returns {Promise<string>} 챗봇 응답 텍스트
 */
export async function getChatbotReply(question, regionData, history = []) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'VITE_OPENAI_API_KEY가 설정되지 않았습니다. 프로젝트 루트의 .env 파일을 확인해주세요.'
    );
  }

  const context = buildContext(question, regionData);

  const systemPrompt = `당신은 "서울 여행 완벽 가이드" 웹사이트의 친절한 여행 도우미 챗봇입니다.
반드시 아래 [제공 데이터]에 있는 내용만 근거로 답변하세요. 데이터에 없는 장소나 정보는 지어내지 말고,
"제가 가진 정보에는 없어요"라고 솔직하게 답하세요.
답변은 한국어 존댓말로, 간결하고 친근하게 작성하고, 장소를 추천할 때는 "• 이름 - 주소" 형태의 목록으로 정리하세요.

[제공 데이터]
${context}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...buildHistoryMessages(history),
        { role: 'user', content: question }
      ],
      reasoning_effort: 'minimal', // 추론 토큰 소비를 줄여 실제 답변에 더 많은 토큰을 할당
      max_completion_tokens: 800
      // GPT-5 계열은 temperature를 지원하지 않아(기본값 1만 허용) 파라미터에서 제외했습니다.
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API 오류 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  console.log('OpenAI 응답 원본:', data); // 디버깅용, 정상화되면 제거하세요.
  return data.choices?.[0]?.message?.content?.trim() || '답변을 생성하지 못했어요.';
}