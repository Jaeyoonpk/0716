// src/utils/tourDetail.js
// TourAPI 4.0(KorService2)의 상세정보 API(detailCommon2, detailIntro2)를
// 실시간으로 호출해 홈페이지·운영시간·체크인아웃 등을 가져온다.

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

/** contenttypeid별로 다른 필드명을 공통 키로 정규화한다. */
function normalizeIntro(raw, contentTypeId) {
  const type = String(contentTypeId);
  const result = {};

  if (type === '12') {
    // 관광지
    result.usetime = raw.usetime || '';
    result.restdate = raw.restdate || '';
    result.parking = raw.parking || '';
    result.infocenter = raw.infocenter || '';
  } else if (type === '14') {
    // 문화시설
    result.usetime = raw.usetimeculture || '';
    result.restdate = raw.restdateculture || '';
    result.parking = raw.parkingculture || '';
    result.infocenter = raw.infocenterculture || '';
  } else if (type === '15') {
    // 축제공연행사
    result.opentime = raw.usetimefestival || '';
    result.infocenter = raw.sponsor1tel || raw.sponsor2tel || '';
  } else if (type === '32') {
    // 숙박
    result.checkintime = raw.checkintime || '';
    result.checkouttime = raw.checkouttime || '';
    result.parking = raw.parkinglodging || '';
    result.infocenter = raw.infocenterlodging || '';
  } else if (type === '38') {
    // 쇼핑
    result.opentime = raw.opentime || '';
    result.restdate = raw.restdateshopping || '';
    result.parking = raw.parkingshopping || '';
    result.infocenter = raw.infocentershopping || '';
  }

  return result;
}

async function callTourApi(endpoint, params) {
  const apiKey = import.meta.env.VITE_TOUR_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_TOUR_API_KEY가 설정되지 않았습니다.');
  }

  const query = new URLSearchParams({
    serviceKey: apiKey,
    MobileOS: 'ETC',
    MobileApp: 'SeoulGuide',
    _type: 'json',
    ...params
  });

  const res = await fetch(`${BASE_URL}/${endpoint}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`TourAPI 요청 실패 (${res.status})`);
  }

  const data = await res.json();
  const header = data?.response?.header;
  if (header && header.resultCode !== '0000') {
    throw new Error(header.resultMsg || 'TourAPI 오류');
  }

  const item = data?.response?.body?.items?.item;
  if (!item) return null;
  return Array.isArray(item) ? item[0] : item;
}

/**
 * 항목 하나에 대해 공통정보(overview, homepage) + 유형별 소개정보
 * (운영시간, 체크인/아웃 등)를 함께 가져와 하나의 객체로 합쳐 반환한다.
 * 실패하면 null을 반환하며, 호출부는 기존 목록 데이터만으로 표시를 이어간다.
 */
export async function fetchTourDetail(contentId, contentTypeId) {
  if (!contentId || !contentTypeId) return null;

  try {
    const [common, intro] = await Promise.all([
      callTourApi('detailCommon2', {
        contentId,
        defaultYN: 'Y',
        overviewYN: 'Y',
        firstImageYN: 'N',
        addrinfoYN: 'N',
        mapinfoYN: 'N',
        areacodeYN: 'N',
        catcodeYN: 'N',
        numOfRows: 1,
        pageNo: 1
      }),
      callTourApi('detailIntro2', {
        contentId,
        contentTypeId,
        numOfRows: 1,
        pageNo: 1
      })
    ]);

    const introNormalized = intro ? normalizeIntro(intro, contentTypeId) : {};
    console.log('[TourAPI 디버그] contentTypeId:', contentTypeId);
    console.log('[TourAPI 디버그] detailIntro2 원본:', intro);
    console.log('[TourAPI 디버그] 정규화 결과:', introNormalized);

    return {
      overview: common?.overview || '',
      homepage: common?.homepage || '',
      tel: common?.tel || '',
      ...introNormalized
    };
  } catch (err) {
    console.error('TourAPI 상세정보 조회 실패:', err);
    return null;
  }
}