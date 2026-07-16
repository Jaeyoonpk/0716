<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import CommunityPostDetail from './CommunityPostDetail.vue';
import CommunityPostForm from './CommunityPostForm.vue';
import CommunityPostList from './CommunityPostList.vue';
import { loadPosts, savePosts } from '../utils/storage';

const categories = [
  { id: 'accommodations', label: '숙박', itemLabel: '숙소' },
  { id: 'touristSites', label: '관광지', itemLabel: '관광지' },
  { id: 'culture', label: '문화시설', itemLabel: '문화시설' },
  { id: 'festivals', label: '축제', itemLabel: '축제' },
  { id: 'shopping', label: '쇼핑', itemLabel: '쇼핑 장소' }
];

const props = defineProps({
  initialCategory: {
    type: String,
    default: 'accommodations'
  }
});

const activeCategory = ref(props.initialCategory);
const postsByCategory = reactive({});
const selectedPostId = ref(null);
const viewMode = ref('list');
const formMode = ref('create');
const errorMessage = ref('');

const activeCategoryInfo = computed(
  () => categories.find((c) => c.id === activeCategory.value) || categories[0]
);

const posts = computed(() => postsByCategory[activeCategory.value] || []);

const selectedPost = computed(() => {
  return posts.value.find((post) => post.id === selectedPostId.value) || null;
});

function storageKey(categoryId) {
  return `community-posts-${categoryId}`;
}

onMounted(() => {
  categories.forEach((cat) => {
    const stored = loadPosts(storageKey(cat.id));
    postsByCategory[cat.id] = stored.length > 0 ? stored : seedSample(cat.id);
  });
});

function seedSample(categoryId) {
  const now = new Date().toISOString();
  const seeds = {
    accommodations: [
      {
        title: '강남역 근처 깨끗한 숙소',
        content: '강남역 3번 출구 도보 5분 거리, 매우 깨끗하고 조용함',
        address: '서울특별시 강남구 강남대로 396',
        price: '120,000원',
        rating: 4.5,
        facilities: 'WiFi, 에어컨, 세탁기'
      },
      {
        title: '명동 쇼핑거리 게스트하우스',
        content: '명동 중심에 위치, 주변에 카페와 음식점 많음',
        address: '서울특별시 중구 명동길 14',
        price: '50,000원',
        rating: 4.0,
        facilities: 'WiFi, 냉장고, 주방'
      }
    ],
    touristSites: [
      {
        title: '경복궁 야간 개장 다녀왔어요',
        content: '야간 조명이 정말 아름다워요. 사진 찍기 좋습니다.',
        address: '서울특별시 종로구 사직로 161',
        price: '',
        rating: 4.8,
        facilities: '무료 가이드 투어 운영'
      }
    ],
    culture: [
      {
        title: '국립현대미술관 서울관 후기',
        content: '특별전 구성이 알차고 조용히 감상하기 좋아요.',
        address: '서울특별시 종로구 삼청로 30',
        price: '',
        rating: 4.5,
        facilities: '오디오 가이드 대여 가능'
      }
    ],
    festivals: [
      {
        title: '한강 불꽃축제 후기',
        content: '자리 잡기 경쟁이 치열하지만 그만한 가치가 있어요.',
        address: '서울특별시 영등포구 여의동로 330',
        price: '',
        rating: 4.6,
        facilities: '푸드트럭 다수 운영'
      }
    ],
    shopping: [
      {
        title: '동대문 야시장 쇼핑 추천',
        content: '늦은 시간까지 열려있어서 여유롭게 구경했어요.',
        address: '서울특별시 중구 장충단로 275',
        price: '',
        rating: 4.2,
        facilities: '주차 가능'
      }
    ]
  };

  const items = (seeds[categoryId] || []).map((item, idx) => ({
    id: `sample-${categoryId}-${idx}`,
    password: '0000',
    createdAt: now,
    updatedAt: now,
    ...item
  }));

  savePosts(items, storageKey(categoryId));
  return items;
}

function setPosts(categoryId, next) {
  postsByCategory[categoryId] = next;
  savePosts(next, storageKey(categoryId));
}

function switchCategory(id) {
  activeCategory.value = id;
  viewMode.value = 'list';
  selectedPostId.value = null;
  errorMessage.value = '';
}

function openCreate() {
  viewMode.value = 'form';
  formMode.value = 'create';
  selectedPostId.value = null;
  errorMessage.value = '';
}

function selectPost(post) {
  selectedPostId.value = post.id;
  viewMode.value = 'detail';
  errorMessage.value = '';
}

function startEdit(post) {
  selectedPostId.value = post.id;
  viewMode.value = 'form';
  formMode.value = 'edit';
  errorMessage.value = '';
}

