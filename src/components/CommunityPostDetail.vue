<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setupLeafletIcons } from '../utils/leafletIcon';

setupLeafletIcons();

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit', 'delete', 'close']);

const password = ref('');
const mapContainer = ref(null);
const mapStatus = ref('idle'); // idle | loading | ready | error
const mapErrorMsg = ref('');
let mapInstance = null;
let marker = null;

function onDelete() {
  emit('delete', password.value);
}

/**
 * OpenStreetMap의 무료 Nominatim 검색 API로 주소를 좌표로 변환한다.
 * 사용 정책상 초당 1회 이하로 호출해야 하며, 상업적 대량 사용은 금지되어 있다.
 * (교육 목적의 소규모 프로젝트에서는 문제 없음)
 */
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('주소 검색에 실패했습니다.');
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function renderMap() {
  if (!props.post?.address) {
    mapStatus.value = 'idle';
    return;
  }

  mapStatus.value = 'loading';
  mapErrorMsg.value = '';

  try {
    const coords = await geocodeAddress(props.post.address);
    await nextTick();

    if (!coords || !mapContainer.value) {
      mapStatus.value = 'error';
      mapErrorMsg.value = '주소로 위치를 찾을 수 없습니다. 주소를 다시 확인해주세요.';
      return;
    }

    if (!mapInstance) {
      mapInstance = L.map(mapContainer.value).setView([coords.lat, coords.lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);
    } else {
      mapInstance.setView([coords.lat, coords.lng], 16);
    }

    if (marker) marker.remove();
    marker = L.marker([coords.lat, coords.lng]).addTo(mapInstance).bindPopup(props.post.title).openPopup();

    mapStatus.value = 'ready';
  } catch (err) {
    mapStatus.value = 'error';
    mapErrorMsg.value = err.message || '지도를 불러오지 못했습니다.';
  }
}

onMounted(renderMap);

watch(
  () => props.post?.id,
  () => renderMap()
);

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<template>
  <div class="detail-box">
    <button class="ghost-btn" type="button" @click="emit('close')">목록으로</button>

    <h3>{{ post.title }}</h3>
    <div class="detail-meta">
      <span class="rating">⭐ {{ post.rating }}</span>
      <span v-if="post.price" class="price">💰 {{ post.price }}</span>
    </div>

    <p>{{ post.content }}</p>

    <div v-if="post.facilities" class="facilities">
      <strong>특징/시설:</strong> {{ post.facilities }}
    </div>

    <!-- 위치 정보 및 지도 -->
    <div v-if="post.address" class="location-section">
      <strong>📍 위치:</strong> {{ post.address }}
      <div ref="mapContainer" class="detail-map" v-show="mapStatus === 'ready'"></div>
      <p v-if="mapStatus === 'loading'" class="map-status">지도를 불러오는 중...</p>
      <p v-if="mapStatus === 'error'" class="map-status error">{{ mapErrorMsg }}</p>
    </div>

    <small>작성일: {{ new Date(post.createdAt).toLocaleString('ko-KR') }}</small>

    <div class="detail-actions">
      <button type="button" @click="emit('edit', post)">수정</button>
      <button class="danger-btn" type="button" @click="onDelete">삭제</button>
    </div>

    <label>
      비밀번호
      <input v-model="password" type="password" placeholder="비밀번호 입력" />
    </label>
  </div>
</template>

<style scoped>
.detail-box {
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 16px;
  padding: 1.3rem;
  background: var(--paper, #fafafa);
}

.detail-box h3 {
  color: var(--ink, #111827);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0.8rem 0 0.4rem;
}

.detail-box p {
  color: var(--ink-soft, #374151);
}

.detail-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
}

.rating {
  color: #f59e0b;
  font-weight: 700;
}

.price {
  color: var(--accent-strong, #059669);
  font-weight: 700;
}

.facilities {
  background: var(--accent-soft, #f0fdf4);
  color: var(--accent-strong, #166534);
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.location-section {
  margin: 0.9rem 0;
  color: var(--ink-soft, #374151);
}

.detail-map {
  width: 100%;
  height: 260px;
  border-radius: 14px;
  overflow: hidden;
  margin-top: 0.6rem;
  box-shadow: 0 2px 8px rgba(25, 31, 28, 0.1);
}

.map-status {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--ink-faint, #6b7280);
}

.map-status.error {
  color: var(--danger, #dc2626);
}

.detail-actions {
  display: flex;
  gap: 0.6rem;
  margin: 1rem 0;
}

button {
  border: none;
  background: var(--accent, #57cc99);
  color: white;
  padding: 0.75rem 1.2rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
}

button:hover {
  background: var(--accent-strong, #3dae7f);
}

.ghost-btn {
  background: var(--surface, #e5e7eb);
  border: 1.5px solid var(--line, #e5e7eb);
  color: var(--ink, #111827);
}

.ghost-btn:hover {
  background: var(--line, #e5e7eb);
}

.danger-btn {
  background: var(--danger, #dc2626);
}

.danger-btn:hover {
  opacity: 0.88;
  background: var(--danger, #dc2626);
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.6rem;
  color: var(--ink-soft, #374151);
  font-size: 0.88rem;
  font-weight: 600;
}

input {
  padding: 0.7rem 0.8rem;
  border: 1.5px solid var(--line, #cbd5e1);
  border-radius: 12px;
  background: var(--surface, white);
  color: var(--ink, #111827);
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: var(--accent, #57cc99);
}
</style>