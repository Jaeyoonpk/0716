<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setupLeafletIcons } from '../utils/leafletIcon';

setupLeafletIcons();

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

async function renderRoute() {
  if (props.items.length === 0 || !mapContainer.value) return;

  await nextTick();

  const points = props.items
    .filter((item) => item.mapx && item.mapy)
    .map((item) => [parseFloat(item.mapy), parseFloat(item.mapx)]);

  if (points.length === 0) return;

  if (!mapInstance) {
    mapInstance = L.map(mapContainer.value);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);
  }

  markers.forEach((m) => m.remove());
  markers = points.map((pos, idx) =>
    L.marker(pos).addTo(mapInstance).bindTooltip(props.items[idx]?.title || '')
  );

  if (polyline) polyline.remove();
  polyline = L.polyline(points, {
    color: '#7A3B3B',
    weight: 4,
    opacity: 0.9
  }).addTo(mapInstance);

  mapInstance.fitBounds(polyline.getBounds(), { padding: [24, 24] });
}

watch(() => props.items.length, renderRoute, { immediate: true });

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
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