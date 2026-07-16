/**
 * 이미지가 없는 항목은 카드에 빈 이미지 박스만 남기고 정보 가치가 떨어지므로
 * 이미지가 있는 항목만 남긴다. 또한 http:// 이미지 URL은 나중에 https로
 * 배포했을 때 mixed-content로 차단될 수 있어 https로 정규화한다.
 */
function withUsableImages(items) {
  return items
    .filter((item) => typeof item.firstimage === 'string' && item.firstimage.trim().length > 0)
    .map((item) => ({
      ...item,
      firstimage: item.firstimage.replace(/^http:\/\//i, 'https://')
    }));
}

export async function loadSeoulData() {
  try {
    const accommodations = await import('../data/서울_숙박.json').then(m => m.default?.items || []).catch(() => []);
    const touristSites = await import('../data/서울_관광지.json').then(m => m.default?.items || []).catch(() => []);
    const festivals = await import('../data/서울_축제공연행사.json').then(m => m.default?.items || []).catch(() => []);
    const shopping = await import('../data/서울_쇼핑.json').then(m => m.default?.items || []).catch(() => []);
    const culture = await import('../data/서울_문화시설.json').then(m => m.default?.items || []).catch(() => []);

    return {
      regionName: "서울",
      description: "한국관광공사 TourAPI 4.0 기반 서울 정보",
      dataSource: {
        name: "한국관광공사",
        url: "https://www.data.go.kr/data/15101578/openapi.do",
        license: "공공누리 제3유형"
      },
      accommodations: withUsableImages(accommodations).slice(0, 50),
      touristSites: withUsableImages(touristSites).slice(0, 50),
      festivals: withUsableImages(festivals).slice(0, 30),
      restaurants: [],
      shopping: withUsableImages(shopping).slice(0, 30),
      culture: withUsableImages(culture).slice(0, 30)
    };
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return {
      regionName: "서울",
      description: "데이터 로드 중 오류 발생",
      accommodations: [],
      touristSites: [],
      festivals: [],
      restaurants: [],
      shopping: [],
      culture: []
    };
  }
}