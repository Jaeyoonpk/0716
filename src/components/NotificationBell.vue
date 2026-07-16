<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { loadPosts } from '../utils/storage';

const categories = ['accommodations', 'touristSites', 'culture', 'festivals', 'shopping'];
const hasNew = ref(false);
const message = ref('');
let lastCounts = {};
let pollTimer = null;

function currentCounts() {
  const counts = {};
  categories.forEach((cat) => {
    counts[cat] = loadPosts(`community-posts-${cat}`).length;
  });
  return counts;
}

function checkForUpdates() {
  const current = currentCounts();
  categories.forEach((cat) => {
    if (lastCounts[cat] !== undefined && current[cat] > lastCounts[cat]) {
      hasNew.value = true;
      message.value = '새 게시글이 등록되었습니다.';
    }
  });
  lastCounts = current;
}

function handleStorageEvent(e) {
  if (e.key && e.key.startsWith('community-posts-')) {
    checkForUpdates();
  }
}

function dismiss() {
  hasNew.value = false;
}

onMounted(() => {
  lastCounts = currentCounts();
  // polling: 15초 간격으로 데이터 변경 여부를 확인
  pollTimer = setInterval(checkForUpdates, 15000);
  // 다른 브라우저 탭에서 글을 쓴 경우도 즉시 반영
  window.addEventListener('storage', handleStorageEvent);
});

onUnmounted(() => {
  clearInterval(pollTimer);
  window.removeEventListener('storage', handleStorageEvent);
});
</script>

<template>
  <transition name="fade">
    <div v-if="hasNew" class="notification-toast" role="alert" @click="dismiss">
      🔔 {{ message }}
    </div>
  </transition>
</template>

<style scoped>
.notification-toast {
  position: fixed;
  top: 1.2rem;
  right: 1.2rem;
  background: #201c19;
  color: #f4efe6;
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  font-size: 0.88rem;
  cursor: pointer;
  z-index: 4000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>