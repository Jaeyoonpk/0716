<script setup>
import { onMounted, ref } from 'vue';
import { fetchSeoulWeather } from '../utils/weather';

const weather = ref(null);
const loading = ref(true);

onMounted(async () => {
  weather.value = await fetchSeoulWeather();
  loading.value = false;
});
</script>

<template>
  <div v-if="loading" class="weather-card loading">
    <span>날씨 불러오는 중...</span>
  </div>

  <div v-else-if="weather" class="weather-card">
    <div class="weather-top">
      <div class="weather-location">
        <span class="location-pin">📍</span>
        <span>{{ weather.location }}</span>
      </div>
      <div class="weather-condition">{{ weather.weatherLabel }}</div>
    </div>

    <div class="weather-main">
      <span class="weather-icon">{{ weather.weatherIcon }}</span>
      <span class="weather-temp">{{ weather.temperature }}°</span>
    </div>

    <div class="weather-sub">
      <span>최고 {{ weather.tempMax }}° · 최저 {{ weather.tempMin }}°</span>
      <span class="dot">·</span>
      <span>습도 {{ weather.humidity }}%</span>
    </div>

    <div class="weather-dust">
      <div :class="['dust-item', weather.pm10Grade.color]">
        <span class="dust-label">미세먼지</span>
        <span class="dust-value">{{ weather.pm10Grade.grade }}</span>
        <span class="dust-number">{{ weather.pm10 }}㎍/㎥</span>
      </div>
      <div :class="['dust-item', weather.pm25Grade.color]">
        <span class="dust-label">초미세먼지</span>
        <span class="dust-value">{{ weather.pm25Grade.grade }}</span>
        <span class="dust-number">{{ weather.pm25 }}㎍/㎥</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-card {
  background: linear-gradient(160deg, #5EC4E0 0%, #4FAECB 45%, #3DAE7F 100%);
  border-radius: 24px;
  padding: 1.6rem 1.8rem;
  color: white;
  margin-bottom: 1.6rem;
  box-shadow: 0 10px 28px rgba(62, 111, 196, 0.28);
}

.weather-card.loading {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink-faint);
  padding: 1.4rem;
  text-align: center;
  font-size: 0.9rem;
}

.weather-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.92rem;
  font-weight: 600;
  opacity: 0.95;
  margin-bottom: 0.8rem;
}

.weather-location {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
}

.weather-icon {
  font-size: 3.2rem;
  line-height: 1;
}

.weather-temp {
  font-size: 4rem;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.02em;
}

.weather-sub {
  font-size: 0.92rem;
  font-weight: 500;
  opacity: 0.92;
  margin-bottom: 1.1rem;
}

.weather-sub .dot {
  margin: 0 0.4rem;
}

.weather-dust {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.dust-item {
  flex: 1;
  min-width: 140px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dust-label {
  font-size: 0.72rem;
  opacity: 0.85;
  font-weight: 600;
}

.dust-value {
  font-size: 1.05rem;
  font-weight: 800;
}

.dust-item.good .dust-value {
  color: #BFEFDB;
}

.dust-item.moderate .dust-value {
  color: #FFF3B0;
}

.dust-item.bad .dust-value {
  color: #FFD1A6;
}

.dust-item.very-bad .dust-value {
  color: #FFB4B4;
}

.dust-number {
  font-size: 0.75rem;
  opacity: 0.85;
}

@media (max-width: 480px) {
  .weather-card {
    padding: 1.3rem 1.4rem;
  }

  .weather-temp {
    font-size: 3.2rem;
  }

  .weather-icon {
    font-size: 2.6rem;
  }
}
</style>