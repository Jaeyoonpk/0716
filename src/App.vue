<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setupLeafletIcons } from './utils/leafletIcon';
import { SUPPORTED_LOCALES } from './i18n';
import CommunityBoard from './components/CommunityBoard.vue';
import WeatherWidget from './components/WeatherWidget.vue';
import ChatbotWidget from './components/ChatbotWidget.vue';
import FestivalCalendar from './components/FestivalCalendar.vue';
import RoutePlanner from './components/RoutePlanner.vue';
import NotificationBell from './components/NotificationBell.vue';
import { loadSeoulData } from './utils/dataLoader';
import { fetchTourDetail } from './utils/tourDetail';

setupLeafletIcons();

const { t, locale } = useI18n();

const regionData = ref(null);
const selectedHotel = ref(null);
const activeTab = ref('accommodations');
const currentView = ref('home'); // 'home' | 'community'
const visibleCount = ref(12);

watch(activeTab, () => {
  visibleCount.value = 12;
});

function showMoreItems() {
  visibleCount.value += 12;
}
const theme = ref('light');
const communityRef = ref(null);
const routeItems = ref([]);
const showRoutePlanner = ref(false);
const mapContainer = ref(null);
const detailLoading = ref(false);
const favoriteItems = ref([]);
const showFavorites = ref(false);
const reserveNotice = ref('');
let leafletMap = null;
let leafletMarker = null;

watch(locale, (value) => {
  localStorage.setItem('seoul-guide-locale', value);
});

function loadFavorites() {
  try {
    const saved = localStorage.getItem('seoul-guide-favorites');
    favoriteItems.value = saved ? JSON.parse(saved) : [];
  } catch (e) {
    favoriteItems.value = [];
  }
}

watch(
  favoriteItems,
  (value) => {
    try {
      localStorage.setItem('seoul-guide-favorites', JSON.stringify(value));
    } catch (e) {
      // 저장 실패는 무시
    }
  },
  { deep: true }
);

function isFavorited(item) {
  return favoriteItems.value.some((i) => i.contentid === item.contentid);
}

function toggleFavorite(item) {
  if (!item) return;
  if (isFavorited(item)) {
    favoriteItems.value = favoriteItems.value.filter((i) => i.contentid !== item.contentid);
  } else {
    favoriteItems.value = [
      ...favoriteItems.value,
      { contentid: item.contentid, title: item.title, firstimage: item.firstimage, addr1: item.addr1 }
    ];
  }
}

function openFavorite(fav) {
  const allItems = ['accommodations', 'touristSites', 'culture', 'festivals', 'shopping']
    .flatMap((cat) => getItemsForTab(cat));
  const original = allItems.find((i) => i.contentid === fav.contentid);
  if (original) selectHotel(original);
}

function handleReserve(item) {
  const homepage = getHomepageUrl(item);
  if (homepage) {
    window.open(homepage, '_blank', 'noopener,noreferrer');
    return;
  }
  if (item?.tel) {
    window.location.href = 'tel:' + item.tel;
    return;
  }
  reserveNotice.value = '문의 가능한 연락처 정보가 없는 장소예요.';
  setTimeout(() => {
    reserveNotice.value = '';
  }, 3000);
}

function isInRoute(item) {
  return routeItems.value.some((i) => i.contentid === item.contentid);
}

function toggleRouteItem(item) {
  if (isInRoute(item)) {
    routeItems.value = routeItems.value.filter((i) => i.contentid !== item.contentid);
  } else {
    routeItems.value = [...routeItems.value, item];
  }
}

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

