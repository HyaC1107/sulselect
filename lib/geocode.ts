// lib/geocode.ts
// 좌표 → 지역명 변환 (Nominatim/OpenStreetMap, 무료·키 없음)

export interface RegionResult {
  region: string;   // "서울특별시 강남구"
  sido: string;     // "서울특별시"
  sigungu: string;  // "강남구"
}

export async function coordToRegion(
  lng: number,
  lat: number
): Promise<RegionResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${lat}&lon=${lng}&format=json&accept-language=ko`;

  const res = await fetch(url, {
    headers: { "User-Agent": "sulselect-app" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const addr = data.address ?? {};

  // 특별시·광역시는 city, 도 지역은 state+city 조합
  const sido =
    addr.city ?? addr.municipality ?? addr.province ?? addr.state ?? "";
  const sigungu =
    addr.city_district ?? addr.borough ?? addr.county ?? addr.suburb ?? "";

  return {
    region: [sido, sigungu].filter(Boolean).join(" "),
    sido,
    sigungu,
  };
}
