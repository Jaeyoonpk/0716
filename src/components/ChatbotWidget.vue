<script setup>
import { ref, computed, nextTick } from 'vue';
import { getChatbotReply } from '../utils/chatbotService';

const props = defineProps({
  regionData: {
    type: Object,
    default: () => ({})
  }
});

const STORAGE_KEY = 'seoul-guide-chat-history';

const isOpen = ref(false);
const messages = ref(loadHistory());
const inputText = ref('');
const isLoading = ref(false);
const messagesListRef = ref(null);

const canSend = computed(() => inputText.value.trim().length > 0 && !isLoading.value);

function loadHistory() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // 세션 스토리지 접근 실패 시 무시하고 기본값 사용
  }
  return [
    {
      role: 'assistant',
      content:
        '안녕하세요! 서울 여행 가이드 챗봇이에요 😊\n숙박, 관광지, 문화시설, 축제, 쇼핑 정보를 물어보세요.\n예) "홍대 근처 숙소 추천해줘", "이번 달 축제 알려줘"'
    }
  ];
}

function saveHistory() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value.slice(-30)));
  } catch (e) {
    // 저장 실패는 치명적이지 않으므로 무시
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesListRef.value) {
    messagesListRef.value.scrollTop = messagesListRef.value.scrollHeight;
  }
}

function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) scrollToBottom();
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  isLoading.value = true;
  saveHistory();
  scrollToBottom();

  try {
    const reply = await getChatbotReply(text, props.regionData, messages.value);
    messages.value.push({ role: 'assistant', content: reply });
  } catch (err) {
    console.error('챗봇 응답 오류:', err);
    messages.value.push({
      role: 'assistant',
      // TODO: 원인 파악 후 아래를 다시 사용자 친화적 메시지로 되돌리세요.
      content: `⚠️ [디버그] ${err?.message || err}`
    });
  } finally {
    isLoading.value = false;
    saveHistory();
    scrollToBottom();
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function clearChat() {
  messages.value = loadHistory().slice(0, 1);
  sessionStorage.removeItem(STORAGE_KEY);
}
</script>

<template>
  <div class="chatbot-root">
    <!-- 플로팅 버튼 -->
    <button
      class="chat-fab"
      :class="{ hidden: isOpen }"
      @click="toggleChat"
      aria-label="챗봇 열기"
    >
      💬
    </button>

    <!-- 채팅 패널 -->
    <transition name="chat-fade">
      <div v-if="isOpen" class="chat-panel">
        <header class="chat-header">
          <div class="chat-header-title">
            <span class="chat-header-icon">🤖</span>
            <span>서울 여행 도우미</span>
          </div>
          <div class="chat-header-actions">
            <button class="icon-btn" title="대화 초기화" @click="clearChat">🗑️</button>
            <button class="icon-btn" title="닫기" @click="toggleChat">✕</button>
          </div>
        </header>

        <div ref="messagesListRef" class="chat-messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="['chat-bubble-row', msg.role]"
          >
            <div class="chat-bubble">{{ msg.content }}</div>
          </div>

          <div v-if="isLoading" class="chat-bubble-row assistant">
            <div class="chat-bubble typing">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </div>

        <div class="chat-input-row">
          <textarea
            v-model="inputText"
            class="chat-input"
            placeholder="궁금한 점을 입력하세요..."
            rows="1"
            @keydown="handleKeydown"
          ></textarea>
          <button class="chat-send-btn" :disabled="!canSend" @click="sendMessage">
            ➤
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.chatbot-root {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 3000;
  font-family: 'Noto Sans KR', sans-serif;
}

.chat-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--accent, #57cc99) 0%, var(--accent-strong, #3dae7f) 100%);
  color: white;
  font-size: 1.6rem;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(45, 95, 124, 0.35);
  transition: transform 0.2s;
}

.chat-fab:hover {
  transform: scale(1.08);
}

.chat-fab.hidden {
  display: none;
}

.chat-panel {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 360px;
  max-width: calc(100vw - 2rem);
  height: 520px;
  max-height: calc(100vh - 3rem);
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, var(--accent, #57cc99) 0%, var(--accent-strong, #3dae7f) 100%);
  color: white;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.chat-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.chat-header-actions {
  display: flex;
  gap: 0.4rem;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  background: #f5f7fa;
}

.chat-bubble-row {
  display: flex;
}

.chat-bubble-row.user {
  justify-content: flex-end;
}

.chat-bubble-row.assistant {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 78%;
  padding: 0.7rem 1rem;
  border-radius: 14px;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-bubble-row.user .chat-bubble {
  background: linear-gradient(135deg, var(--accent, #57cc99) 0%, var(--accent-strong, #3dae7f) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-bubble-row.assistant .chat-bubble {
  background: white;
  color: #333;
  border: 1px solid #e5e5e5;
  border-bottom-left-radius: 4px;
}

.chat-bubble.typing {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: blink 1.4s infinite both;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0.2; }
  40% { opacity: 1; }
}

.chat-input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.8rem;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  background: white;
}

.chat-input {
  flex: 1;
  resize: none;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  font-family: inherit;
  max-height: 90px;
}

.chat-input:focus {
  outline: none;
  border-color: var(--accent, #57cc99);
}

.chat-send-btn {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent, #57cc99) 0%, var(--accent-strong, #3dae7f) 100%);
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
}

.chat-send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 모바일 대응 */
@media (max-width: 480px) {
  .chat-panel {
    right: 0.75rem;
    bottom: 0.75rem;
    width: calc(100vw - 1.5rem);
    height: calc(100vh - 5.5rem);
  }

  .chat-fab {
    width: 54px;
    height: 54px;
    font-size: 1.4rem;
  }
}
</style>