function goHome() {
  currentView.value = 'home';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToCommunity() {
  closeModal();
  currentView.value = 'community';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToCommunityWrite() {
  closeModal();
  currentView.value = 'community';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  nextTick(() => {
    communityRef.value?.openWriteForm(activeTab.value);
  });
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
  initTheme();
  loadFavorites();
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

function selectHotel(item) {
  selectedHotel.value = item;
  detailLoading.value = true;
  nextTick(() => renderHotelMap(item));

  fetchTourDetail(item.contentid, item.contenttypeid).then((detail) => {
    detailLoading.value = false;
    if (!detail || selectedHotel.value?.contentid !== item.contentid) return;
    // 목록 데이터(item)에 상세정보를 덧붙여 갱신한다. 기존 필드는 유지하고
    // 비어있지 않은 상세 필드만 덮어써서, 상세 API가 일부 값만 줘도 안전하다.
    const merged = { ...selectedHotel.value };
    Object.entries(detail).forEach(([key, value]) => {
      if (value) merged[key] = value;
    });
    selectedHotel.value = merged;
  });
}

function closeModal() {
  selectedHotel.value = null;
  detailLoading.value = false;
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    leafletMarker = null;
  }
}

function getItemsForTab(tabId) {
  if (!regionData.value) return [];
  return regionData.value[tabId] || [];
}

/**
 * TourAPI의 homepage 필드는 순수 URL이 아니라
 * <a href="...">...</a> 형태의 HTML 문자열로 오는 경우가 많아 파싱한다.
 */
function getHomepageUrl(item) {
  const raw = item?.homepage;
  if (!raw || typeof raw !== 'string') return null;

  const hrefMatch = raw.match(/href\s*=\s*"([^"]+)"/i);
  if (hrefMatch) return hrefMatch[1];

  if (/^https?:\/\//i.test(raw.trim())) return raw.trim();

  return null;
}

// 같은 항목을 다시 볼 때 가격·평점·리뷰가 매번 바뀌면 안 되므로,
// contentid 기준으로 한 번만 생성하고 이후엔 캐시된 값을 재사용한다.
const statsCache = new Map();

function getItemStats(item) {
  if (!item) return { price: 0, rating: '0.0', reviewCount: 0, reviews: [] };

  if (!statsCache.has(item.contentid)) {
    statsCache.set(item.contentid, {
      price: Math.floor(Math.random() * (200000 - 80000 + 1)) + 80000,
      rating: (Math.random() * (5 - 4) + 4).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500 + 100),
      reviews: getRandomReviews(item.contenttypeid ? categoryOfType(item.contenttypeid) : activeTab.value)
    });
  }

  return statsCache.get(item.contentid);
}

function categoryOfType(contentTypeId) {
  const map = { '32': 'accommodations', '12': 'touristSites', '14': 'culture', '15': 'festivals', '38': 'shopping' };
  return map[String(contentTypeId)] || activeTab.value;
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

function renderHotelMap(item) {
  if (!item.mapx || !item.mapy || !mapContainer.value) return;

  const lat = parseFloat(item.mapy);
  const lng = parseFloat(item.mapx);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return;

  if (!leafletMap) {
    leafletMap = L.map(mapContainer.value).setView([lat, lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(leafletMap);
  } else {
    leafletMap.setView([lat, lng], 16);
  }

  if (leafletMarker) leafletMarker.remove();
  leafletMarker = L.marker([lat, lng]).addTo(leafletMap).bindPopup(item.title).openPopup();
}

function getStarRating(count) {
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}
</script>

<template>
  <div class="app-shell" :data-theme="theme">
    <!-- 헤더 -->
    <header class="navbar">
      <div class="navbar-content">
        <div class="navbar-actions-row">
          <div class="navbar-actions">
            <button
              class="nav-btn"
              :class="{ active: currentView === 'community' }"
              type="button"
              @click="goToCommunity"
            >
              커뮤니티
            </button>
            <button class="write-btn" type="button" @click="goToCommunityWrite">
              {{ t('writeBtn') }}
            </button>
            <button class="favorites-btn" type="button" @click="goHome(); showFavorites = !showFavorites">
              ♥ 찜한 장소 ({{ favoriteItems.length }})
            </button>
            <select v-model="locale" class="locale-select" aria-label="언어 선택">
              <option v-for="l in SUPPORTED_LOCALES" :key="l.code" :value="l.code">
                {{ l.label }}
              </option>
            </select>
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
        <div class="navbar-brand">
          <h1 class="logo" @click="goHome" role="button" tabindex="0" @keydown.enter="goHome">
            서울 여행 완벽 가이드
          </h1>
          <p class="tagline">{{ t('tagline') }}</p>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="main-content">
      <!-- ============ 홈 화면 ============ -->
      <template v-if="currentView === 'home'">
      <WeatherWidget />

      <!-- 찜한 장소 패널 -->
      <div v-if="showFavorites" class="favorites-panel">
        <p v-if="favoriteItems.length === 0" class="empty-favorites">
          아직 찜한 장소가 없어요. 카드를 눌러 상세보기에서 "찜하기"를 눌러보세요.
        </p>
        <div v-else class="favorites-list">
          <button
            v-for="fav in favoriteItems"
            :key="fav.contentid"
            type="button"
            class="favorite-chip"
            @click="openFavorite(fav)"
          >
            <span class="favorite-chip-title">{{ fav.title }}</span>
            <span class="favorite-chip-remove" @click.stop="toggleFavorite(fav)">✕</span>
          </button>
        </div>
      </div>

      <!-- 탭 네비게이션 -->
      <nav class="tab-navigation" aria-label="카테고리">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tab-label">{{ t('tabs.' + tab.id) }}</span>
        </button>
      </nav>

      <p v-if="regionData" class="result-count">
        {{ t('tabs.' + activeTab) }} 전체 {{ getItemsForTab(activeTab).length }}곳 중
        {{ Math.min(visibleCount, getItemsForTab(activeTab).length) }}곳 표시
      </p>

      <!-- 축제 캘린더 (축제 탭에서만 표시) -->
      <FestivalCalendar v-if="activeTab === 'festivals' && regionData" :festivals="regionData.festivals" />

      <!-- 나의 코스 (관광지 탭에서만 표시) -->
      <div v-if="activeTab === 'touristSites'" class="route-toggle-row">
        <button class="route-toggle-btn" type="button" @click="showRoutePlanner = !showRoutePlanner">
          {{ t('myRoute') }} ({{ routeItems.length }})
        </button>
      </div>
      <RoutePlanner
        v-if="activeTab === 'touristSites' && showRoutePlanner"
        :items="routeItems"
        @remove="toggleRouteItem"
      />

      <!-- 컨텐츠 섹션 -->
      <section class="content-section">
        <div v-if="regionData" class="items-grid">
          <div
            v-for="item in getItemsForTab(activeTab).slice(0, visibleCount)"
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
              <span class="card-tag">{{ t('tabs.' + activeTab) }}</span>
              <div class="card-badge">
                <span v-if="activeTab === 'accommodations'">
                  ₩{{ getItemStats(item).price.toLocaleString() }}
                </span>
                <span v-else>★ {{ getItemStats(item).rating }}</span>
              </div>
            </div>
            <button
              v-if="activeTab === 'touristSites'"
              type="button"
              class="route-add-btn"
              @click.stop="toggleRouteItem(item)"
            >
              {{ isInRoute(item) ? t('removeFromRoute') : t('addToRoute') }}
            </button>

            <div class="card-body">
              <h3 class="card-title">{{ item.title }}</h3>
              <p v-if="item.addr1" class="card-address">📍 {{ item.addr1?.substring(0, 30) }}</p>

              <div class="card-footer">
                <span v-if="activeTab === 'accommodations'" class="availability available">
                  예약가능
                </span>
                <span v-else class="rating">★ {{ getItemStats(item).rating }} / 5</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="loading">로딩 중...</div>

        <div v-if="regionData && visibleCount < getItemsForTab(activeTab).length" class="show-more-row">
          <button class="show-more-btn" type="button" @click="showMoreItems">
            더보기 (+{{ Math.min(12, getItemsForTab(activeTab).length - visibleCount) }})
          </button>
        </div>
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
              <span class="modal-eyebrow">{{ tabs.find(tb => tb.id === activeTab)?.label }}</span>
              <h2>{{ selectedHotel.title }}</h2>
              <div class="modal-rating">
                <span class="stars">{{ getStarRating(5) }}</span>
                <span class="rating-text">
                  {{ getItemStats(selectedHotel).rating }} · {{ getItemStats(selectedHotel).reviewCount }}개 리뷰
                </span>
              </div>
            </div>

            <!-- 지도 -->
            <div v-if="selectedHotel.mapx && selectedHotel.mapy" class="map-container">
              <div ref="mapContainer" class="map"></div>
            </div>

            <div class="modal-info-grid">
              <div v-if="selectedHotel.addr1" class="info-item">
                <span class="info-label">📍 주소</span>
                <span class="info-value">{{ selectedHotel.addr1 }}</span>
              </div>
              <div v-if="selectedHotel.tel" class="info-item">
                <span class="info-label">☎️ 전화</span>
                <span class="info-value">
                  <a :href="'tel:' + selectedHotel.tel" class="info-link">{{ selectedHotel.tel }}</a>
                </span>
              </div>
              <div v-if="getHomepageUrl(selectedHotel)" class="info-item">
                <span class="info-label">🌐 홈페이지</span>
                <span class="info-value">
                  <a :href="getHomepageUrl(selectedHotel)" target="_blank" rel="noopener noreferrer" class="info-link">
                    {{ getHomepageUrl(selectedHotel) }} ↗
                  </a>
                </span>
              </div>
              <div v-if="selectedHotel.usetime" class="info-item">
                <span class="info-label">🕐 이용시간</span>
                <span class="info-value">{{ selectedHotel.usetime }}</span>
              </div>
              <div v-if="selectedHotel.opentime" class="info-item">
                <span class="info-label">🕐 운영시간</span>
                <span class="info-value">{{ selectedHotel.opentime }}</span>
              </div>
              <div v-if="selectedHotel.checkintime" class="info-item">
                <span class="info-label">🛎️ 체크인</span>
                <span class="info-value">{{ selectedHotel.checkintime }}</span>
              </div>
              <div v-if="selectedHotel.checkouttime" class="info-item">
                <span class="info-label">🚪 체크아웃</span>
                <span class="info-value">{{ selectedHotel.checkouttime }}</span>
              </div>
              <div v-if="selectedHotel.restdate" class="info-item">
                <span class="info-label">🚫 휴무일</span>
                <span class="info-value">{{ selectedHotel.restdate }}</span>
              </div>
              <div v-if="selectedHotel.parking" class="info-item">
                <span class="info-label">🅿️ 주차</span>
                <span class="info-value">{{ selectedHotel.parking }}</span>
              </div>
              <div v-if="activeTab === 'accommodations'" class="info-item">
                <span class="info-label">💰 가격</span>
                <span class="info-value">₩{{ getItemStats(selectedHotel).price.toLocaleString() }} / 박</span>
              </div>
              <div v-if="selectedHotel.infocenter" class="info-item">
                <span class="info-label">📞 문의처</span>
                <span class="info-value">{{ selectedHotel.infocenter }}</span>
              </div>
              <div v-if="selectedHotel.zipcode" class="info-item">
                <span class="info-label">📮 우편번호</span>
                <span class="info-value">{{ selectedHotel.zipcode }}</span>
              </div>
            </div>

            <p v-if="detailLoading" class="detail-loading">상세정보를 불러오는 중...</p>
            <p v-if="selectedHotel.overview" class="overview-text">{{ selectedHotel.overview }}</p>

            <!-- 리뷰 섹션 -->
            <div class="reviews-container">
              <h3>{{ t('reviewsTitle') }}</h3>
              <div class="reviews-grid">
                <blockquote
                  v-for="(review, idx) in getItemStats(selectedHotel).reviews"
                  :key="idx"
                  class="review-card"
                >
                  <p class="review-text">{{ review.review }}</p>
                  <footer class="review-footer">
                    <span class="review-avatar">{{ review.name.charAt(0) }}</span>
                    <span class="review-name">{{ review.name }}</span>
                    <span class="review-stars">{{ getStarRating(review.rating) }}</span>
                    <span class="review-date">{{ review.daysAgo }}일 전</span>
                  </footer>
                </blockquote>
              </div>
            </div>

            <!-- 예약 버튼 -->
            <div class="modal-actions">
              <button class="btn-primary" type="button" @click="handleReserve(selectedHotel)">
                {{ t('reserve') }}
              </button>
              <button
                class="btn-secondary"
                type="button"
                :class="{ favorited: isFavorited(selectedHotel) }"
                @click="toggleFavorite(selectedHotel)"
              >
                {{ isFavorited(selectedHotel) ? '✓ 찜 완료' : t('save') }}
              </button>
            </div>
            <p v-if="reserveNotice" class="reserve-notice">{{ reserveNotice }}</p>
          </div>
        </div>
      </div>
      </template>

      <!-- ============ 커뮤니티 화면 ============ -->
      <template v-else-if="currentView === 'community'">
        <div class="community-view">
          <button class="back-home-btn" type="button" @click="goHome">← 홈으로</button>
          <h2 class="section-title">{{ t('communitySection') }}</h2>
          <CommunityBoard ref="communityRef" :initial-category="activeTab" />
        </div>
      </template>
    </main>

    <!-- 챗봇 -->
    <ChatbotWidget v-if="regionData" :region-data="regionData" />

    <!-- 폴링 기반 알림 -->
    <NotificationBell />

    <!-- 푸터 -->
    <footer class="footer">
      <p>출처: 한국관광공사 · 라이선스: 공공누리 제3유형</p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');

.app-shell {
  /* ---- 라이트 모드 토큰 (토스 스타일) ---- */
  --paper: #F9F9F5;
  --surface: #FFFFFF;
  --ink: #191F28;
  --ink-soft: #4E5968;
  --ink-faint: #8B95A1;
  --accent: #57CC99;
  --accent-strong: #3DAE7F;
  --accent-soft: #DFF5EA;
  --line: #E7E7E1;
  --danger: #F04452;
  --shadow: rgba(25, 31, 28, 0.08);

  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  padding-bottom: 2rem;
  margin: 0;
  width: 100%;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  transition: background 0.25s ease, color 0.25s ease;
}

.app-shell[data-theme='dark'] {
  --paper: #14171A;
  --surface: #1E2226;
  --ink: #F2F4F6;
  --ink-soft: #B0B8C1;
  --ink-faint: #6B7684;
  --accent: #57CC99;
  --accent-strong: #6FE0B3;
  --accent-soft: #1C332B;
  --line: #2C3236;
  --danger: #FF6B76;
  --shadow: rgba(0, 0, 0, 0.4);
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

/* ---------- 헤더 ---------- */
.navbar {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  padding: 1.2rem 2rem 1.6rem;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.navbar-content {
  max-width: 1080px;
  margin: 0 auto;
}

.navbar-actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.2rem;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.navbar-brand {
  text-align: center;
  padding: 1.4rem 1.5rem 0.4rem;
}

.nav-btn {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  padding: 0.58rem 1.1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.nav-btn:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.nav-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 4px 14px rgba(87, 204, 153, 0.35);
}

.nav-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.write-btn {
  border: 1.5px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent-strong);
  padding: 0.58rem 1.1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.write-btn:hover {
  background: var(--accent);
  color: white;
}

.write-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.favorites-btn {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  padding: 0.58rem 1.1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
}

.favorites-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.favorites-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.locale-select {
  height: 40px;
  padding: 0 0.9rem;
  border-radius: 999px;
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
}

.locale-select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 1.05rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.theme-toggle:hover {
  transform: scale(1.06);
  border-color: var(--accent);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.logo {
  font-size: 2.2rem;
  margin: 0;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  cursor: pointer;
  display: inline-block;
}

.logo:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 6px;
}

.tagline {
  font-size: 0.95rem;
  margin: 0.4rem 0 0;
  color: var(--ink-soft);
  font-weight: 500;
}

/* ---------- 메인 컨텐츠 ---------- */
.main-content {
  width: 100%;
  max-width: 1080px;
  box-sizing: border-box;
  padding: 2rem 2rem 0;
  margin: 0 auto;
}

/* ---------- 탭 네비게이션 ---------- */
.tab-navigation {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-btn {
  background: var(--surface);
  border: 1.5px solid var(--line);
  border-radius: 999px;
  padding: 0.7rem 1.3rem;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ink-soft);
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.tab-btn:hover {
  color: var(--ink);
  border-color: var(--accent);
}

.tab-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 4px 14px rgba(87, 204, 153, 0.35);
}

.tab-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.route-toggle-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.2rem;
}

.route-toggle-btn {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
}

.route-toggle-btn:hover {
  color: var(--accent-strong);
  border-color: var(--accent);
}

.route-add-btn {
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.6rem;
  border: none;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.route-add-btn:hover {
  background: var(--accent);
  color: white;
}

.favorites-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 1.1rem 1.2rem;
  margin-bottom: 1.4rem;
}

.empty-favorites {
  color: var(--ink-faint);
  font-size: 0.88rem;
  margin: 0;
}

.favorites-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.favorite-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: var(--accent-soft);
  color: var(--accent-strong);
  padding: 0.5rem 0.5rem 0.5rem 0.9rem;
  border-radius: 999px;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  max-width: 220px;
}

.favorite-chip-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-chip-remove {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.favorite-chip-remove:hover {
  background: white;
}

.result-count {
  color: var(--ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
  margin: -1rem 0 1.4rem;
}

/* ---------- 컨텐츠 섹션 ---------- */
.content-section {
  background: transparent;
  padding: 0;
  margin-bottom: 3.5rem;
  width: 100%;
  box-sizing: border-box;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.3rem;
}

.show-more-row {
  display: flex;
  justify-content: center;
  margin-top: 1.8rem;
}

.show-more-btn {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  padding: 0.75rem 1.8rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
}

.show-more-btn:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

/* ---------- 아이템 카드 ---------- */
.item-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px var(--shadow);
}

.card-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--paper);
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
  font-size: 2.4rem;
}

.card-tag {
  position: absolute;
  left: 0.7rem;
  top: 0.7rem;
  background: rgba(255, 255, 255, 0.92);
  color: var(--accent-strong);
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
}

.card-badge {
  position: absolute;
  left: 0.7rem;
  bottom: 0.7rem;
  background: rgba(25, 31, 40, 0.72);
  color: white;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.card-body {
  padding: 1rem 1.1rem 1.2rem;
}

.card-title {
  margin: 0 0 0.4rem;
  font-size: 1.02rem;
  color: var(--ink);
  font-weight: 700;
  line-height: 1.35;
}

.card-address {
  color: var(--ink-faint);
  font-size: 0.82rem;
  margin: 0 0 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.7rem;
  border-top: 1px solid var(--line);
  font-size: 0.85rem;
}

.availability {
  font-weight: 700;
  color: var(--accent-strong);
}

.rating {
  color: var(--ink-soft);
  font-weight: 600;
}

/* ---------- 모달 ---------- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 18, 20, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-card {
  background: var(--surface);
  color: var(--ink);
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border-radius: 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: rgba(25, 31, 40, 0.55);
  border: none;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  z-index: 10;
  color: white;
}

.modal-close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.modal-header {
  width: 100%;
  height: 300px;
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
  background: var(--paper);
}

.modal-body {
  padding: 2.2rem 2.4rem 2.6rem;
}

.modal-title-section {
  margin-bottom: 1.8rem;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid var(--line);
}

.modal-eyebrow {
  display: inline-block;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  margin-bottom: 0.7rem;
}

.modal-title-section h2 {
  margin: 0 0 0.7rem;
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.modal-rating {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.stars {
  font-size: 0.95rem;
  letter-spacing: 1px;
  color: var(--accent-strong);
}

.rating-text {
  color: var(--ink-soft);
  font-size: 0.88rem;
  font-weight: 500;
}

/* ---------- 지도 ---------- */
.map-container {
  margin: 1.6rem 0;
  border-radius: 16px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 280px;
}

/* ---------- 정보 목록 ---------- */
.modal-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 1.6rem;
  background: var(--paper);
  padding: 0.4rem 1.2rem;
  border-radius: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--line);
}

.info-item:nth-last-child(-n+2) {
  border-bottom: none;
}

.info-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--ink-faint);
}

