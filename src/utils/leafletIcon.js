// Vite 환경에서 Leaflet 기본 마커 아이콘 경로가 깨지는 문제를 해결하는 유틸리티.
// Leaflet 지도를 쓰는 모든 컴포넌트에서 이 함수를 한 번씩 호출한다.
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let initialized = false;

export function setupLeafletIcons() {
  if (initialized) return;
  initialized = true;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
  });
}