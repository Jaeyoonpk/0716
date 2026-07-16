<script setup>
const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  itemLabel: {
    type: String,
    default: '장소'
  }
});

const emit = defineEmits(['select']);
</script>

<template>
  <div class="board-list">
    <div v-if="posts.length === 0" class="empty-state">
      아직 등록된 {{ itemLabel }}이(가) 없습니다. 첫 게시글을 남겨보세요.
    </div>

    <button
      v-for="post in posts"
      :key="post.id"
      type="button"
      class="post-item"
      @click="emit('select', post)"
    >
      <div class="post-header">
        <strong>{{ post.title }}</strong>
        <span class="rating">⭐ {{ post.rating }}</span>
      </div>
      <p class="content">{{ post.content }}</p>
      <p v-if="post.address" class="address">📍 {{ post.address }}</p>
      <div class="post-meta">
        <span v-if="post.price" class="price">💰 {{ post.price }}</span>
        <span v-if="post.facilities" class="facilities">🏷️ {{ post.facilities }}</span>
        <span class="date">{{ new Date(post.createdAt).toLocaleString('ko-KR') }}</span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.board-list {
  display: grid;
  gap: 0.75rem;
}

.post-item {
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.9rem;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.2s;
}

.post-item:hover {
  background: #f3f4f6;
}

.post-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.4rem;
}

.rating {
  font-size: 0.9rem;
  color: #f59e0b;
}

.content {
  margin: 0.4rem 0;
  color: #4b5563;
}

.address {
  margin: 0 0 0.4rem;
  color: #2563eb;
  font-size: 0.85rem;
}

.post-meta {
  display: flex;
  gap: 0.8rem;
  font-size: 0.85rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.price {
  font-weight: 600;
  color: #059669;
}

.empty-state {
  color: #6b7280;
  padding: 1rem 0;
}
</style>