<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';

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
let markerInstance = null;

function onDelete() {
  emit('delete', password.value);
}

function waitForKakao(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.kakao?.maps?.services) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error('지도를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

async function renderMap() {
  if (!props.post?.address) {
    mapStatus.value = 'idle';
    return;
  }

  mapStatus.value = 'loading';
  mapErrorMsg.value = '';

  try {
    await waitForKakao();
    await nextTick();

    if (!mapContainer.value) return;

    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(props.post.address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

        mapInstance = new window.kakao.maps.Map(mapContainer.value, {
          center: coords,
          level: 4
        });

        markerInstance = new window.kakao.maps.Marker({
          position: coords,
          map: mapInstance
        });

        mapStatus.value = 'ready';
      } else {
        mapStatus.value = 'error';
        mapErrorMsg.value = '주소로 위치를 찾을 수 없습니다. 주소를 다시 확인해주세요.';
      }
    });
  } catch (err) {
    mapStatus.value = 'error';
    mapErrorMsg.value = err.message;
  }
}

onMounted(renderMap);

watch(
  () => props.post?.id,
  () => renderMap()
);
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  background: #fafafa;
}

.detail-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
}

.rating {
  color: #f59e0b;
  font-weight: 600;
}

.price {
  color: #059669;
  font-weight: 600;
}

.facilities {
  background: #f0fdf4;
  padding: 0.5rem;
  border-radius: 6px;
  margin: 0.5rem 0;
}

.location-section {
  margin: 0.8rem 0;
  color: #374151;
}

.detail-map {
  width: 100%;
  height: 260px;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 0.6rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.map-status {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.map-status.error {
  color: #dc2626;
}

.detail-actions {
  display: flex;
  gap: 0.5rem;
  margin: 0.8rem 0;
}

button {
  border: none;
  background: #2563eb;
  color: white;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.ghost-btn {
  background: #e5e7eb;
  color: #111827;
}

.danger-btn {
  background: #dc2626;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

input {
  padding: 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}
</style>