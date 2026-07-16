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
  gap: 0.8rem;
}

.post-item {
  text-align: left;
  border: 1.5px solid var(--line, #e5e7eb);
  border-radius: 16px;
  padding: 1rem 1.1rem;
  background: var(--surface, #f9fafb);
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}

.post-item:hover {
  border-color: var(--accent, #57cc99);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.4rem;
}

.post-header strong {
  color: var(--ink, #111827);
}

.rating {
  font-size: 0.9rem;
  color: #f59e0b;
}

.content {
  margin: 0.4rem 0;
  color: var(--ink-soft, #4b5563);
}

.address {
  margin: 0 0 0.4rem;
  color: var(--accent-strong, #3dae7f);
  font-size: 0.85rem;
  font-weight: 600;
}

.post-meta {
  display: flex;
  gap: 0.8rem;
  font-size: 0.85rem;
  color: var(--ink-faint, #6b7280);
  flex-wrap: wrap;
}

.price {
  font-weight: 700;
  color: var(--accent-strong, #059669);
}

.empty-state {
  color: var(--ink-faint, #6b7280);
  padding: 1rem 0;
}
</style>