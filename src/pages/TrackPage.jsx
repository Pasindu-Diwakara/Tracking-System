import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTrackingProgress } from "../utils/tracking";
import { S } from "../utils/styles";

export default function TrackPage({ storage }) {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  
  const [trackInput, setTrackInput] = useState(trackingNumber || "");
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    if (trackingNumber) {
      handleTrack(trackingNumber);
    }
  }, [trackingNumber]);

  function handleTrack(numToTrack = trackInput) {
    const num = numToTrack.trim().toUpperCase();
    setTrackError("");
    setTrackResult(null);
    
    if (!num) { 
      setTrackError("Please enter a tracking number."); 
      return; 
    }
    
    const entry = storage[num];
    if (!entry) { 
      setTrackError("Tracking number not found. Please verify the number and try again."); 
      return; 
    }
    
    setTrackResult(entry);
    
    // Update URL if tracking from input box
    if (num !== trackingNumber) {
      navigate(`/track/${num}`, { replace: true });
    }
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
            <div style={{ fontSize: 13, color: "#8892a4", marginTop: 4 }}>{entry.carrier.name} · Japan → {entry.destination.flag} {entry.destination.city}, {entry.destination.country}</div>
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

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo}>
          <span style={{ fontSize: 22 }}>📦</span>
          <span>JapanShip<span style={{ color: "#63b3ed" }}>Track</span></span>
        </div>
        {/* No link back to the generate page to keep it isolated */}
      </header>

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
          <button style={S.trackBtn} onClick={() => handleTrack()}>Track Shipment</button>
          {trackError && <div style={S.errorBox}>⚠️ {trackError}</div>}
        </div>

        {trackResult && renderTrackingResult(trackResult)}
      </main>
    </div>
  );
}
