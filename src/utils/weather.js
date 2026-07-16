// src/utils/weather.js
// Open-Meteo(무료, 키 불필요)로 서울 시청 인근의 현재 날씨와 미세먼지 정보를 가져온다.
// https://open-meteo.com (비영리/교육 목적 무료, CC BY 4.0 출처 표기 필요)

// 서울특별시청 좌표를 기준으로 함
const SEOUL_LAT = 37.5665;
const SEOUL_LON = 126.978;
export const SEOUL_LOCATION_LABEL = '서울특별시 중구 (시청 기준)';

// WMO 날씨 코드 → 한국어 설명 + 이모지
const WEATHER_CODE_MAP = {
  0: { label: '맑음', icon: '☀️' },
  1: { label: '대체로 맑음', icon: '🌤️' },
  2: { label: '구름 조금', icon: '⛅' },
  3: { label: '흐림', icon: '☁️' },
  45: { label: '안개', icon: '🌫️' },
  48: { label: '서리 안개', icon: '🌫️' },
  51: { label: '이슬비(약함)', icon: '🌦️' },
  53: { label: '이슬비', icon: '🌦️' },
  55: { label: '이슬비(강함)', icon: '🌧️' },
  61: { label: '비(약함)', icon: '🌧️' },
  63: { label: '비', icon: '🌧️' },
  65: { label: '비(강함)', icon: '🌧️' },
  71: { label: '눈(약함)', icon: '🌨️' },
  73: { label: '눈', icon: '🌨️' },
  75: { label: '눈(강함)', icon: '❄️' },
  80: { label: '소나기(약함)', icon: '🌦️' },
  81: { label: '소나기', icon: '🌧️' },
  82: { label: '소나기(강함)', icon: '⛈️' },
  95: { label: '뇌우', icon: '⛈️' },
  96: { label: '뇌우(우박 동반)', icon: '⛈️' },
  99: { label: '뇌우(강한 우박)', icon: '⛈️' }
};

function describeWeatherCode(code) {
  return WEATHER_CODE_MAP[code] || { label: '정보 없음', icon: '🌡️' };
}

/** 한국 에어코리아 통합대기환경지수 기준(간이)으로 등급을 매긴다. */
function gradePm10(value) {
  if (value <= 30) return { grade: '좋음', color: 'good' };
  if (value <= 80) return { grade: '보통', color: 'moderate' };
  if (value <= 150) return { grade: '나쁨', color: 'bad' };
  return { grade: '매우나쁨', color: 'very-bad' };
}

function gradePm25(value) {
  if (value <= 15) return { grade: '좋음', color: 'good' };
  if (value <= 35) return { grade: '보통', color: 'moderate' };
  if (value <= 75) return { grade: '나쁨', color: 'bad' };
  return { grade: '매우나쁨', color: 'very-bad' };
}

/**
 * 서울(시청 기준)의 현재 날씨 + 미세먼지 정보와 오늘의 최고/최저기온을 가져온다.
 * 실패 시 null을 반환하며, 호출부는 위젯을 조용히 숨기면 된다.
 */
export async function fetchSeoulWeather() {
  try {
    const [weatherRes, airRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${SEOUL_LAT}&longitude=${SEOUL_LON}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code` +
          `&daily=temperature_2m_max,temperature_2m_min` +
          `&timezone=Asia%2FSeoul`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${SEOUL_LAT}&longitude=${SEOUL_LON}` +
          `&current=pm10,pm2_5&timezone=Asia%2FSeoul`
      )
    ]);

    if (!weatherRes.ok || !airRes.ok) {
      throw new Error('날씨/미세먼지 API 요청 실패');
    }

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();

    const current = weatherData.current;
    const air = airData.current;
    const weatherInfo = describeWeatherCode(current.weather_code);
    const pm10 = Math.round(air.pm10);
    const pm25 = Math.round(air.pm2_5);

    return {
      location: SEOUL_LOCATION_LABEL,
      temperature: Math.round(current.temperature_2m),
      tempMax: Math.round(weatherData.daily.temperature_2m_max[0]),
      tempMin: Math.round(weatherData.daily.temperature_2m_min[0]),
      humidity: Math.round(current.relative_humidity_2m),
      weatherLabel: weatherInfo.label,
      weatherIcon: weatherInfo.icon,
      pm10,
      pm10Grade: gradePm10(pm10),
      pm25,
      pm25Grade: gradePm25(pm25)
    };
  } catch (err) {
    console.error('날씨 정보 조회 실패:', err);
    return null;
  }
}