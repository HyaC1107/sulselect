// app/api/recommend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { coordToRegion } from "@/lib/geocode";
import { searchPlaces, NaverPlace } from "@/lib/naver";
import seasonal from "@/data/seasonal.json";

type Anju = { name: string; tag: string; pair: string; type: string };
type Pick = Anju & { places: NaverPlace[] };

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(i, 1)[0]);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, count = 1, category = "전체" } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "위경도가 필요합니다." }, { status: 400 });
    }

    const region = await coordToRegion(lng, lat);
    const sigungu = region?.sigungu ?? region?.sido ?? "";

    const month = String(new Date().getMonth() + 1);
    const all = (seasonal as Record<string, Anju[]>)[month] ?? [];
    const filtered = category === "전체" ? all : all.filter((a) => a.type === category);
    const pool = filtered.length > 0 ? filtered : all;

    const picks = pickRandom(pool, Math.min(Math.max(Number(count), 1), 3));

    const picksWithPlaces: Pick[] = await Promise.all(
      picks.map(async (anju) => {
        const places = sigungu ? await searchPlaces(sigungu, anju.name) : [];
        return { ...anju, places };
      })
    );

    return NextResponse.json({
      region: region?.region ?? "우리 동네",
      month: Number(month),
      picks: picksWithPlaces,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "추천 실패ㅠㅠ" }, { status: 500 });
  }
}
