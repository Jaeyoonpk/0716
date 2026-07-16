<script setup>
import { onMounted, ref, watch } from 'vue';
import CommunityBoard from './components/CommunityBoard.vue';
import ChatbotWidget from './components/ChatbotWidget.vue';
import { loadSeoulData } from './utils/dataLoader';

const regionData = ref(null);
const selectedHotel = ref(null);
const activeTab = ref('accommodations');
const mapReady = ref(false);
const theme = ref('light');
const communityRef = ref(null);

/**
 * 외부 플레이스홀더 서비스(via.placeholder.com 등)는 안정성이 떨어져
 * 자체 SVG data URI로 대체 이미지를 생성한다.
 */
function placeholderImage(text = '이미지 없음') {
  const safeText = String(text).slice(0, 20);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280">
    <rect width="100%" height="100%" fill="#EDE7DD"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#8A8072" text-anchor="middle" dominant-baseline="middle">${safeText}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function goToCommunityWrite() {
  const section = document.getElementById('community-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // 스크롤이 끝난 뒤 자연스럽게 글쓰기 폼을 연다.
  setTimeout(() => {
    communityRef.value?.openWriteForm(activeTab.value);
  }, 350);
}

const tabs = [
  { id: 'accommodations', label: '숙박', icon: '🏨' },
  { id: 'touristSites', label: '관광지', icon: '🎯' },
  { id: 'culture', label: '문화시설', icon: '🎭' },
  { id: 'festivals', label: '축제', icon: '🎉' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' }
];

const reviewNames = [
  '김서윤', '이준호', '박미정', '최동욱', '정수진', '한민준', '윤지훈', '이현우',
  '박세영', '조민식', '강은정', '서준호', '임유나', '김태희', '박준영', '이소연'
];

const reviewsByCategory = {
  accommodations: [
    '위치가 정말 좋고 직원들이 친절합니다. 객실도 깨끗하고 넓어요.',
    '조용하고 편안한 분위기. 정말 만족했습니다.',
    '가족 여행으로 묵었는데 모두가 만족했습니다.',
    '비즈니스 출장으로 이용했는데 편하고 좋습니다.',
    '가성비 최고! 다시 방문할 것 같아요.',
    '서비스가 훌륭하고 시설이 깨끗해요.',
    '주변 맛집도 많고 위치가 최고입니다.',
    '정말 편안하고 쾌적한 숙박이었어요.'
  ],
  touristSites: [
    '경치가 정말 아름답고 사진 찍기 좋은 곳이었어요.',
    '가족들과 함께 방문하기 좋은 곳입니다. 추천해요.',
    '생각보다 볼거리가 많아서 시간 가는 줄 몰랐어요.',
    '한국의 역사와 문화를 느낄 수 있는 특별한 장소였습니다.',
    '아이들과 함께 가기 좋았고 설명도 잘 되어 있었어요.',
    '산책하기 좋고 계절마다 다른 매력이 있는 곳이에요.'
  ],
  culture: [
    '전시 구성이 알차고 설명도 자세해서 좋았습니다.',
    '아이들과 함께 배우면서 즐길 수 있는 공간이었어요.',
    '작품들이 인상 깊었고 조용히 감상하기 좋았습니다.',
    '큐레이션이 훌륭해서 시간 가는 줄 몰랐어요.',
    '공연 수준이 높고 시설도 쾌적했습니다.'
  ],
  festivals: [
    '분위기가 정말 활기차고 즐길 거리가 많았어요.',
    '가족, 친구와 함께 가기 좋은 축제였습니다.',
    '먹거리와 볼거리가 풍부해서 만족스러웠어요.',
    '다음에도 이 시기에 맞춰 또 방문하고 싶어요.',
    '야간 프로그램이 특히 인상적이었습니다.'
  ],
  shopping: [
    '다양한 매장이 있어서 구경하는 재미가 있었어요.',
    '가격대가 다양해서 부담 없이 쇼핑할 수 있었습니다.',
    '주변에 먹거리도 많아서 함께 즐기기 좋아요.',
    '트렌디한 아이템이 많아서 자주 오게 되는 곳이에요.',
    '외국인 친구들과 방문하기에도 좋았습니다.'
  ]
};

onMounted(async () => {
  regionData.value = await loadSeoulData();
  loadKakaoMap();
  initTheme();
});

function initTheme() {
  try {
    const saved = localStorage.getItem('seoul-guide-theme');
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved;
      return;
    }
  } catch (e) {
    // localStorage 접근 불가 시 무시
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark';
  }
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}

watch(theme, (value) => {
  try {
    localStorage.setItem('seoul-guide-theme', value);
  } catch (e) {
    // 저장 실패는 무시
  }
});

function loadKakaoMap() {
  const script = document.createElement('script');
  script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_APP_KEY&libraries=services';
  script.onload = () => {
    mapReady.value = true;
  };
  document.head.appendChild(script);
}

function selectHotel(item) {
  selectedHotel.value = item;
  setTimeout(() => {
    initMap(item);
  }, 100);
}

function closeModal() {
  selectedHotel.value = null;
}

function getItemsForTab(tabId) {
  if (!regionData.value) return [];
  return regionData.value[tabId] || [];
}

function getRandomPrice() {
  return Math.floor(Math.random() * (200000 - 80000 + 1)) + 80000;
}

function getRandomRating() {
  return (Math.random() * (5 - 4) + 4).toFixed(1);
}

function getRandomReviews(category, count = 4) {
  const pool = reviewsByCategory[category] || reviewsByCategory.accommodations;
  const result = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    let name;
    do {
      name = reviewNames[Math.floor(Math.random() * reviewNames.length)];
    } while (usedNames.has(name) && usedNames.size < reviewNames.length);

    usedNames.add(name);

    const randomReview = pool[Math.floor(Math.random() * pool.length)];
    const rating = Math.floor(Math.random() * 2) + 4;
    const daysAgo = Math.floor(Math.random() * 30) + 1;

    result.push({ name, review: randomReview, rating, daysAgo });
  }

  return result;
}

