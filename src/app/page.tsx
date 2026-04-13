"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Widget Config ─── */

interface WidgetConfig {
  id: string;
  title: string;
  icon: string;
  size: "small" | "medium" | "large";
  static?: boolean;
  prompt?: string;
}

const WIDGET_CONFIGS: WidgetConfig[] = [
  { id: "clock", title: "Amsterdam", icon: "◷", size: "small", static: true },
  { id: "weather", title: "Weer", icon: "☁", size: "medium", prompt: "What is the current weather in Amsterdam Netherlands today? Give temperature in Celsius, conditions, wind speed in km/h, humidity. And a 3-day forecast. Respond ONLY in valid JSON, no markdown, no backticks: {\"temp\":number,\"condition\":\"string\",\"wind\":\"string\",\"humidity\":\"string\",\"forecast\":[{\"day\":\"string\",\"temp\":number,\"condition\":\"string\"}]}" },
  { id: "news", title: "Nieuws", icon: "◉", size: "large", prompt: "What are the top 6 Dutch and international news headlines today? Mix of Dutch (NOS, RTL, NU.nl) and international. Respond ONLY in valid JSON, no markdown, no backticks: {\"items\":[{\"title\":\"string\",\"source\":\"string\",\"summary\":\"string max 20 words\"}]}" },
  { id: "markets", title: "Beurzen", icon: "◆", size: "medium", prompt: "Current stock market index values and daily change % for AEX, S&P 500, NASDAQ, DAX, Nikkei 225 today? Respond ONLY in valid JSON, no markdown: {\"indices\":[{\"name\":\"string\",\"value\":\"string\",\"change\":\"string like +1.2% or -0.5%\"}]}" },
  { id: "crypto", title: "Crypto", icon: "₿", size: "medium", prompt: "Current prices in USD and 24h change % for Bitcoin BTC, Ethereum ETH, Cardano ADA, Solana SOL, XRP today? Respond ONLY in valid JSON, no markdown: {\"coins\":[{\"name\":\"string\",\"symbol\":\"string\",\"price\":\"string\",\"change\":\"string like +2.3% or -1.1%\"}]}" },
  { id: "sport", title: "Sport", icon: "⚽", size: "medium", prompt: "Latest 5 sports results or upcoming events today? Include Eredivisie, Champions League, F1, tennis, cycling. Respond ONLY in valid JSON, no markdown: {\"events\":[{\"sport\":\"string\",\"title\":\"string\",\"detail\":\"string max 15 words\"}]}" },
  { id: "f1", title: "Formule 1", icon: "🏁", size: "medium", prompt: "Current 2026 Formula 1 driver standings top 8 and next race? Respond ONLY in valid JSON, no markdown: {\"standings\":[{\"pos\":number,\"driver\":\"string\",\"team\":\"string\",\"points\":number}],\"next_race\":{\"name\":\"string\",\"date\":\"string\",\"circuit\":\"string\"}}" },
  { id: "astro", title: "Astronomie", icon: "✦", size: "medium", prompt: "Most interesting astronomy/space news this week? 3 items. Moon phase today? Respond ONLY in valid JSON, no markdown: {\"moon_phase\":\"string\",\"items\":[{\"title\":\"string\",\"detail\":\"string max 20 words\"}]}" },
  { id: "ov", title: "OV Storingen", icon: "🚆", size: "medium", prompt: "Are there any current Dutch train (NS) disruptions or delays today? Also check major highways A1 A2 A4 A9 around Amsterdam. Give 4-5 items. Respond ONLY in valid JSON, no markdown: {\"items\":[{\"type\":\"string trein or weg\",\"route\":\"string\",\"status\":\"string storing/vertraging/werkzaamheden/vrij\",\"detail\":\"string max 15 words\"}]}" },
  { id: "energy", title: "Energie", icon: "⚡", size: "small", prompt: "What are current dynamic electricity spot prices in Netherlands today (EPEX)? And current TTF gas price? Respond ONLY in valid JSON, no markdown: {\"stroom\":{\"current\":\"string eurocent/kWh\",\"trend\":\"string\",\"peak\":\"string\",\"offpeak\":\"string\"},\"gas\":{\"price\":\"string euro/m3\",\"trend\":\"string\"}}" },
  { id: "currency", title: "Valuta", icon: "💱", size: "small", prompt: "Current exchange rates EUR/USD, EUR/GBP, EUR/CHF, EUR/JPY today? Respond ONLY in valid JSON, no markdown: {\"rates\":[{\"pair\":\"string\",\"rate\":\"string\",\"change\":\"string like +0.3% or -0.1%\"}]}" },
  { id: "sun", title: "Zon & Maan", icon: "☀", size: "small", prompt: "Sunrise, sunset, golden hour for Amsterdam today? Moonrise moonset? Respond ONLY in valid JSON, no markdown: {\"sunrise\":\"string HH:MM\",\"sunset\":\"string HH:MM\",\"golden_hour\":\"string HH:MM-HH:MM\",\"day_length\":\"string\",\"moonrise\":\"string HH:MM\",\"moonset\":\"string HH:MM\"}" },
  { id: "quote", title: "Citaat", icon: "❝", size: "medium", prompt: "Give one profound philosophical quote from stoicism, zen buddhism, Rumi, Marcus Aurelius, Lao Tzu, Alan Watts, or similar. Include original language if not English. Respond ONLY in valid JSON, no markdown: {\"quote\":\"string\",\"author\":\"string\",\"context\":\"string max 15 words about the thinker\"}" },
  { id: "iss", title: "ISS Tracker", icon: "🛰", size: "small", static: true },
  { id: "pomodoro", title: "Pomodoro", icon: "🍅", size: "small", static: true },
  { id: "notes", title: "Notities", icon: "📝", size: "medium", static: true },
  { id: "camr", title: "CAMR 2026", icon: "⛵", size: "small", static: true },
];

