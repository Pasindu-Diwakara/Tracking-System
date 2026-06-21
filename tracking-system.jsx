import { useState, useEffect } from "react";

const CARRIERS = [
  { name: "Japan Post EMS", code: "JE", prefix: "EA", suffix: "JP" },
  { name: "FedEx International", code: "FX", prefix: "FX", suffix: "JP" },
  { name: "DHL Express", code: "DH", prefix: "JD", suffix: "DE" },
  { name: "UPS Worldwide", code: "UP", prefix: "1Z", suffix: "JP" },
  { name: "Yamato International", code: "YM", prefix: "YM", suffix: "JP" },
  { name: "Sagawa Express", code: "SG", prefix: "SG", suffix: "JP" },
];

const DESTINATIONS = [
  { country: "United States", code: "US", city: "Los Angeles", flag: "🇺🇸", hub: "LAX" },
  { country: "United Kingdom", code: "GB", city: "London", flag: "🇬🇧", hub: "LHR" },
  { country: "Germany", code: "DE", city: "Frankfurt", flag: "🇩🇪", hub: "FRA" },
  { country: "Australia", code: "AU", city: "Sydney", flag: "🇦🇺", hub: "SYD" },
  { country: "Canada", code: "CA", city: "Toronto", flag: "🇨🇦", hub: "YYZ" },
  { country: "France", code: "FR", city: "Paris", flag: "🇫🇷", hub: "CDG" },
  { country: "Brazil", code: "BR", city: "São Paulo", flag: "🇧🇷", hub: "GRU" },
  { country: "India", code: "IN", city: "Mumbai", flag: "🇮🇳", hub: "BOM" },
  { country: "Singapore", code: "SG", city: "Singapore", flag: "🇸🇬", hub: "SIN" },
  { country: "UAE", code: "AE", city: "Dubai", flag: "🇦🇪", hub: "DXB" },
  { country: "South Korea", code: "KR", city: "Seoul", flag: "🇰🇷", hub: "ICN" },
  { country: "Netherlands", code: "NL", city: "Amsterdam", flag: "🇳🇱", hub: "AMS" },
];

function generateTrackingNumber(carrier, destination) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nums = "0123456789";
  const rand = (len, set) => Array.from({ length: len }, () => set[Math.floor(Math.random() * set.length)]).join("");

  if (carrier.code === "JE") return `${carrier.prefix}${rand(8, nums)}${carrier.suffix}`;
  if (carrier.code === "FX") return `${carrier.prefix}${rand(12, nums)}`;
  if (carrier.code === "DH") return `${carrier.prefix}${rand(10, nums)}`;
  if (carrier.code === "UP") return `${carrier.prefix}${rand(6, chars)}${rand(8, nums)}`;
  return `${carrier.prefix}${rand(4, chars)}${rand(8, nums)}${destination.code}`;
}

function getCheckpoints(destination) {
  return [
    { day: 0, status: "Order Received", location: "Tokyo, Japan", detail: "Package registered at sender facility", icon: "📦" },
    { day: 1, status: "Picked Up", location: "Tokyo, Japan", detail: "Package collected by courier", icon: "🚚" },
    { day: 2, status: "Arrived at Origin Facility", location: "Narita International Airport, Japan", detail: "Package processed at NRT export hub", icon: "🏭" },
    { day: 3, status: "Customs Clearance — Japan", location: "Narita Airport, Japan", detail: "Export customs cleared successfully", icon: "✅" },
    { day: 4, status: "Departed Origin Country", location: "Narita Airport (NRT), Japan", detail: "Package loaded on international flight", icon: "✈️" },
    { day: 6, status: "In Transit — International", location: "Mid-route", detail: "Package in transit over international airspace", icon: "🌐" },
    { day: 8, status: `Arrived at ${destination.hub} Hub`, location: `${destination.city}, ${destination.country}`, detail: `Package arrived at ${destination.hub} international gateway`, icon: "🛬" },
    { day: 9, status: "Customs Clearance — Destination", location: `${destination.city}, ${destination.country}`, detail: "Import customs inspection in progress", icon: "🔍" },
    { day: 10, status: "Customs Released", location: `${destination.city}, ${destination.country}`, detail: "Package cleared customs successfully", icon: "✅" },
    { day: 11, status: "Arrived at Local Facility", location: `${destination.city}, ${destination.country}`, detail: "Package at local sorting center", icon: "🏭" },
    { day: 12, status: "Out for Delivery", location: `${destination.city}, ${destination.country}`, detail: "Package with local delivery driver", icon: "🚚" },
    { day: 13, status: "Delivery Attempted", location: `${destination.city}, ${destination.country}`, detail: "First delivery attempt made", icon: "🔔" },
    { day: 14, status: "Delivered", location: `${destination.city}, ${destination.country}`, detail: "Package delivered successfully. Signed by recipient.", icon: "🎉" },
  ];
}