.info-value {
  color: var(--ink);
  font-size: 0.95rem;
  font-weight: 600;
  word-break: break-word;
}

.info-link {
  color: var(--accent-strong);
  text-decoration: none;
}

.info-link:hover {
  text-decoration: underline;
}

.detail-loading {
  color: var(--ink-faint);
  font-size: 0.85rem;
  margin: 0.4rem 0 0;
}

.overview-text {
  color: var(--ink-soft);
  line-height: 1.7;
  margin: 1.2rem 0 0;
  font-size: 0.95rem;
}

/* ---------- 리뷰 ---------- */
.reviews-container {
  margin: 2.2rem 0;
}

.reviews-container h3 {
  color: var(--ink);
  margin: 0 0 1.2rem;
  font-size: 1.2rem;
  font-weight: 800;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.review-card {
  background: var(--paper);
  padding: 1.2rem 1.3rem;
  border-radius: 16px;
  margin: 0;
}

.review-text {
  color: var(--ink);
  line-height: 1.6;
  margin: 0 0 0.9rem;
  font-size: 0.92rem;
  font-weight: 500;
}

.review-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.review-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.78rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.review-name {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--ink);
}

.review-stars {
  color: var(--accent-strong);
  font-size: 0.72rem;
  letter-spacing: 1px;
}

