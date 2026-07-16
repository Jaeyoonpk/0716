<script setup>
import { onMounted, ref, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import { loadPosts } from '../utils/storage';

Chart.register(...registerables);

const categories = [
  { id: 'accommodations', label: '숙박' },
  { id: 'touristSites', label: '관광지' },
  { id: 'culture', label: '문화시설' },
  { id: 'festivals', label: '축제' },
  { id: 'shopping', label: '쇼핑' }
];

const canvasRef = ref(null);
let chartInstance = null;

function buildStats() {
  const counts = [];
  const avgRatings = [];

  categories.forEach((cat) => {
    const posts = loadPosts(`community-posts-${cat.id}`);
    counts.push(posts.length);
    const avg = posts.length
      ? posts.reduce((sum, p) => sum + Number(p.rating || 0), 0) / posts.length
      : 0;
    avgRatings.push(Number(avg.toFixed(2)));
  });

  return { counts, avgRatings };
}

function renderChart() {
  if (!canvasRef.value) return;
  const { counts, avgRatings } = buildStats();

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: categories.map((c) => c.label),
      datasets: [
        {
          label: '게시글 수',
          data: counts,
          backgroundColor: '#7A3B3B',
          yAxisID: 'y'
        },
        {
          label: '평균 평점',
          data: avgRatings,
          backgroundColor: '#B8935A',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '게시글 수' }
        },
        y1: {
          beginAtZero: true,
          max: 5,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: '평균 평점' }
        }
      }
    }
  });
}

onMounted(async () => {
  await nextTick();
  renderChart();
});

// 게시글이 추가/삭제된 뒤 상위 컴포넌트에서 refresh()를 호출해 갱신할 수 있음
defineExpose({ refresh: renderChart });
</script>

<template>
  <div class="stats-dashboard">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.stats-dashboard {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.4rem;
}
</style>