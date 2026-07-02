import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { Country, City } from "country-state-city";
import { Package, Lock, Copy, Check, Building2, MapPin, Mail, Scale, ArrowRight, ExternalLink } from "lucide-react";
import { CARRIERS, encodeTrackingData, getTrackingProgress } from "../utils/tracking";
import { S, selectStyles } from "../utils/styles";

export default function GeneratePage({ storage, setStorage }) {
  const navigate = useNavigate();
  
  // Data for Selects
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);

  // Form State
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [zipCode, setZipCode] = useState("");
  
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");

  function handleLogin() {
    if (passcode === "Pasindu2002#") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect passcode.");
    }
  }

  useEffect(() => {
    // Load all countries on mount
    const allCountries = Country.getAllCountries().map(c => ({
      value: c.isoCode,
      label: `${c.flag} ${c.name}`,
      isoCode: c.isoCode,
      name: c.name,
      flag: c.flag
    }));
    setCountries(allCountries);
    
    // Set default (e.g. US)
    const defaultCountry = allCountries.find(c => c.isoCode === "US") || allCountries[0];
    setSelectedCountry(defaultCountry);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const countryCities = City.getCitiesOfCountry(selectedCountry.isoCode).map(c => ({
        value: c.name,
        label: c.name,
        name: c.name
      }));
      setCities(countryCities);
      setSelectedCity(countryCities.length > 0 ? countryCities[0] : null);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  function handleGenerate() {
    if (!selectedCountry) {
      alert("Please select a destination country.");
      return;
    }
    
    const destination = {
      country: selectedCountry.name,
      code: selectedCountry.isoCode,
      city: selectedCity ? selectedCity.name : "N/A",
      flag: selectedCountry.flag,
      zip: zipCode || "00000"
    };

    const entryTemplate = {
      carrier: selectedCarrier,
      destination: destination,
      createdAt: new Date().toISOString(),
      weight: (Math.random() * 4 + 0.3).toFixed(1) + " kg",
      type: ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"][Math.floor(Math.random() * 4)],
    };

    const payloadStr = encodeTrackingData(entryTemplate);

    let num = "";
    if (selectedCarrier.code === "JE") num = `${selectedCarrier.prefix}${payloadStr}${selectedCarrier.suffix}`;
    else if (selectedCarrier.code === "FX") num = `${selectedCarrier.prefix}${payloadStr}`;
    else if (selectedCarrier.code === "DH") num = `${selectedCarrier.prefix}${payloadStr}`;
    else num = `${selectedCarrier.prefix}${payloadStr}${destination.code}`;

    const entry = {
      ...entryTemplate,
      trackingNumber: num
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

  const historyKeys = Object.keys(storage).reverse().slice(0, 8);

  const carrierOptions = CARRIERS.map(c => ({ value: c.code, label: c.name, carrier: c }));

  return (
    <div style={S.app}>
      <header style={S.header}>
        <Link to="/" style={{ ...S.logo, display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={24} color="#63b3ed" />
          <span>JapanShip<span style={{ color: "#63b3ed" }}>Admin</span></span>
        </Link>
        <nav style={S.nav}>
          <div style={S.navBtn(true)}>Generate</div>
          <Link to="/track" style={{ ...S.navBtn(false), marginLeft: 8, display: "flex", alignItems: "center", gap: 6 }} target="_blank">View Tracking Portal <ExternalLink size={14} /></Link>
        </nav>
      </header>

      {!isAuthenticated ? (
        <main style={S.page}>
          <div style={S.hero}>
            <div style={{ ...S.heroTag, display: "inline-flex", alignItems: "center", gap: 6 }}><Lock size={14} /> Admin Only</div>
            <h1 style={S.heroTitle}>Restricted Access</h1>
            <p style={S.heroSub}>Please enter the admin passcode to access the tracking generation portal.</p>
          </div>
          <div style={{ ...S.card, maxWidth: 400, margin: "0 auto" }}>
            <label style={S.label}>Passcode</label>
            <input
              type="password"
              style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e8eaf0", fontSize: 15, outline: "none", marginBottom: 14 }}
              placeholder="Enter passcode"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button 
              style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, background: "linear-gradient(90deg, #276749 0%, #38a169 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(56,161,105,0.3)" }} 
              onClick={handleLogin}
            >
              Login
            </button>
            {loginError && <div style={{ background: "rgba(245,101,101,0.08)", border: "1px solid rgba(245,101,101,0.2)", borderRadius: 12, padding: "16px 20px", color: "#fc8181", fontSize: 14, marginTop: 16 }}>⚠️ {loginError}</div>}
          </div>
        </main>
      ) : (
      <main style={S.page}>
        <div style={S.hero}>
          <div style={{ ...S.heroTag, display: "inline-flex", alignItems: "center", gap: 6 }}><Lock size={14} /> Secure Admin Portal</div>
          <h1 style={S.heroTitle}>Generate Tracking Number</h1>
          <p style={S.heroSub}>Create a real-time tracking ID for a shipment from Japan to any destination worldwide</p>
        </div>

        <div style={S.card}>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Courier Service</label>
            <Select
              styles={selectStyles}
              options={carrierOptions}
              value={carrierOptions.find(o => o.value === selectedCarrier.code)}
              onChange={(o) => setSelectedCarrier(o.carrier)}
              isSearchable={false}
            />
          </div>
          
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Destination Country</label>
              <Select
                styles={selectStyles}
                options={countries}
                value={selectedCountry}
                onChange={(o) => setSelectedCountry(o)}
                placeholder="Search country..."
              />
            </div>
            <div>
              <label style={S.label}>City / Town</label>
              <Select
                styles={selectStyles}
                options={cities}
                value={selectedCity}
                onChange={(o) => setSelectedCity(o)}
                placeholder={cities.length ? "Search city..." : "No cities found"}
                isDisabled={!cities.length}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>ZIP / Postal Code</label>
            <input
              style={S.trackInput}
              placeholder="e.g. 90210"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
            />
          </div>

          <button style={{ ...S.genBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleGenerate}>
            Generate Tracking Number <ArrowRight size={18} />
          </button>
        </div>

        {generated && (
          <div style={S.resultBox}>
            <div style={{ fontSize: 12, color: "#6b7a8d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Your Tracking Number</div>
            <div style={S.trackingNum}>{generated.trackingNumber}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button style={{ ...S.copyBtn, display: "flex", alignItems: "center", gap: 6 }} onClick={handleCopy}>
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Number</>}
              </button>
              <Link to={`/track/${generated.trackingNumber}`} style={{ ...S.copyBtn, color: "#68d391", borderColor: "rgba(104,211,145,0.3)", background: "rgba(104,211,145,0.08)", display: "flex", alignItems: "center", gap: 6 }} target="_blank">
                Open Tracking Page <ExternalLink size={16} />
              </Link>
            </div>
            <div style={S.metaRow}>
              <div style={{ ...S.metaPill, display: "flex", alignItems: "center", gap: 6 }}><Building2 size={14} color="#a0aec0" /> {generated.carrier.name}</div>
              <div style={{ ...S.metaPill, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="#a0aec0" /> Japan <ArrowRight size={12} color="#a0aec0" /> {generated.destination.flag} {generated.destination.city}, {generated.destination.country}</div>
              <div style={{ ...S.metaPill, display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} color="#a0aec0" /> {generated.destination.zip}</div>
              <div style={{ ...S.metaPill, display: "flex", alignItems: "center", gap: 6 }}><Scale size={14} color="#a0aec0" /> {generated.weight}</div>
              <div style={{ ...S.metaPill, display: "flex", alignItems: "center", gap: 6 }}><Package size={14} color="#a0aec0" /> {generated.type}</div>
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
                  <Link key={num} style={S.historyItem} to={`/track/${num}`} target="_blank">
                    <div>
                      <div style={S.historyCode}>{num}</div>
                      <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 2 }}>{e.carrier.name} · {e.destination.flag} {e.destination.city}, {e.destination.country}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: daysPassed >= 14 ? "#68d391" : "#63b3ed", fontWeight: 700 }}>{daysPassed >= 14 ? "Delivered" : `Day ${daysPassed}/14`}</div>
                      <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: daysPassed >= 14 ? "#38a169" : "#3182ce", borderRadius: 2 }} />
                      </div>
                    </div>
                  </Link>
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
