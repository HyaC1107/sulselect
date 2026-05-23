// lib/naver.ts

export interface NaverPlace {
  name: string;
  category: string;
  roadAddress: string;
  address: string;
  telephone: string;
  mapLink: string;
}

const STRIP_HTML = /<[^>]+>/g;

export async function searchPlaces(
  sigungu: string,
  keyword: string,
  display = 5
): Promise<NaverPlace[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 없음");

  const q = encodeURIComponent(`${sigungu} ${keyword} 맛집`);
  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${q}&display=${display}&sort=comment`,
    {
      headers: {
        "X-Naver-Client-Id": id,
        "X-Naver-Client-Secret": secret,
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    name: item.title.replace(STRIP_HTML, ""),
    category: item.category,
    roadAddress: item.roadAddress,
    address: item.address,
    telephone: item.telephone,
    mapLink:
      item.link ||
      `https://map.naver.com/p/search/${encodeURIComponent(item.title.replace(STRIP_HTML, ""))}`,
  }));
}