function handleSubmit(payload) {
  const categoryId = activeCategory.value;

  if (formMode.value === 'create') {
    const newPost = {
      id: `post-${Date.now()}`,
      title: payload.title,
      content: payload.content,
      address: payload.address,
      price: payload.price,
      rating: payload.rating,
      facilities: payload.facilities,
      password: payload.password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPosts(categoryId, [newPost, ...posts.value]);
    viewMode.value = 'list';
    selectedPostId.value = null;
    errorMessage.value = '';
    return;
  }

  const target = posts.value.find((post) => post.id === selectedPostId.value);
  if (!target) return;

  if (target.password !== payload.password) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  const updated = posts.value.map((post) =>
    post.id === selectedPostId.value
      ? {
          ...post,
          title: payload.title,
          content: payload.content,
          address: payload.address,
          price: payload.price,
          rating: payload.rating,
          facilities: payload.facilities,
          updatedAt: new Date().toISOString()
        }
      : post
  );

  setPosts(categoryId, updated);
  viewMode.value = 'detail';
  errorMessage.value = '';
}

function handleDelete(password) {
  if (!selectedPost.value) return;

  if (selectedPost.value.password !== password) {
    errorMessage.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  const categoryId = activeCategory.value;
  setPosts(
    categoryId,
    posts.value.filter((post) => post.id !== selectedPost.value.id)
  );
  selectedPostId.value = null;
  viewMode.value = 'list';
  errorMessage.value = '';
}

function cancelForm() {
  viewMode.value = 'list';
  errorMessage.value = '';
}

function resetCategoryPosts() {
  const categoryId = activeCategory.value;
  const ok = window.confirm(
    `${activeCategoryInfo.value.label} 게시글을 전부 지우고 샘플 데이터로 초기화할까요? 이 작업은 되돌릴 수 없습니다.`
  );
  if (!ok) return;

  const fresh = seedSample(categoryId);
  postsByCategory[categoryId] = fresh;
  viewMode.value = 'list';
  selectedPostId.value = null;
  errorMessage.value = '';
}

// App.vue 등 상위 컴포넌트에서 "글쓰기로 바로 이동" 시 호출
defineExpose({
  openWriteForm(categoryId) {
    if (categoryId && categories.some((c) => c.id === categoryId)) {
      switchCategory(categoryId);
    }
    openCreate();
  }
});
</script>

<template>
  <section class="board-section">
    <!-- 카테고리 탭 -->
    <div class="category-tabs" role="tablist">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        role="tab"
        :class="['category-tab', { active: activeCategory === cat.id }]"
        @click="switchCategory(cat.id)"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="board-header">
      <div>
        <h2>{{ activeCategoryInfo.label }} 커뮤니티</h2>
        <p>서울의 {{ activeCategoryInfo.itemLabel }} 정보와 후기를 익명으로 공유해보세요.</p>
      </div>
      <div class="board-header-actions">
        <button class="reset-btn" type="button" @click="resetCategoryPosts">
          게시글 초기화
        </button>
        <button class="board-btn" type="button" @click="openCreate">글쓰기</button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-if="viewMode === 'list'">
      <CommunityPostList :posts="posts" :item-label="activeCategoryInfo.itemLabel" @select="selectPost" />
    </div>

    <div v-else-if="viewMode === 'detail' && selectedPost">
      <CommunityPostDetail
        :post="selectedPost"
        @edit="startEdit"
        @delete="handleDelete"
        @close="viewMode = 'list'"
      />
    </div>

    <div v-else-if="viewMode === 'form'">
      <CommunityPostForm
        :mode="formMode"
        :initial-post="selectedPost"
        :item-label="activeCategoryInfo.itemLabel"
        @submit="handleSubmit"
        @cancel="cancelForm"
      />
    </div>
  </section>
</template>

<style scoped>
.board-section {
  background: var(--surface, white);
  border: 1px solid var(--line, #e5e7eb);
  border-radius: 20px;
  padding: 1.4rem;
  box-shadow: 0 4px 16px rgba(25, 31, 28, 0.06);
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;
  border-bottom: 1px solid var(--line, #e5e7eb);
  padding-bottom: 1rem;
}

.category-tab {
  border: 1.5px solid var(--line, #e5e7eb);
  background: var(--paper, #f3f4f6);
  color: var(--ink-soft, #4b5563);
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: inset 0 1px 2px rgba(25, 61, 45, 0.06);
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.category-tab:hover {
  border-color: var(--accent, #57cc99);
  color: var(--accent-strong, #3dae7f);
}

.category-tab.active {
  background: var(--accent, #57cc99);
  border-color: var(--accent, #57cc99);
  color: white;
  box-shadow: 0 4px 14px rgba(87, 204, 153, 0.35);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.board-header h2 {
  color: var(--ink, #111827);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 0.3rem;
}

.board-header p {
  color: var(--ink-soft, #6b7280);
  font-size: 0.88rem;
  margin: 0;
}

.board-header-actions {
  display: flex;
  gap: 0.5rem;
}

.reset-btn {
  border: 1.5px solid var(--line, #d1d5db);
  background: var(--surface, white);
  color: var(--ink-faint, #6b7280);
  padding: 0.65rem 1.1rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
}

.reset-btn:hover {
  border-color: var(--danger, #dc2626);
  color: var(--danger, #dc2626);
}

.board-btn {
  border: 1.5px solid var(--accent, #57cc99);
  background: var(--accent-soft, #dff5ea);
  color: var(--accent-strong, #3dae7f);
  padding: 0.65rem 1.2rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  transition: background 0.15s ease;
}

.board-btn:hover {
  background: var(--accent, #57cc99);
  color: white;
}

.error {
  color: var(--danger, #dc2626);
  font-weight: 600;
  margin-bottom: 0.8rem;
}

@media (max-width: 768px) {
  .board-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }
}
</style>