function initMap(item) {
  if (!mapReady.value) return;

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  const mapOption = {
    center: new window.kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx)),
    level: 3
  };

  const map = new window.kakao.maps.Map(mapContainer, mapOption);

  const marker = new window.kakao.maps.Marker({
    position: mapOption.center,
    title: item.title
  });

  marker.setMap(map);
}

function getStarRating(count) {
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}
</script>

<template>
  <div class="app-shell" :data-theme="theme">
    <!-- 마스트헤드 -->
    <header class="navbar">
      <div class="navbar-content">
        <div class="navbar-top">
          <p class="eyebrow">SOUTH KOREA — CITY GUIDE</p>
          <div class="navbar-actions">
            <button class="write-btn" type="button" @click="goToCommunityWrite">
              커뮤니티 글쓰기
            </button>
            <button
              class="theme-toggle"
              type="button"
              @click="toggleTheme"
              :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              {{ theme === 'dark' ? '☀' : '☾' }}
            </button>
          </div>
        </div>
        <h1 class="logo">서울 여행 완벽 가이드</h1>
        <p class="tagline">한국 최고의 여행 정보 플랫폼</p>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="main-content">
      <!-- 탭 네비게이션 -->
      <nav class="tab-navigation" aria-label="카테고리">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- 컨텐츠 섹션 -->
      <section class="content-section">
        <div v-if="regionData" class="items-grid">
          <div
            v-for="item in getItemsForTab(activeTab).slice(0, 12)"
            :key="item.contentid"
            class="item-card"
            @click="selectHotel(item)"
          >
            <div class="card-image">
              <img
                v-if="item.firstimage"
                :src="item.firstimage"
                :alt="item.title"
                @error="$event.target.src = placeholderImage(item.title)"
              />
              <div v-else class="placeholder">📷</div>
              <div class="card-badge">
                <span v-if="activeTab === 'accommodations'">
                  ₩{{ getRandomPrice().toLocaleString() }}
                </span>
                <span v-else>★ {{ getRandomRating() }}</span>
              </div>
            </div>

            <div class="card-body">
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-address">{{ item.addr1?.substring(0, 30) }}...</p>

              <div class="card-footer">
                <span v-if="activeTab === 'accommodations'" class="availability available">
                  예약가능
                </span>
                <span v-else class="rating">★ {{ getRandomRating() }} / 5</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="loading">로딩 중...</div>
      </section>

      <!-- 상세 정보 모달 -->
      <div v-if="selectedHotel" class="modal-overlay" @click="closeModal">
        <div class="modal-card" @click.stop>
          <button class="modal-close" @click="closeModal" aria-label="닫기">✕</button>

          <div class="modal-header">
            <img
              v-if="selectedHotel.firstimage"
              :src="selectedHotel.firstimage"
              :alt="selectedHotel.title"
              class="modal-image"
              @error="$event.target.src = placeholderImage(selectedHotel.title)"
            />
            <div v-else class="modal-image-placeholder">📷</div>
          </div>

          <div class="modal-body">
            <div class="modal-title-section">
              <p class="modal-eyebrow">{{ tabs.find(t => t.id === activeTab)?.label }}</p>
              <h2>{{ selectedHotel.title }}</h2>
              <div class="modal-rating">
                <span class="stars">{{ getStarRating(5) }}</span>
                <span class="rating-text">{{ getRandomRating() }} · {{ Math.floor(Math.random() * 500 + 100) }}개 리뷰</span>
              </div>
            </div>

            <!-- 지도 -->
            <div v-if="mapReady" class="map-container">
              <div id="map" class="map"></div>
            </div>

            <div class="modal-info-grid">
              <div class="info-item">
                <span class="info-label">주소</span>
                <span class="info-value">{{ selectedHotel.addr1 }}</span>
              </div>
              <div v-if="selectedHotel.tel" class="info-item">
                <span class="info-label">전화</span>
                <span class="info-value">{{ selectedHotel.tel }}</span>
              </div>
              <div v-if="activeTab === 'accommodations'" class="info-item">
                <span class="info-label">가격</span>
                <span class="info-value">₩{{ getRandomPrice().toLocaleString() }} / 박</span>
              </div>
              <div v-if="selectedHotel.zipcode" class="info-item">
                <span class="info-label">우편번호</span>
                <span class="info-value">{{ selectedHotel.zipcode }}</span>
              </div>
            </div>

            <!-- 리뷰 섹션 -->
            <div class="reviews-container">
              <p class="section-eyebrow">VISITOR VOICES</p>
              <h3>방문객 리뷰</h3>
              <div class="reviews-grid">
                <blockquote
                  v-for="(review, idx) in getRandomReviews(activeTab, 4)"
                  :key="idx"
                  class="review-card"
                >
                  <p class="review-text">{{ review.review }}</p>
                  <footer class="review-footer">
                    <span class="review-name">{{ review.name }}</span>
                    <span class="review-stars">{{ getStarRating(review.rating) }}</span>
                    <span class="review-date">{{ review.daysAgo }}일 전</span>
                  </footer>
                </blockquote>
              </div>
            </div>

            <!-- 예약 버튼 -->
            <div class="modal-actions">
              <button class="btn-primary">예약 문의</button>
              <button class="btn-secondary">찜하기</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 커뮤니티 섹션 -->
      <section id="community-section" class="community-wrapper">
        <p class="section-eyebrow">TRAVELER COMMUNITY</p>
        <h2 class="section-title">여행자 커뮤니티</h2>
        <CommunityBoard ref="communityRef" :initial-category="activeTab" />
      </section>
    </main>

    <!-- 챗봇 -->
    <ChatbotWidget v-if="regionData" :region-data="regionData" />

    <!-- 푸터 -->
    <footer class="footer">
      <p>출처: 한국관광공사 · 라이선스: 공공누리 제3유형</p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Inter:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;600&display=swap');