/* ─── API Helpers ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWidgetData(prompt: string): Promise<any | null> {
  try {
    const r = await fetch("/api/widget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    return await r.json();
  } catch (err) {
    console.error("Widget fetch error:", err);
    return null;
  }
}

async function fetchISS(): Promise<{
  lat: string;
  lng: string;
  alt: string;
  vel: string;
} | null> {
  try {
    const r = await fetch("/api/iss");
    if (!r.ok) throw new Error(`ISS ${r.status}`);
    return await r.json();
  } catch {
    return { lat: "51.50", lng: "4.90", alt: "408", vel: "27580" };
  }
}

/* ─── Shared UI ─── */

const centerCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  gap: 8,
};

function Loader() {
  return (
    <div style={centerCol}>
      <div className="ld" />
      <div
        style={{
          fontSize: 11,
          color: "var(--muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: 1,
        }}
      >
        laden...
      </div>
    </div>
  );
}

function Err({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={centerCol}>
      <div style={{ fontSize: 20, opacity: 0.3 }}>⚠</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>Fout bij laden</div>
      <button onClick={onRetry} className="btn-retry">
        Opnieuw
      </button>
    </div>
  );
}

/* ─── STATIC WIDGETS ─── */

function ClockWidget() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const o = { timeZone: "Europe/Amsterdam" } as const;
  const h = t.toLocaleString("nl-NL", { ...o, hour: "2-digit", hour12: false });
  const m = t.toLocaleString("nl-NL", { ...o, minute: "2-digit" });
  const s = t.toLocaleString("nl-NL", { ...o, second: "2-digit" });
  const d = t.toLocaleDateString("nl-NL", {
    ...o,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div style={{ ...centerCol, gap: 2 }}>
      <div className="big-num" style={{ fontSize: 52, fontFamily: "var(--font-mono)" }}>
        {h}:{m}
        <span style={{ fontSize: 20, opacity: 0.4 }}>{s}</span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--muted)",
          textTransform: "capitalize",
          fontFamily: "var(--font-sans)",
        }}
      >
        {d}
      </div>
    </div>
  );
}

