import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTrackingProgress, decodeTrackingData } from "../utils/tracking";

export default function TrackPage({ storage }) {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  
  const [trackInput, setTrackInput] = useState(trackingNumber || "");
  const [trackResult, setTrackResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(!!trackingNumber);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (trackingNumber) {
      handleTrack(trackingNumber);
    }
  }, [trackingNumber]);

  function handleTrack(numToTrack = trackInput) {
    const num = numToTrack.trim().toUpperCase();
    setHasSearched(true);
    setIsError(false);
    setTrackResult(null);
    
    if (!num) { 
      setIsError(true);
      return; 
    }
    
    let entry = storage[num];

    if (!entry) {
      try {
        entry = decodeTrackingData(num);
      } catch (e) {
        setIsError(true);
        return;
      }
    }
    
    if (entry) {
      setTrackResult(entry);
    } else {
      setIsError(true);
    }
    
    if (num !== trackingNumber) {
      navigate(`/track/${num}`, { replace: true });
    }
  }

  const Logo = () => (
    <svg width="170" height="42" viewBox="0 0 170 42" style={{ display: 'block' }}>
      <rect width="170" height="42" fill="#e50012" />
      <text x="15" y="25" fill="white" fontSize="24" fontWeight="900" fontStyle="italic" fontFamily="Arial, sans-serif" letterSpacing="-1">JP</text>
      <text x="17" y="36" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="1">POST</text>
      <text x="60" y="27" fill="white" fontSize="18" fontWeight="bold" fontFamily="'MS Gothic', sans-serif">郵便局</text>
    </svg>
  );

  return (
    <div style={{ fontFamily: 'Arial, "MS Gothic", sans-serif', color: '#333', backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 25px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Logo />
          <span style={{ marginLeft: '20px', fontSize: '13px', fontWeight: 'bold' }}>進化するぬくもり。</span>
        </div>
        <div style={{ fontSize: '11px', textAlign: 'right', lineHeight: '1.6' }}>
          <div>
            <a href="#" style={{ color: '#0000ee', textDecoration: 'underline' }}>Company Information</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'underline' }}>Announcements and Press Releases</a>
          </div>
          <div>
            <a href="#" style={{ color: '#0000ee', textDecoration: 'underline' }}>Frequently Asked Questions / Inquiries</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'underline' }}>Sitemap</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'underline' }}>English</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, width: '820px', margin: '0 auto', padding: '30px 0' }}>
        
        {/* Notice Box */}
        <div style={{ border: '1px solid #d4d4d4', backgroundColor: '#fcfcfc', padding: '20px', marginBottom: '40px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '13px' }}>notice</div>
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            System maintenance will be performed on Saturday, June 27, 2026, from 0:00 to 5:00 (times may vary).<br />
            During maintenance, the postal tracking service will be unavailable.<br />
            We apologize for any inconvenience this may cause and appreciate your understanding.
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '18px', borderBottom: '2px solid #e50012', paddingBottom: '12px', marginBottom: '25px', fontWeight: 'normal' }}>
          Individual number search results
        </h2>

        {/* Results Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {hasSearched ? 'There is 1 result from your inquiry.' : 'Please enter your inquiry number.'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input 
              value={trackInput}
              onChange={e => setTrackInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              style={{ border: '1px solid #999', padding: '3px 6px', fontSize: '12px', width: '150px' }}
              placeholder="e.g. EA123456789JP"
            />
            <button onClick={() => handleTrack()} style={{ fontSize: '12px', padding: '3px 12px', cursor: 'pointer', backgroundColor: '#e0e0e0', border: '1px solid #999' }}>Track</button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '12px', textAlign: 'center', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#efefef' }}>
              <th style={{ border: '1px solid #ccc', padding: '12px 5px', fontWeight: 'normal', width: '18%' }}>Inquiry number</th>
              <th style={{ border: '1px solid #ccc', padding: '12px 5px', fontWeight: 'normal', width: '12%' }}>Product<br/>Type</th>
              <th style={{ border: '1px solid #ccc', padding: '12px 5px', fontWeight: 'normal', width: '14%' }}>Latest date</th>
              <th style={{ border: '1px solid #ccc', padding: '12px 5px', fontWeight: 'normal', width: '18%' }}>Latest status</th>
              <th style={{ border: '1px solid #ccc', padding: '12px 5px', fontWeight: 'normal', width: '20%' }}>Latest handling<br/>station<br/><br/>post code</th>
              <th style={{ border: '1px solid #ccc', padding: '12px 5px', fontWeight: 'normal', width: '18%' }}>Prefecture<br/>name, etc.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '15px 5px' }}>{trackInput || "-"}</td>
              {isError || !trackResult ? (
                <td colSpan="5" style={{ border: '1px solid #ccc', padding: '15px 15px', color: '#e50012', textAlign: 'left', lineHeight: '1.5' }}>
                  **There is an error in the number of digits entered for your inquiry number. Please enter it as 11 to 13 digits.**
                </td>
              ) : (() => {
                const { checkpoints, daysPassed } = getTrackingProgress(trackResult);
                const currentCp = checkpoints[checkpoints.length - 1] || {};
                const cpDate = new Date(trackResult.createdAt);
                if (currentCp.day) {
                  cpDate.setDate(cpDate.getDate() + currentCp.day);
                }
                
                return (
                  <>
                    <td style={{ border: '1px solid #ccc', padding: '15px 5px' }}>EMS</td>
                    <td style={{ border: '1px solid #ccc', padding: '15px 5px' }}>
                      {cpDate.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, '/')}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '15px 5px' }}>{currentCp.status || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '15px 5px' }}>{currentCp.location || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '15px 5px' }}>{trackResult.destination.country || '-'}</td>
                  </>
                );
              })()}
            </tr>
          </tbody>
        </table>

        {trackResult && !isError && (
          <div style={{ marginTop: '40px' }}>
             <h3 style={{ fontSize: '14px', borderLeft: '4px solid #e50012', paddingLeft: '8px', marginBottom: '15px' }}>Detailed Delivery History</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '12px', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#efefef' }}>
                  <th style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'normal', width: '20%' }}>Date</th>
                  <th style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'normal', width: '20%' }}>Status</th>
                  <th style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'normal', width: '40%' }}>Details</th>
                  <th style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'normal', width: '20%' }}>Handling office</th>
                </tr>
              </thead>
              <tbody>
                {getTrackingProgress(trackResult).checkpoints.filter(cp => cp.day <= getTrackingProgress(trackResult).daysPassed).map((cp, i) => {
                  const cpDate = new Date(trackResult.createdAt);
                  cpDate.setDate(cpDate.getDate() + cp.day);
                  return (
                    <tr key={i}>
                      <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                        {cpDate.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, '/')} {cpDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '10px' }}>{cp.status}</td>
                      <td style={{ border: '1px solid #ccc', padding: '10px' }}>{cp.detail}</td>
                      <td style={{ border: '1px solid #ccc', padding: '10px' }}>{cp.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Button */}
        <div style={{ textAlign: 'center', marginTop: '35px' }}>
          <button style={{ 
            background: 'linear-gradient(to bottom, #f9f9f9, #dcdcdc)', 
            border: '1px solid #a3a3a3', 
            borderRadius: '4px',
            padding: '8px 30px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
          }}>
            取扱局を調べる <span style={{ color: '#e50012', fontSize: '10px', marginLeft: '15px' }}>▶</span>
          </button>
        </div>

        {/* Top of page link */}
        <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '11px' }}>
          <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>▲ Top of page</a>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto' }}>
        <div style={{ borderTop: '2px solid #ccc', display: 'flex', justifyContent: 'space-between', padding: '15px 30px', alignItems: 'center', fontSize: '11px', backgroundColor: '#fff' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            日本郵便株式会社
          </div>
          <div>
            <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>Company Information</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>About using the site</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>Privacy Policy</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>Solicitation policy</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>Recruitment Information</a> | <a href="#" style={{ color: '#0000ee', textDecoration: 'none' }}>Social media</a>
          </div>
        </div>
        <div style={{ backgroundColor: '#e50012', color: 'white', display: 'flex', justifyContent: 'space-between', padding: '12px 30px', alignItems: 'center', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', fontStyle: 'italic', marginRight: '6px', letterSpacing: '-0.5px' }}>JP</span>
            <span style={{ fontSize: '12px', fontWeight: 'normal' }}>日本郵政グループ</span>
          </div>
          <div>Copyright (C) JAPAN POST Co.,Ltd. All Rights Reserved.</div>
        </div>
      </footer>
    </div>
  );
}