function getTrackingProgress(trackingData) {
  const createdAt = new Date(trackingData.createdAt);
  const now = new Date();
  const diffMs = now - createdAt;
  const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const checkpoints = getCheckpoints(trackingData.destination);
  const reached = checkpoints.filter(c => c.day <= Math.min(daysPassed, 14));
  return { checkpoints, reached, daysPassed: Math.min(daysPassed, 14) };
}

function loadStorage() {
  try {
    const raw = localStorage.getItem("jp_tracking_v1");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveStorage(data) {
  try { localStorage.setItem("jp_tracking_v1", JSON.stringify(data)); } catch {}
}

// --- STYLES ---
const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a0f1e 100%)",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: "#e8eaf0",
  },
  header: {
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.3px",
    color: "#fff",
  },
  nav: { display: "flex", gap: 4 },
  navBtn: (active) => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    transition: "all 0.2s",
    background: active ? "rgba(99,179,237,0.15)" : "transparent",
    color: active ? "#63b3ed" : "#8892a4",
    borderBottom: active ? "2px solid #63b3ed" : "2px solid transparent",
  }),
  page: { maxWidth: 760, margin: "0 auto", padding: "48px 24px" },
  hero: { textAlign: "center", marginBottom: 48 },
  heroTag: {
    display: "inline-block",
    background: "rgba(99,179,237,0.12)",
    color: "#63b3ed",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
    border: "1px solid rgba(99,179,237,0.2)",
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: "-1px",
    margin: "0 0 12px",
    background: "linear-gradient(90deg, #fff 0%, #63b3ed 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: { color: "#8892a4", fontSize: 15, margin: 0 },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: 600, color: "#63b3ed", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, display: "block" },
  select: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#e8eaf0",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
    marginBottom: 0,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  genBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(90deg, #2b6cb0 0%, #3182ce 100%)",
    color: "#fff",
    letterSpacing: 0.3,
    transition: "opacity 0.2s",
    boxShadow: "0 4px 20px rgba(49,130,206,0.3)",
  },
  resultBox: {
    background: "rgba(99,179,237,0.07)",
    border: "1px solid rgba(99,179,237,0.2)",
    borderRadius: 14,
    padding: "24px 28px",
    marginTop: 20,
  },
  trackingNum: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 3,
    color: "#fff",
    fontFamily: "'Courier New', monospace",
    margin: "8px 0 16px",
  },
  copyBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid rgba(99,179,237,0.3)",
    background: "rgba(99,179,237,0.1)",
    color: "#63b3ed",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    transition: "all 0.2s",
  },
  metaRow: { display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" },
  metaPill: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    color: "#aab4c4",
  },
  trackInput: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#e8eaf0",
    fontSize: 15,
    fontFamily: "'Courier New', monospace",
    fontWeight: 700,
    letterSpacing: 2,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  },
  trackBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    background: "linear-gradient(90deg, #276749 0%, #38a169 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(56,161,105,0.3)",
  },
  timelineWrap: { marginTop: 8 },
  timelineItem: (done, current) => ({
    display: "flex",
    gap: 16,
    marginBottom: 0,
    opacity: done ? 1 : 0.3,
  }),
  timelineDot: (done, current) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
    background: current ? "rgba(99,179,237,0.2)" : done ? "rgba(56,161,105,0.15)" : "rgba(255,255,255,0.05)",
    border: current ? "2px solid #63b3ed" : done ? "2px solid #38a169" : "2px solid rgba(255,255,255,0.1)",
    boxShadow: current ? "0 0 16px rgba(99,179,237,0.4)" : "none",
  }),
  timelineLine: (done) => ({
    width: 2,
    height: 28,
    background: done ? "rgba(56,161,105,0.4)" : "rgba(255,255,255,0.07)",
    margin: "4px auto",
    flexShrink: 0,
  }),
  timelineContent: { paddingBottom: 24 },
  timelineStatus: (done) => ({
    fontWeight: 700,
    fontSize: 14,
    color: done ? "#e8eaf0" : "#4a5568",
    marginBottom: 2,
  }),
  timelineDetail: { fontSize: 12, color: "#6b7a8d", marginBottom: 4 },
  timelineMeta: { fontSize: 11, color: "#4a5568" },
  progressBar: {
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.07)",
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    borderRadius: 3,
    background: "linear-gradient(90deg, #2b6cb0, #38a169)",
    transition: "width 1s ease",
  }),
  badge: (delivered) => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    background: delivered ? "rgba(56,161,105,0.15)" : "rgba(99,179,237,0.12)",
    color: delivered ? "#68d391" : "#63b3ed",
    border: delivered ? "1px solid rgba(56,161,105,0.3)" : "1px solid rgba(99,179,237,0.2)",
    marginBottom: 16,
  }),
  errorBox: {
    background: "rgba(245,101,101,0.08)",
    border: "1px solid rgba(245,101,101,0.2)",
    borderRadius: 12,
    padding: "16px 20px",
    color: "#fc8181",
    fontSize: 14,
    marginTop: 16,
  },
  historyList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  historyItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  historyCode: { fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 13, color: "#e8eaf0", letterSpacing: 1 },
};

