<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['remove']);

const mapContainer = ref(null);
let mapInstance = null;
let polyline = null;
let markers = [];

function waitForKakao(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.kakao?.maps) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error('지도를 불러오지 못했습니다.'));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

async function renderRoute() {
  if (props.items.length === 0 || !mapContainer.value) return;

  try {
    await waitForKakao();
    await nextTick();

    const points = props.items
      .filter((item) => item.mapx && item.mapy)
      .map((item) => new window.kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx)));

    if (points.length === 0) return;

    if (!mapInstance) {
      mapInstance = new window.kakao.maps.Map(mapContainer.value, {
        center: points[0],
        level: 6
      });
    }

    markers.forEach((m) => m.setMap(null));
    markers = points.map(
      (pos, idx) =>
        new window.kakao.maps.Marker({
          position: pos,
          map: mapInstance,
          title: props.items[idx]?.title
        })
    );

    if (polyline) polyline.setMap(null);
    polyline = new window.kakao.maps.Polyline({
      path: points,
      strokeWeight: 4,
      strokeColor: '#7A3B3B',
      strokeOpacity: 0.9,
      strokeStyle: 'solid'
    });
    polyline.setMap(mapInstance);

    const bounds = new window.kakao.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    mapInstance.setBounds(bounds);
  } catch (e) {
    console.error('경로 지도 오류:', e);
  }
}

watch(() => props.items.length, renderRoute, { immediate: true });
</script>

<template>
  <div class="route-planner">
    <p v-if="items.length === 0" class="empty">
      코스에 추가된 관광지가 없습니다. 관광지 카드의 "코스에 추가" 버튼을 눌러보세요.
    </p>

    <template v-else>
      <ol class="route-list">
        <li v-for="(item, idx) in items" :key="item.contentid">
          <span class="order">{{ idx + 1 }}</span>
          <span class="title">{{ item.title }}</span>
          <button type="button" class="remove-btn" @click="emit('remove', item)">제외</button>
        </li>
      </ol>
      <div ref="mapContainer" class="route-map"></div>
    </template>
  </div>
</template>

<style scoped>
.route-planner {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 2rem;
}

.empty {
  color: #6b7280;
  font-size: 0.9rem;
}

.route-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.route-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  background: #f9fafb;
  border-radius: 8px;
}

.order {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #7A3B3B;
  color: white;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title {
  flex: 1;
  font-size: 0.9rem;
  color: #111827;
}

.remove-btn {
  border: none;
  background: none;
  color: #dc2626;
  font-size: 0.8rem;
  cursor: pointer;
}

.route-map {
  width: 100%;
  height: 320px;
  border-radius: 10px;
  overflow: hidden;
}
</style>