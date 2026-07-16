<script setup>
import { computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';

const props = defineProps({
  festivals: {
    type: Array,
    default: () => []
  }
});

/** TourAPI의 YYYYMMDD 문자열을 FullCalendar가 읽는 YYYY-MM-DD로 변환 */
function toIsoDate(raw) {
  if (!raw || String(raw).length !== 8) return null;
  const s = String(raw);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

const events = computed(() =>
  props.festivals
    .map((f) => {
      const start = toIsoDate(f.eventstartdate);
      if (!start) return null;
      const end = toIsoDate(f.eventenddate) || start;
      return {
        title: f.title,
        start,
        end,
        allDay: true
      };
    })
    .filter(Boolean)
);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  height: 'auto',
  locale: 'ko',
  events: events.value,
  eventColor: '#7A3B3B'
}));
</script>

<template>
  <div class="festival-calendar">
    <p v-if="events.length === 0" class="empty">표시할 축제 일정 정보(eventstartdate)가 없습니다.</p>
    <FullCalendar v-else :options="calendarOptions" />
  </div>
</template>

<style scoped>
.festival-calendar {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 2rem;
}

.empty {
  color: #6b7280;
  font-size: 0.9rem;
  padding: 1rem 0;
}
</style>