export default function App() {
  const [page, setPage] = useState("generate");
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0]);
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [trackInput, setTrackInput] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [storage, setStorage] = useState(loadStorage());

  useEffect(() => {
    saveStorage(storage);
  }, [storage]);

  function handleGenerate() {
    const num = generateTrackingNumber(selectedCarrier, selectedDest);
    const entry = {
      trackingNumber: num,
      carrier: selectedCarrier,
      destination: selectedDest,
      createdAt: new Date().toISOString(),
      weight: (Math.random() * 4 + 0.3).toFixed(1) + " kg",
      type: ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"][Math.floor(Math.random() * 4)],
    };
    const newStorage = { ...storage, [num]: entry };
    setStorage(newStorage);
    setGenerated(entry);
    setCopied(false);
  }

  function handleCopy() {
    if (generated) {
      navigator.clipboard.writeText(generated.trackingNumber).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleTrack() {
    const num = trackInput.trim().toUpperCase();
    setTrackError("");
    setTrackResult(null);
    if (!num) { setTrackError("Please enter a tracking number."); return; }
    const entry = storage[num];
    if (!entry) { setTrackError("Tracking number not found. Please generate a tracking number first on the Generate page."); return; }
    setTrackResult(entry);
  }

  function handleHistoryClick(num) {
    setTrackInput(num);
    setTrackResult(storage[num]);
    setTrackError("");
    setPage("track");
  }

  function renderTrackingResult(entry) {
    const { checkpoints, reached, daysPassed } = getTrackingProgress(entry);
    const pct = Math.round((daysPassed / 14) * 100);
    const isDelivered = daysPassed >= 14;
    const currentCp = reached[reached.length - 1];
    const eta = (() => {
      const d = new Date(entry.createdAt);
      d.setDate(d.getDate() + 14);
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    })();

    return (
      <div style={S.resultBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={S.badge(isDelivered)}>{isDelivered ? "✅ Delivered" : "🔵 In Transit"}</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 800, fontSize: 22, letterSpacing: 3, color: "#fff" }}>{entry.trackingNumber}</div>
            <div style={{ fontSize: 13, color: "#8892a4", marginTop: 4 }}>{entry.carrier.name} · Japan → {entry.destination.flag} {entry.destination.country}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#6b7a8d" }}>{isDelivered ? "Delivered on" : "Estimated delivery"}</div>
            <div style={{ fontWeight: 700, color: "#e8eaf0", fontSize: 14 }}>{eta}</div>
          </div>
        </div>

        <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7a8d" }}>
          <span>Day 0 — Shipped</span>
          <span style={{ color: "#63b3ed", fontWeight: 600 }}>Day {daysPassed} / 14</span>
          <span>Day 14 — Delivered</span>
        </div>
        <div style={S.progressBar}><div style={S.progressFill(pct)} /></div>

        {currentCp && (
          <div style={{ background: "rgba(99,179,237,0.07)", border: "1px solid rgba(99,179,237,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{currentCp.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#63b3ed", fontSize: 14 }}>{currentCp.status}</div>
              <div style={{ fontSize: 12, color: "#8892a4" }}>{currentCp.location} · {currentCp.detail}</div>
            </div>
          </div>
        )}

        <div style={S.timelineWrap}>
          {checkpoints.map((cp, i) => {
            const done = cp.day <= daysPassed;
            const current = done && (i === checkpoints.length - 1 || checkpoints[i + 1].day > daysPassed);
            const isLast = i === checkpoints.length - 1;
            const cpDate = new Date(entry.createdAt);
            cpDate.setDate(cpDate.getDate() + cp.day);
            return (
              <div key={i}>
                <div style={S.timelineItem(done, current)}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={S.timelineDot(done, current)}>{cp.icon}</div>
                    {!isLast && <div style={S.timelineLine(done)} />}
                  </div>
                  <div style={S.timelineContent}>
                    <div style={S.timelineStatus(done)}>{cp.status}</div>
                    <div style={S.timelineDetail}>{cp.location} — {cp.detail}</div>
                    <div style={S.timelineMeta}>
                      {done
                        ? cpDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                        : `Expected: ${cpDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const historyKeys = Object.keys(storage).reverse().slice(0, 8);

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo}>
          <span style={{ fontSize: 22 }}>📦</span>
          <span>JapanShip<span style={{ color: "#63b3ed" }}>Track</span></span>
        </div>
        <nav style={S.nav}>
          <button style={S.navBtn(page === "generate")} onClick={() => setPage("generate")}>Generate</button>
          <button style={S.navBtn(page === "track")} onClick={() => setPage("track")}>Track Package</button>
        </nav>
      </header>

      {page === "generate" && (
        <main style={S.page}>
          <div style={S.hero}>
            <div style={S.heroTag}>Origin: Japan 🇯🇵</div>
            <h1 style={S.heroTitle}>Generate Tracking Number</h1>
            <p style={S.heroSub}>Create a real-time tracking ID for a shipment from Japan to any destination worldwide</p>
          </div>

          <div style={S.card}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Courier Service</label>
                <select
                  style={S.select}
                  value={selectedCarrier.code}
                  onChange={e => setSelectedCarrier(CARRIERS.find(c => c.code === e.target.value))}
                >
                  {CARRIERS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Destination Country</label>
                <select
                  style={S.select}
                  value={selectedDest.code + selectedDest.city}
                  onChange={e => setSelectedDest(DESTINATIONS.find(d => d.code + d.city === e.target.value))}
                >
                  {DESTINATIONS.map(d => <option key={d.code + d.city} value={d.code + d.city}>{d.flag} {d.country}</option>)}
                </select>
              </div>
            </div>
            <button style={S.genBtn} onClick={handleGenerate}>
              Generate Tracking Number →
            </button>
          </div>

          {generated && (
            <div style={S.resultBox}>
              <div style={{ fontSize: 12, color: "#6b7a8d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Your Tracking Number</div>
              <div style={S.trackingNum}>{generated.trackingNumber}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button style={S.copyBtn} onClick={handleCopy}>
                  {copied ? "✅ Copied!" : "📋 Copy Number"}
                </button>
                <button style={{ ...S.copyBtn, color: "#68d391", borderColor: "rgba(104,211,145,0.3)", background: "rgba(104,211,145,0.08)" }}
                  onClick={() => { setTrackInput(generated.trackingNumber); setPage("track"); handleTrack(); }}>
                  Track Now →
                </button>
              </div>
              <div style={S.metaRow}>
                <div style={S.metaPill}>🏢 {generated.carrier.name}</div>
                <div style={S.metaPill}>🇯🇵 Japan → {generated.destination.flag} {generated.destination.country}</div>
                <div style={S.metaPill}>⚖️ {generated.weight}</div>
                <div style={S.metaPill}>📦 {generated.type}</div>
                <div style={S.metaPill}>📅 14 days to delivery</div>
              </div>
            </div>
          )}

          {historyKeys.length > 0 && (
            <div style={{ ...S.card, marginTop: 24 }}>
              <label style={S.label}>Recent Tracking Numbers</label>
              <div style={S.historyList}>
                {historyKeys.map(num => {
                  const e = storage[num];
                  const { daysPassed } = getTrackingProgress(e);
                  const pct = Math.round((daysPassed / 14) * 100);
                  return (
                    <div key={num} style={S.historyItem} onClick={() => handleHistoryClick(num)}>
                      <div>
                        <div style={S.historyCode}>{num}</div>
                        <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 2 }}>{e.carrier.name} · {e.destination.flag} {e.destination.country}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: daysPassed >= 14 ? "#68d391" : "#63b3ed", fontWeight: 700 }}>{daysPassed >= 14 ? "Delivered" : `Day ${daysPassed}/14`}</div>
                        <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: daysPassed >= 14 ? "#38a169" : "#3182ce", borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {page === "track" && (
        <main style={S.page}>
          <div style={S.hero}>
            <div style={S.heroTag}>Real-Time Tracking 🔍</div>
            <h1 style={S.heroTitle}>Track Your Package</h1>
            <p style={S.heroSub}>Enter your Japan-origin tracking number to see live shipment progress</p>
          </div>

          <div style={S.card}>
            <label style={S.label}>Tracking Number</label>
            <input
              style={S.trackInput}
              placeholder="e.g. EA123456789JP"
              value={trackInput}
              onChange={e => setTrackInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
            />
            <button style={S.trackBtn} onClick={handleTrack}>Track Shipment</button>
            {trackError && <div style={S.errorBox}>⚠️ {trackError}</div>}
          </div>

          {trackResult && renderTrackingResult(trackResult)}

          {historyKeys.length > 0 && !trackResult && (
            <div style={S.card}>
              <label style={S.label}>Recent Shipments</label>
              <div style={S.historyList}>
                {historyKeys.map(num => {
                  const e = storage[num];
                  const { daysPassed } = getTrackingProgress(e);
                  return (
                    <div key={num} style={S.historyItem} onClick={() => { setTrackInput(num); setTrackResult(e); }}>
                      <div>
                        <div style={S.historyCode}>{num}</div>
                        <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 2 }}>{e.carrier.name} · {e.destination.flag} {e.destination.country}</div>
                      </div>
                      <div style={{ fontSize: 11, color: daysPassed >= 14 ? "#68d391" : "#63b3ed", fontWeight: 700 }}>{daysPassed >= 14 ? "✅ Delivered" : `Day ${daysPassed}/14`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