.app-shell {
  /* ---- 라이트 모드 토큰 ---- */
  --paper: #FAF8F4;
  --surface: #FFFFFF;
  --ink: #201C19;
  --ink-soft: #6B6259;
  --ink-faint: #A79E93;
  --accent: #7A3B3B;
  --accent-soft: #B8935A;
  --line: #E3DBCD;
  --shadow: rgba(32, 28, 25, 0.08);

  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  padding-bottom: 2rem;
  margin: 0;
  width: 100%;
  font-family: 'Inter', 'Noto Sans KR', sans-serif;
  transition: background 0.25s ease, color 0.25s ease;
}

.app-shell[data-theme='dark'] {
  --paper: #17140F;
  --surface: #201B15;
  --ink: #EFE8DC;
  --ink-soft: #B3A793;
  --ink-faint: #756B5C;
  --accent: #D98A8A;
  --accent-soft: #E4C078;
  --line: #3A332A;
  --shadow: rgba(0, 0, 0, 0.35);
}

.app-shell * {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

.serif,
.logo,
.card-title,
.modal-title-section h2,
.reviews-container h3,
.section-title {
  font-family: 'Noto Serif KR', serif;
}

.eyebrow,
.section-eyebrow,
.modal-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-soft);
  margin: 0 0 0.6rem;
}

