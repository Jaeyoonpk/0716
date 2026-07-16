<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'create'
  },
  initialPost: {
    type: Object,
    default: null
  },
  itemLabel: {
    type: String,
    default: '장소'
  }
});

const emit = defineEmits(['submit', 'cancel']);

const form = reactive({
  title: '',
  content: '',
  address: '',
  price: '',
  rating: 4,
  facilities: '',
  password: '',
  error: ''
});

watch(
  () => props.initialPost,
  (post) => {
    if (post) {
      form.title = post.title || '';
      form.content = post.content || '';
      form.address = post.address || '';
      form.price = post.price || '';
      form.rating = post.rating || 4;
      form.facilities = post.facilities || '';
      form.password = '';
      form.error = '';
    } else {
      reset();
    }
  },
  { immediate: true }
);

function reset() {
  form.title = '';
  form.content = '';
  form.address = '';
  form.price = '';
  form.rating = 4;
  form.facilities = '';
  form.password = '';
  form.error = '';
}

function submit() {
  if (
    !form.title.trim() ||
    !form.content.trim() ||
    !form.address.trim() ||
    !form.password.trim()
  ) {
    form.error = `${props.itemLabel}명, 설명, 주소, 비밀번호는 필수입니다.`;
    return;
  }

  emit('submit', {
    title: form.title.trim(),
    content: form.content.trim(),
    address: form.address.trim(),
    price: form.price.trim(),
    rating: form.rating,
    facilities: form.facilities.trim(),
    password: form.password.trim()
  });

  form.password = '';
}
</script>

<template>
  <div class="form-box">
    <h3>{{ mode === 'create' ? `${itemLabel} 등록` : `${itemLabel} 수정` }}</h3>

    <label>
      {{ itemLabel }}명
      <input v-model="form.title" type="text" :placeholder="`예: ${itemLabel} 이름`" />
    </label>

    <label>
      설명
      <textarea v-model="form.content" rows="4" :placeholder="`${itemLabel}에 대한 설명이나 후기`"></textarea>
    </label>

    <label>
      주소
      <input
        v-model="form.address"
        type="text"
        placeholder="예: 서울특별시 강남구 강남대로 396"
      />
      <small class="hint">지도에 정확히 표시되도록 도로명 주소를 입력해주세요.</small>
    </label>

    <label>
      가격/비용 (선택)
      <input v-model="form.price" type="text" placeholder="예: 120,000원 또는 무료" />
    </label>

    <label>
      평점 (1-5)
      <input v-model.number="form.rating" type="range" min="1" max="5" step="0.5" />
      <span>{{ form.rating }}⭐</span>
    </label>

    <label>
      특징/시설
      <input v-model="form.facilities" type="text" placeholder="예: WiFi, 가이드 투어, 주차 가능 등" />
    </label>

    <label>
      비밀번호
      <input v-model="form.password" type="password" />
    </label>

    <p v-if="form.error" class="error">{{ form.error }}</p>

    <div class="form-actions">
      <button type="button" @click="submit">{{ mode === 'create' ? '등록' : '수정' }}</button>
      <button class="ghost-btn" type="button" @click="emit('cancel')">취소</button>
    </div>
  </div>
</template>

<style scoped>
.form-box {
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 16px;
  padding: 1.3rem;
  background: var(--paper, #fafafa);
}

.form-box h3 {
  color: var(--ink, #111827);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 1.1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
  color: var(--ink-soft, #374151);
  font-size: 0.88rem;
  font-weight: 600;
}

.hint {
  color: var(--ink-faint, #6b7280);
  font-size: 0.78rem;
  font-weight: 400;
}

input,
textarea {
  padding: 0.7rem 0.8rem;
  border: 1.5px solid var(--line, #cbd5e1);
  border-radius: 12px;
  background: var(--surface, white);
  color: var(--ink, #111827);
  font-family: inherit;
  font-size: 0.92rem;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent, #57cc99);
}

input[type="range"] {
  padding: 0;
}

.form-actions {
  display: flex;
  gap: 0.6rem;
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

.error {
  color: var(--danger, #dc2626);
  font-weight: 600;
}
</style>