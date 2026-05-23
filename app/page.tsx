"use client";

import { useState, useMemo } from "react";
import seasonalData from "@/data/seasonal.json";

type Category = "전체" | "회/생선" | "해산물" | "채소/나물" | "국물";

const CATEGORIES: { label: Category; emoji: string }[] = [
  { label: "전체", emoji: "🍽️" },
  { label: "회/생선", emoji: "🐟" },
  { label: "해산물", emoji: "🦞" },
  { label: "채소/나물", emoji: "🥬" },
  { label: "국물", emoji: "🍲" },
];

type Anju = { name: string; tag: string; pair: string; type: string };
type NaverPlace = {
  name: string;
  category: string;
  roadAddress: string;
  address: string;
  telephone: string;
  mapLink: string;
};
type Pick = Anju & { places: NaverPlace[] };
type Result = { region: string; month: number; picks: Pick[] };

export default function Home() {
  const [category, setCategory] = useState<Category>("전체");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;

  const seasonalItems = useMemo(() => {
    const all = (seasonalData as Record<string, Anju[]>)[String(currentMonth)] ?? [];
    return category === "전체" ? all : all.filter((a) => a.type === category);
  }, [currentMonth, category]);

  const spin = () => {
    setError(null);
    setResult(null);
    setLoading(true);
    setSpinning(true);

    if (!navigator.geolocation) {
      setError("이 브라우저는 위치를 못 받아와요ㅠ");
      setLoading(false);
      setSpinning(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              count,
              category,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setTimeout(() => {
            setResult(data);
            setSpinning(false);
            setLoading(false);
          }, 1000);
        } catch (e) {
          setError(e instanceof Error ? e.message : "에러났어요");
          setSpinning(false);
          setLoading(false);
        }
      },
      () => {
        setError("위치 권한을 허용해주세요!");
        setLoading(false);
        setSpinning(false);
      }
    );
  };

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-row">
            <span className="logo">술셀렉</span>
            <span className="logo-badge">BETA</span>
          </div>
          <p className="header-sub">제철 안주 + 내 동네 맛집</p>
        </div>
      </header>

      <main className="main">
        {/* 카테고리 */}
        <section className="card">
          <h2 className="card-title">카테고리</h2>
          <div className="cats">
            {CATEGORIES.map(({ label, emoji }) => (
              <button
                key={label}
                className={`cat-btn ${category === label ? "active" : ""}`}
                onClick={() => {
                  setCategory(label);
                  setResult(null);
                }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 이번 달 제철 */}
        <section className="card">
          <div className="title-row">
            <h2 className="card-title">{currentMonth}월 제철 안주</h2>
            <span className="green-badge">{seasonalItems.length}개</span>
          </div>
          {seasonalItems.length > 0 ? (
            <ul className="s-list">
              {seasonalItems.map((item, i) => (
                <li key={i} className="s-item">
                  <div className="s-left">
                    <span className="s-name">{item.name}</span>
                    <span className="s-tag">{item.tag}</span>
                  </div>
                  <span className="pair-badge">{item.pair}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{currentMonth}월엔 해당 카테고리 제철 안주가 없어요</p>
          )}
        </section>

        {/* 뽑기 */}
        <section className="card">
          <h2 className="card-title">몇 개 뽑을까요?</h2>
          <div className="count-row">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`count-btn ${count === n ? "active" : ""}`}
                onClick={() => setCount(n)}
              >
                {n}개
              </button>
            ))}
          </div>
          <button
            className="spin-btn"
            onClick={spin}
            disabled={loading || seasonalItems.length === 0}
          >
            {spinning ? "뽑는 중..." : "🎰  안주 뽑기!"}
          </button>
        </section>

        {error && <div className="err-box">{error}</div>}

        {/* 결과 */}
        {result && !spinning && (
          <section className="result-wrap">
            <div className="result-meta">
              <span className="result-region">📍 {result.region}</span>
              <span className="green-badge">{result.month}월 제철</span>
            </div>

            {result.picks.map((pick, i) => (
              <div
                key={i}
                className="pick-card"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="pick-top">
                  <div>
                    <div className="pick-name">{pick.name}</div>
                    <div className="pick-sub">{pick.tag} · {pick.pair} 추천</div>
                  </div>
                  <span className="type-badge">{pick.type}</span>
                </div>

                {pick.places.length > 0 ? (
                  <div className="places">
                    <div className="places-label">근처 맛집</div>
                    {pick.places.map((place, j) => (
                      <a
                        key={j}
                        href={place.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="place-row"
                      >
                        <div className="place-name-row">
                          <span className="place-name">{place.name}</span>
                          <span className="naver-link">네이버지도 →</span>
                        </div>
                        {place.category && (
                          <span className="place-cat">{place.category}</span>
                        )}
                        <span className="place-addr">
                          {place.roadAddress || place.address}
                        </span>
                        {place.telephone && (
                          <span className="place-tel">{place.telephone}</span>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    className="fallback-link"
                    href={`https://map.naver.com/p/search/${encodeURIComponent(
                      `${result.region.split(" ").slice(-1)[0]} ${pick.name}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    네이버지도에서 &ldquo;{pick.name}&rdquo; 검색하기 →
                  </a>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .app {
          min-height: 100vh;
          background: #f5f6f7;
          font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
          color: #1a1a1a;
        }

        /* 헤더 */
        .header {
          background: #fff;
          border-bottom: 1px solid #e8e8e8;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-inner {
          max-width: 480px;
          margin: 0 auto;
          padding: 0.9rem 1.2rem 0.7rem;
        }
        .logo-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.15rem; }
        .logo { font-size: 1.3rem; font-weight: 800; color: #03c75a; letter-spacing: -0.03em; }
        .logo-badge {
          font-size: 0.6rem;
          font-weight: 700;
          color: #fff;
          background: #03c75a;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          letter-spacing: 0.03em;
        }
        .header-sub { font-size: 0.75rem; color: #999; }

        /* 메인 */
        .main {
          max-width: 480px;
          margin: 0 auto;
          padding: 0.85rem 0.9rem 5rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        /* 카드 공통 */
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 1.1rem 1.15rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        }
        .card-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #444;
          margin-bottom: 0.85rem;
        }
        .title-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.85rem;
        }
        .title-row .card-title { margin-bottom: 0; }

        /* 뱃지 */
        .green-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: #03c75a;
          background: #e8f9f0;
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
        }

        /* 카테고리 */
        .cats { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .cat-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          border: 1.5px solid #e8e8e8;
          background: #fff;
          font-size: 0.8rem;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          transition: all 0.13s;
          white-space: nowrap;
        }
        .cat-btn:hover { border-color: #03c75a; color: #03c75a; }
        .cat-btn.active {
          background: #03c75a;
          border-color: #03c75a;
          color: #fff;
          font-weight: 700;
        }

        /* 제철 리스트 */
        .s-list { list-style: none; }
        .s-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid #f2f2f2;
        }
        .s-item:last-child { border-bottom: none; }
        .s-left { display: flex; flex-direction: column; gap: 0.08rem; }
        .s-name { font-size: 0.92rem; font-weight: 600; }
        .s-tag { font-size: 0.72rem; color: #aaa; }
        .pair-badge {
          font-size: 0.71rem;
          font-weight: 700;
          color: #03c75a;
          background: #e8f9f0;
          padding: 0.18rem 0.5rem;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .empty { font-size: 0.85rem; color: #bbb; text-align: center; padding: 0.8rem 0; }

        /* 뽑기 */
        .count-row { display: flex; gap: 0.45rem; margin-bottom: 0.85rem; }
        .count-btn {
          flex: 1;
          padding: 0.55rem;
          border-radius: 8px;
          border: 1.5px solid #e8e8e8;
          background: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.13s;
        }
        .count-btn:hover { border-color: #03c75a; color: #03c75a; }
        .count-btn.active { background: #03c75a; border-color: #03c75a; color: #fff; }

        .spin-btn {
          width: 100%;
          padding: 0.95rem;
          border: none;
          border-radius: 10px;
          background: #03c75a;
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.13s, transform 0.1s;
          box-shadow: 0 3px 12px rgba(3,199,90,0.28);
          letter-spacing: -0.01em;
        }
        .spin-btn:hover { background: #02b350; }
        .spin-btn:active { transform: scale(0.98); }
        .spin-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .err-box {
          background: #fff1f2;
          color: #c92a2a;
          font-size: 0.83rem;
          padding: 0.7rem 1rem;
          border-radius: 8px;
          border: 1px solid #ffc9c9;
        }

        /* 결과 */
        .result-wrap { display: flex; flex-direction: column; gap: 0.7rem; }
        .result-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.2rem;
        }
        .result-region { font-size: 0.88rem; font-weight: 600; color: #444; }

        .pick-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          opacity: 0;
          animation: fadeUp 0.3s forwards;
        }
        .pick-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1rem 1.15rem;
          border-bottom: 1px solid #f2f2f2;
        }
        .pick-name { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.18rem; }
        .pick-sub { font-size: 0.78rem; color: #999; }
        .type-badge {
          font-size: 0.69rem;
          font-weight: 600;
          color: #888;
          background: #f2f2f2;
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .places { display: flex; flex-direction: column; }
        .places-label {
          padding: 0.6rem 1.15rem 0.2rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: #bbb;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .place-row {
          display: flex;
          flex-direction: column;
          gap: 0.13rem;
          padding: 0.65rem 1.15rem;
          border-top: 1px solid #f5f5f5;
          text-decoration: none;
          color: inherit;
          transition: background 0.1s;
        }
        .place-row:hover { background: #fafafa; }
        .place-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .place-name { font-size: 0.92rem; font-weight: 700; }
        .naver-link {
          font-size: 0.68rem;
          font-weight: 700;
          color: #03c75a;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .place-cat { font-size: 0.71rem; color: #bbb; }
        .place-addr { font-size: 0.78rem; color: #777; }
        .place-tel { font-size: 0.73rem; color: #aaa; }

        .fallback-link {
          display: block;
          padding: 0.85rem 1.15rem;
          font-size: 0.83rem;
          font-weight: 600;
          color: #03c75a;
          text-decoration: none;
        }
        .fallback-link:hover { text-decoration: underline; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
