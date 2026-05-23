// app/page.tsx
"use client";

import { useState } from "react";

type NaverPlace = {
  name: string;
  category: string;
  roadAddress: string;
  address: string;
  telephone: string;
  mapLink: string;
};

type Pick = { name: string; tag: string; pair: string; places: NaverPlace[] };
type Result = { region: string; month: number; picks: Pick[] };

export default function Home() {
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spin = () => {
    setError(null);
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
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setTimeout(() => {
            setResult(data);
            setSpinning(false);
            setLoading(false);
          }, 1200);
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
    <main className="wrap">
      <h1 className="title">오늘의 안주 룰렛</h1>
      <p className="sub">내 동네 제철 안주 + 근처 맛집까지 한번에</p>

      <div className="counts">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            className={`chip ${count === n ? "on" : ""}`}
            onClick={() => setCount(n)}
          >
            {n}개
          </button>
        ))}
      </div>

      <button className="spin" onClick={spin} disabled={loading}>
        {spinning ? "두구두구..." : "안주 뽑기!"}
      </button>

      {error && <p className="err">{error}</p>}

      {result && !spinning && (
        <div className="results">
          <div className="region">📍 {result.region} · {result.month}월 제철</div>

          {result.picks.map((pick, i) => (
            <div
              key={i}
              className="pick-card"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="pick-header">
                <span className="pick-name">{pick.name}</span>
                <span className="pick-meta">{pick.tag} · {pick.pair} 추천</span>
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
                      <div className="place-top">
                        <span className="place-name">{place.name}</span>
                        <span className="naver-badge">네이버지도 →</span>
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
                  className="search-fallback"
                  href={`https://map.naver.com/p/search/${encodeURIComponent(
                    `${result.region.split(" ").slice(-1)[0]} ${pick.name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  네이버지도에서 "{pick.name}" 직접 검색하기 →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.2rem;
          padding: 2rem;
          background: radial-gradient(circle at 50% 0%, #2a1a3e, #120b1f 70%);
          color: #fff;
          font-family: system-ui, sans-serif;
        }
        .title {
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(90deg, #ffd166, #ff70a6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .sub { opacity: 0.7; font-size: 0.95rem; }
        .counts { display: flex; gap: 0.5rem; }
        .chip {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          border: 1px solid #ffffff33;
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: 0.2s;
        }
        .chip.on { background: #ff70a6; border-color: #ff70a6; font-weight: 700; }
        .spin {
          margin-top: 0.5rem;
          padding: 1rem 2.5rem;
          font-size: 1.2rem;
          font-weight: 800;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #ffd166, #ff70a6);
          color: #1a1a2e;
          cursor: pointer;
          box-shadow: 0 8px 30px #ff70a655;
          transition: transform 0.15s;
        }
        .spin:active { transform: scale(0.96); }
        .spin:disabled { opacity: 0.6; }
        .err { color: #ff8fa3; font-size: 0.9rem; }

        .results {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .region { font-size: 0.9rem; opacity: 0.75; }

        .pick-card {
          background: #ffffff0d;
          border: 1px solid #ffffff1a;
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          opacity: 0;
          animation: pop 0.4s forwards;
        }
        .pick-header {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 1.2rem 1.4rem;
          border-bottom: 1px solid #ffffff10;
        }
        .pick-name { font-size: 1.4rem; font-weight: 800; }
        .pick-meta { font-size: 0.85rem; opacity: 0.6; }

        .places { display: flex; flex-direction: column; }
        .places-label {
          padding: 0.75rem 1.4rem 0.3rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          opacity: 0.45;
        }
        .place-row {
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
          padding: 0.75rem 1.4rem;
          border-top: 1px solid #ffffff08;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }
        .place-row:hover { background: #ffffff0a; }
        .place-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .place-name { font-size: 1rem; font-weight: 700; }
        .naver-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: #03c75a;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .place-cat { font-size: 0.76rem; opacity: 0.45; }
        .place-addr { font-size: 0.82rem; opacity: 0.7; }
        .place-tel { font-size: 0.78rem; opacity: 0.5; }

        .search-fallback {
          display: block;
          padding: 1rem 1.4rem;
          font-size: 0.88rem;
          color: #03c75a;
          text-decoration: none;
          opacity: 0.75;
          transition: opacity 0.15s;
        }
        .search-fallback:hover { opacity: 1; }

        @keyframes pop {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}