/* ---------- 마스트헤드 ---------- */
.navbar {
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  padding: 2rem 2rem 2.2rem;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.navbar-content {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
}

.navbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.write-btn {
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  padding: 0.5rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.write-btn:hover {
  background: var(--accent);
  color: var(--paper);
}

.write-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-toggle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.theme-toggle:hover {
  border-color: var(--accent);
  transform: scale(1.05);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.logo {
  font-size: 2.6rem;
  margin: 0 0 0.5rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.tagline {
  font-family: 'Noto Serif KR', serif;
  font-style: italic;
  font-size: 1.05rem;
  margin: 0;
  color: var(--ink-soft);
}

/* ---------- 메인 컨텐츠 ---------- */
.main-content {
  width: 100%;
  max-width: 1180px;
  box-sizing: border-box;
  padding: 3rem 2rem 0;
  margin: 0 auto;
}

/* ---------- 탭 네비게이션 ---------- */
.tab-navigation {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  justify-content: center;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0;
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.4rem 0.1rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ink-faint);
  letter-spacing: 0.02em;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.tab-btn:hover {
  color: var(--ink);
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* ---------- 컨텐츠 섹션 ---------- */
.content-section {
  background: transparent;
  padding: 0;
  margin-bottom: 4rem;
  width: 100%;
  box-sizing: border-box;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 2.5rem 2rem;
}

/* ---------- 아이템 카드 ---------- */
.item-card {
  background: transparent;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease;
}

.item-card:hover {
  transform: translateY(-4px);
}

.card-image {
  position: relative;
  width: 100%;
  height: 210px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.item-card:hover .card-image img {
  transform: scale(1.04);
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.card-badge {
  position: absolute;
  left: 0;
  bottom: 0;
  background: rgba(23, 20, 15, 0.78);
  color: #F4EFE6;
  padding: 0.4rem 0.9rem;
  font-family: 'Noto Serif KR', serif;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

.card-body {
  padding: 1.2rem 0.1rem 0;
}

.card-title {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  color: var(--ink);
  font-weight: 600;
  line-height: 1.35;
}

.card-address {
  color: var(--ink-soft);
  font-size: 0.85rem;
  margin: 0 0 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.8rem;
  border-top: 1px solid var(--line);
  font-size: 0.85rem;
}

.availability {
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--accent);
}

.rating {
  color: var(--ink-soft);
  font-weight: 500;
}

/* ---------- 모달 ---------- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 13, 10, 0.68);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-card {
  background: var(--paper);
  color: var(--ink);
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 64px var(--shadow);
  border: 1px solid var(--line);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 38px;
  height: 38px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
  color: var(--ink);
}

.modal-close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.modal-header {
  width: 100%;
  height: 320px;
  overflow: hidden;
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  background: var(--surface);
}

.modal-body {
  padding: 2.8rem 3rem;
}

.modal-title-section {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 1.6rem;
}

.modal-title-section h2 {
  margin: 0 0 0.8rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink);
}

.modal-rating {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.stars {
  font-size: 1rem;
  letter-spacing: 2px;
  color: var(--accent-soft);
}

.rating-text {
  color: var(--ink-soft);
  font-size: 0.9rem;
}

/* ---------- 지도 ---------- */
.map-container {
  margin: 1.8rem 0;
  overflow: hidden;
  border: 1px solid var(--line);
}

.map {
  width: 100%;
  height: 300px;
}

/* ---------- 정보 목록 ---------- */
.modal-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0;
  margin-bottom: 2.4rem;
  background: transparent;
  padding: 0;
  border-top: 1px solid var(--line);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--line);
}

.info-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-soft);
}

.info-value {
  color: var(--ink);
  font-size: 0.98rem;
}

/* ---------- 리뷰 (voices) ---------- */
.reviews-container {
  margin: 2.6rem 0;
}

.reviews-container h3 {
  color: var(--ink);
  margin: 0 0 1.6rem;
  font-size: 1.4rem;
  font-weight: 700;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.6rem;
}

.review-card {
  background: var(--surface);
  padding: 1.6rem 1.4rem 1.2rem;
  border: 1px solid var(--line);
  margin: 0;
  position: relative;
}

.review-text {
  font-family: 'Noto Serif KR', serif;
  color: var(--ink);
  line-height: 1.7;
  margin: 0 0 1rem;
  font-size: 0.98rem;
}

.review-text::before {
  content: '“';
  font-family: 'Noto Serif KR', serif;
  font-size: 2rem;
  color: var(--accent-soft);
  line-height: 0;
  display: block;
  margin-bottom: 0.6rem;
}

.review-footer {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 0.8rem;
  border-top: 1px solid var(--line);
}

.review-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ink);
}

.review-stars {
  color: var(--accent-soft);
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.review-date {
  color: var(--ink-faint);
  font-size: 0.78rem;
  margin-left: auto;
}

/* ---------- 액션 버튼 ---------- */
.modal-actions {
  display: flex;
  gap: 1.2rem;
  margin-top: 2.4rem;
  align-items: center;
}

.btn-primary,
.btn-secondary {
  padding: 0.9rem 1.8rem;
  border: none;
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.btn-primary {
  background: var(--accent);
  color: #FBF6EE;
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-secondary {
  background: none;
  color: var(--ink);
  border-bottom: 1px solid var(--ink);
  padding-left: 0;
  padding-right: 0;
}

.btn-secondary:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.btn-primary:focus-visible,
.btn-secondary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ---------- 커뮤니티 섹션 ---------- */
.community-wrapper {
  margin-top: 4rem;
}

.section-title {
  color: var(--ink);
  font-size: 1.7rem;
  margin: 0 0 2rem;
  font-weight: 700;
}

/* ---------- 푸터 ---------- */
.footer {
  text-align: center;
  color: var(--ink-faint);
  padding: 2rem;
  border-top: 1px solid var(--line);
  margin-top: 3rem;
  background: transparent;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.82rem;
}

.loading {
  text-align: center;
  color: var(--ink-faint);
  padding: 3rem;
  font-size: 1.05rem;
  font-family: 'Noto Serif KR', serif;
}

@media (prefers-reduced-motion: reduce) {
  .app-shell,
  .item-card,
  .card-image img,
  .theme-toggle,
  .btn-primary,
  .btn-secondary {
    transition: none !important;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 1.5rem 1.2rem 1.8rem;
  }

  .navbar-top {
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .write-btn {
    font-size: 0.76rem;
    padding: 0.45rem 0.8rem;
  }

  .logo {
    font-size: 1.9rem;
  }

  .main-content {
    padding: 2rem 1.2rem 0;
  }

  .tab-navigation {
    gap: 1.2rem;
    justify-content: flex-start;
    overflow-x: auto;
  }

  .tab-btn {
    white-space: nowrap;
  }

  .items-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .modal-body {
    padding: 1.6rem;
  }

  .reviews-grid {
    grid-template-columns: 1fr;
  }
}
</style>