.review-date {
  color: var(--ink-faint);
  font-size: 0.75rem;
  margin-left: auto;
}

/* ---------- 액션 버튼 ---------- */
.modal-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.95rem;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-strong);
}

.btn-secondary {
  background: var(--paper);
  color: var(--ink);
}

.btn-secondary:hover {
  background: var(--line);
}

.btn-secondary.favorited {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.reserve-notice {
  margin: 0.7rem 0 0;
  font-size: 0.83rem;
  color: var(--danger);
  text-align: center;
}

.btn-primary:focus-visible,
.btn-secondary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ---------- 커뮤니티 화면 ---------- */
.community-view {
  padding-top: 0.5rem;
  animation: fade-in 0.25s ease;
}

.back-home-btn {
  border: 1.5px solid var(--line);
  background: var(--surface);
  color: var(--ink-soft);
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1.4rem;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
}

.back-home-btn:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-title {
  color: var(--ink);
  font-size: 1.5rem;
  margin: 0 0 1.6rem;
  font-weight: 800;
}

/* ---------- 푸터 ---------- */
.footer {
  text-align: center;
  color: var(--ink-faint);
  padding: 2rem;
  margin-top: 3rem;
  background: transparent;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.8rem;
}

.loading {
  text-align: center;
  color: var(--ink-faint);
  padding: 3rem;
  font-size: 1rem;
  font-weight: 600;
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
    padding: 1.4rem 1.2rem 1.2rem;
  }

  .logo {
    font-size: 1.6rem;
  }

  .navbar-brand {
    padding: 1.8rem 1.2rem;
    border-radius: 18px;
  }

  .navbar-actions-row {
    justify-content: center;
  }

  .navbar-actions {
    justify-content: center;
    gap: 0.5rem;
  }

  .write-btn {
    font-size: 0.78rem;
    padding: 0.5rem 0.9rem;
  }

  .main-content {
    padding: 1.6rem 1.2rem 0;
  }

  .items-grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  .modal-info-grid {
    grid-template-columns: 1fr;
  }

  .info-item:nth-last-child(-n+2) {
    border-bottom: 1px solid var(--line);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .modal-body {
    padding: 1.6rem;
  }

  .reviews-grid {
    grid-template-columns: 1fr;
  }
}
</style>