function ISSWidget() {
  const [pos, setPos] = useState<{
    lat: string;
    lng: string;
    alt: string;
    vel: string;
  } | null>(null);
  const ref = useRef<HTMLCanvasElement>(null);

  const get = useCallback(async () => {
    const data = await fetchISS();
    if (data) setPos(data);
  }, []);

  useEffect(() => {
    get();
    const i = setInterval(get, 10000);
    return () => clearInterval(i);
  }, [get]);

  useEffect(() => {
    if (!pos || !ref.current) return;
    const c = ref.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = (c.width = c.offsetWidth * 2);
    const ht = (c.height = c.offsetHeight * 2);
    ctx.scale(2, 2);
    const cw = w / 2;
    const ch = ht / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "rgba(200,245,64,0.04)";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "rgba(200,245,64,0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (ch / 6) * i);
      ctx.lineTo(cw, (ch / 6) * i);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo((cw / 8) * i, 0);
      ctx.lineTo((cw / 8) * i, ch);
      ctx.stroke();
    }
    const x = ((parseFloat(pos.lng) + 180) / 360) * cw;
    const y = ((90 - parseFloat(pos.lat)) / 180) * ch;
    ctx.fillStyle = "#c8f540";
    ctx.shadowColor = "#c8f540";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(200,245,64,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }, [pos]);

  if (!pos) return <Loader />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 6 }}>
      <canvas ref={ref} style={{ width: "100%", height: 65, borderRadius: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, fontSize: 10 }}>
        {(
          [
            ["LAT", pos.lat + "°"],
            ["LNG", pos.lng + "°"],
            ["ALT", pos.alt + "km"],
            ["SPD", pos.vel + "km/h"],
          ] as const
        ).map(([l, v], i) => (
          <div key={i} style={{ color: "var(--muted)" }}>
            {l}{" "}
            <span className="mono-val" style={{ fontFamily: "var(--font-mono)" }}>
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PomodoroWidget() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [left, setLeft] = useState(25 * 60);
  const [on, setOn] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!on) return;
    const i = setInterval(() => {
      setLeft((p) => {
        if (p <= 1) {
          setOn(false);
          if (mode === "work") {
            setDone((d) => d + 1);
            setMode("break");
            return 5 * 60;
          } else {
            setMode("work");
            return 25 * 60;
          }
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [on, mode]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const total = mode === "work" ? 25 * 60 : 5 * 60;
  const pct = ((total - left) / total) * 100;

  return (
    <div style={{ ...centerCol, gap: 6 }}>
      <div
        className="chip"
        style={{
          color: mode === "work" ? "var(--lime)" : "var(--taupe)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {mode === "work" ? "FOCUS" : "PAUZE"}
      </div>
      <div className="big-num" style={{ fontSize: 42, fontFamily: "var(--font-mono)" }}>
        {mm}:{ss}
      </div>
      <div
        style={{
          width: "75%",
          height: 4,
          background: "var(--card-alt)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: mode === "work" ? "var(--lime)" : "var(--taupe)",
            borderRadius: 4,
            transition: "width 1s linear",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setOn(!on)} className="btn-pomo">
          {on ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => {
            setOn(false);
            setMode("work");
            setLeft(25 * 60);
          }}
          className="btn-pomo"
        >
          ↺
        </button>
      </div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>
        {done} sessie{done !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function NotesWidget() {
  const [notes, setNotes] = useState("");
  const [ok, setOk] = useState(false);
  const tm = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pulse-notes");
    if (saved) setNotes(saved);
    setOk(true);
  }, []);

  const save = (v: string) => {
    setNotes(v);
    if (tm.current) clearTimeout(tm.current);
    tm.current = setTimeout(() => {
      localStorage.setItem("pulse-notes", v);
    }, 500);
  };

  if (!ok) return <Loader />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 4 }}>
      <textarea
        value={notes}
        onChange={(e) => save(e.target.value)}
        placeholder="Schrijf hier je notities..."
        className="notes-area"
        style={{ fontFamily: "var(--font-sans)" }}
      />
      <div
        style={{
          fontSize: 9,
          color: "var(--muted)",
          textAlign: "right",
          fontFamily: "var(--font-mono)",
        }}
      >
        auto-saved
      </div>
    </div>
  );
}

function CAMRWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);
  const target = new Date("2026-07-18T08:00:00+02:00");
  const diff = target.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diff / 864e5));
  const hrs = Math.max(0, Math.floor((diff % 864e5) / 36e5));
  return (
    <div style={{ ...centerCol, gap: 2 }}>
      <div
        className="chip"
        style={{ color: "var(--lime)", fontFamily: "var(--font-mono)" }}
      >
        COUNTDOWN
      </div>
      <div className="big-num" style={{ fontSize: 52, fontFamily: "var(--font-mono)" }}>
        {days}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
        dagen en {hrs} uur
      </div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
        18 juli 2026 (geschat)
      </div>
    </div>
  );
}

/* ─── DATA WIDGETS ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WeatherWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  const em = (c: string) => {
    const l = (c || "").toLowerCase();
    if (l.includes("rain") || l.includes("regen")) return "🌧";
    if (l.includes("cloud") || l.includes("bewolkt")) return "☁️";
    if (l.includes("sun") || l.includes("zon") || l.includes("clear")) return "☀️";
    if (l.includes("snow")) return "❄️";
    return "🌤";
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 42 }}>{em(data.condition)}</span>
        <div>
          <div className="big-num" style={{ fontSize: 40, fontFamily: "var(--font-mono)" }}>
            {data.temp}°
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {data.condition}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-sec)" }}>
        <span>💨 {data.wind}</span>
        <span>💧 {data.humidity}</span>
      </div>
      {data.forecast && (
        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
          {data.forecast.map(
            (d: { day: string; condition: string; temp: number }, i: number) => (
              <div key={i} className="forecast-pill">
                <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 2 }}>
                  {d.day}
                </div>
                <div style={{ fontSize: 16 }}>{em(d.condition)}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--fg)",
                    marginTop: 2,
                  }}
                >
                  {d.temp}°
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NewsWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        height: "100%",
        overflow: "auto",
      }}
    >
      {(data.items || []).map(
        (item: { title: string; source: string; summary: string }, i: number) => (
          <div
            key={i}
            style={{
              padding: "8px 0",
              borderBottom:
                i < data.items.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                className="idx-num"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--fg)",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                  {item.source} — {item.summary}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MarketsWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      {(data.indices || []).map(
        (idx: { name: string; value: string; change: string }, i: number) => {
          const up = (idx.change || "").includes("+");
          return (
            <div key={i} className="row-item">
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}>
                {idx.name}
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  className="mono-val"
                  style={{ marginRight: 8, fontFamily: "var(--font-mono)" }}
                >
                  {idx.value}
                </span>
                <span
                  className="mono-val"
                  style={{
                    color: up ? "var(--lime)" : "var(--red)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {idx.change}
                </span>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CryptoWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      {(data.coins || []).map(
        (
          c: { symbol: string; name: string; price: string; change: string },
          i: number
        ) => {
          const up = (c.change || "").includes("+");
          return (
            <div key={i} className="row-item">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="tag-pill" style={{ fontFamily: "var(--font-mono)" }}>
                  {c.symbol}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-sec)" }}>{c.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  className="mono-val"
                  style={{ marginRight: 8, fontFamily: "var(--font-mono)" }}
                >
                  ${c.price}
                </span>
                <span
                  className="mono-val"
                  style={{
                    color: up ? "var(--lime)" : "var(--red)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {c.change}
                </span>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SportWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        height: "100%",
        overflow: "auto",
      }}
    >
      {(data.events || []).map(
        (ev: { sport: string; title: string; detail: string }, i: number) => (
          <div
            key={i}
            style={{
              padding: "6px 0",
              borderBottom:
                i < data.events.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tag-pill" style={{ fontFamily: "var(--font-mono)" }}>
                {ev.sport}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--fg)",
                    lineHeight: 1.3,
                  }}
                >
                  {ev.title}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                  {ev.detail}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function F1Widget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, height: "100%" }}>
      {data.next_race && (
        <div
          className="inner-card"
          style={{ background: "var(--lime)", color: "var(--dark)" }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: 1,
              opacity: 0.6,
            }}
          >
            VOLGENDE RACE
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>
            {data.next_race.name}
          </div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>
            {data.next_race.circuit} — {data.next_race.date}
          </div>
        </div>
      )}
      <div style={{ overflow: "auto", flex: 1 }}>
        {(data.standings || []).map(
          (
            d: { pos: number; driver: string; team: string; points: number },
            i: number
          ) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 0",
                borderBottom:
                  i < data.standings.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: i < 3 ? "var(--lime)" : "var(--muted)",
                  width: 18,
                  textAlign: "right",
                }}
              >
                {d.pos}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg)" }}>
                  {d.driver}
                </span>
                <span style={{ fontSize: 9, color: "var(--muted)", marginLeft: 4 }}>
                  {d.team}
                </span>
              </div>
              <span
                className="mono-val"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {d.points}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AstroWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
      {data.moon_phase && (
        <div
          className="inner-card"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <span style={{ fontSize: 22 }}>🌙</span>
          <div>
            <div
              className="chip"
              style={{ color: "var(--lime)", fontFamily: "var(--font-mono)" }}
            >
              MAANFASE
            </div>
            <div style={{ fontSize: 12, color: "var(--fg)", marginTop: 1 }}>
              {data.moon_phase}
            </div>
          </div>
        </div>
      )}
      {(data.items || []).map(
        (item: { title: string; detail: string }, i: number) => (
          <div
            key={i}
            style={{
              padding: "4px 0",
              borderBottom:
                i < data.items.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1.3,
              }}
            >
              ✦ {item.title}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
              {item.detail}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OVWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  const sc = (s: string) => {
    const l = (s || "").toLowerCase();
    if (l.includes("storing") || l.includes("stremming")) return "var(--red)";
    if (l.includes("vertraging") || l.includes("werkzaamheden"))
      return "var(--taupe)";
    return "var(--lime)";
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        height: "100%",
        overflow: "auto",
      }}
    >
      {(data.items || []).map(
        (
          item: { type: string; route: string; status: string; detail: string },
          i: number
        ) => (
          <div
            key={i}
            style={{
              padding: "5px 0",
              borderBottom:
                i < data.items.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>
                {item.type === "trein" ? "🚆" : "🚗"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)" }}>
                  {item.route}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>
                  {item.detail}
                </div>
              </div>
              <span
                className="status-badge"
                style={{
                  color: sc(item.status),
                  borderColor: sc(item.status),
                  fontFamily: "var(--font-mono)",
                }}
              >
                {item.status}
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EnergyWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
        justifyContent: "center",
      }}
    >
      <div>
        <div
          className="chip"
          style={{ color: "var(--lime)", fontFamily: "var(--font-mono)" }}
        >
          ⚡ STROOM
        </div>
        <div
          className="big-num"
          style={{ fontSize: 24, marginTop: 2, fontFamily: "var(--font-mono)" }}
        >
          {data.stroom?.current}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 2,
          }}
        >
          <span>Piek {data.stroom?.peak}</span>
          <span>Dal {data.stroom?.offpeak}</span>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        <div
          className="chip"
          style={{ color: "var(--taupe)", fontFamily: "var(--font-mono)" }}
        >
          🔥 GAS
        </div>
        <div
          className="big-num"
          style={{ fontSize: 20, marginTop: 2, fontFamily: "var(--font-mono)" }}
        >
          {data.gas?.price}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
          {data.gas?.trend}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrencyWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        justifyContent: "center",
      }}
    >
      {(data.rates || []).map(
        (r: { pair: string; rate: string; change: string }, i: number) => {
          const up = (r.change || "").includes("+");
          return (
            <div key={i} className="row-item" style={{ padding: "4px 0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-sec)" }}>
                {r.pair}
              </span>
              <div>
                <span
                  className="mono-val"
                  style={{ marginRight: 6, fontFamily: "var(--font-mono)" }}
                >
                  {r.rate}
                </span>
                <span
                  className="mono-val"
                  style={{
                    fontSize: 10,
                    color: up ? "var(--lime)" : "var(--red)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {r.change}
                </span>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SunWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {(
          [
            ["🌅", data.sunrise, "opkomst"],
            ["🌇", data.sunset, "ondergang"],
          ] as const
        ).map(([e, v, l], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{e}</div>
            <div
              className="big-num"
              style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}
            >
              {v}
            </div>
            <div style={{ fontSize: 9, color: "var(--muted)" }}>{l}</div>
          </div>
        ))}
      </div>
      <div
        className="inner-card"
        style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", padding: "5px 6px" }}
      >
        {data.day_length} daglicht · Gouden uur {data.golden_hour}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          fontSize: 10,
          color: "var(--muted)",
        }}
      >
        <span>🌙↑ {data.moonrise}</span>
        <span>🌙↓ {data.moonset}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuoteWidget({ data }: { data: any }) {
  if (!data) return <Loader />;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        gap: 10,
        padding: "0 4px",
      }}
    >
      <div
        style={{
          fontSize: 32,
          color: "var(--lime)",
          lineHeight: 1,
          opacity: 0.25,
          fontFamily: "Georgia, serif",
        }}
      >
        ❝
      </div>
      <div
        style={{
          fontSize: 14,
          fontStyle: "italic",
          color: "var(--fg)",
          lineHeight: 1.55,
        }}
      >
        {data.quote}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--lime)" }}>
          — {data.author}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
          {data.context}
        </div>
      </div>
    </div>
  );
}

/* ─── Widget Map ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WMAP: Record<string, React.FC<{ data: any }>> = {
  weather: WeatherWidget,
  news: NewsWidget,
  markets: MarketsWidget,
  crypto: CryptoWidget,
  sport: SportWidget,
  f1: F1Widget,
  astro: AstroWidget,
  ov: OVWidget,
  energy: EnergyWidget,
  currency: CurrencyWidget,
  sun: SunWidget,
  quote: QuoteWidget,
};

const SMAP: Record<string, React.FC> = {
  clock: ClockWidget,
  iss: ISSWidget,
  pomodoro: PomodoroWidget,
  notes: NotesWidget,
  camr: CAMRWidget,
};

/* ─── Card Wrapper ─── */

function Card({
  config,
  children,
  delay,
}: {
  config: WidgetConfig;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div className={`card card-${config.size}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="card-hdr">
        <span className="card-icon">{config.icon}</span>
        <span className="card-title" style={{ fontFamily: "var(--font-mono)" }}>
          {config.title}
        </span>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

/* ─── Dashboard Page ─── */

export default function Dashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [wd, setWd] = useState<Record<string, any>>({});
  const [er, setEr] = useState<Record<string, boolean>>({});
  const init = useRef(false);

  const load = useCallback(async (c: WidgetConfig) => {
    if (c.static || !c.prompt) return;
    setEr((p) => ({ ...p, [c.id]: false }));
    const r = await fetchWidgetData(c.prompt);
    if (r) setWd((p) => ({ ...p, [c.id]: r }));
    else setEr((p) => ({ ...p, [c.id]: true }));
  }, []);

  useEffect(() => {
    if (init.current) return;
    init.current = true;
    WIDGET_CONFIGS.filter((c) => !c.static).forEach((c, i) =>
      setTimeout(() => load(c), i * 700)
    );
  }, [load]);

  const render = (c: WidgetConfig) => {
    if (c.static) {
      const S = SMAP[c.id];
      return S ? <S /> : null;
    }
    if (er[c.id]) return <Err onRetry={() => load(c)} />;
    const C = WMAP[c.id];
    return C ? <C data={wd[c.id]} /> : <Loader />;
  };

  return (
    <div className="dash">
      <div className="dash-hdr">
        <div className="dash-logo" style={{ fontFamily: "var(--font-mono)" }}>
          <span>pulse</span>.
        </div>
        <div className="dash-sub" style={{ fontFamily: "var(--font-mono)" }}>
          live dashboard — {WIDGET_CONFIGS.length} widgets
        </div>
      </div>
      <div className="grid">
        {WIDGET_CONFIGS.map((c, i) => (
          <Card key={c.id} config={c} delay={i * 50}>
            {render(c)}
          </Card>
        ))}
      </div>
    </div>
  );
}
