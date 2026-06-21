import { Country, City } from "country-state-city";

export const CARRIERS = [
  { name: "Japan Post EMS", code: "JE", prefix: "EA", suffix: "JP" },
  { name: "FedEx International", code: "FX", prefix: "FX", suffix: "JP" },
  { name: "DHL Express", code: "DH", prefix: "JD", suffix: "DE" },
  { name: "UPS Worldwide", code: "UP", prefix: "1Z", suffix: "JP" },
  { name: "Yamato International", code: "YM", prefix: "YM", suffix: "JP" },
  { name: "Sagawa Express", code: "SG", prefix: "SG", suffix: "JP" },
];

export function encodeTrackingData(entry) {
  const cCode = entry.destination.code || "US";
  const c1 = cCode.charCodeAt(0) - 65;
  const c2 = cCode.charCodeAt(1) - 65;
  const countryNum = c1 * 26 + c2;

  const cities = City.getCitiesOfCountry(cCode);
  let cityIndex = cities.findIndex(c => c.name === entry.destination.city);
  if (cityIndex === -1) cityIndex = 0;

  const epoch = new Date("2024-01-01T00:00:00Z");
  const createdAt = new Date(entry.createdAt);
  const diffTime = Math.abs(createdAt - epoch);
  const daysSinceEpoch = Math.floor(diffTime / (1000 * 60 * 60 * 24)) % 4096;

  const weightVal = parseFloat(entry.weight);
  const weightIndex = Math.floor(weightVal * 10) % 64;

  const types = ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"];
  let typeIndex = types.indexOf(entry.type);
  if (typeIndex === -1) typeIndex = 0;

  const rand = Math.floor(Math.random() * 16);

  let val = BigInt(countryNum);
  val = (val << 15n) | BigInt(cityIndex);
  val = (val << 12n) | BigInt(daysSinceEpoch);
  val = (val << 6n) | BigInt(weightIndex);
  val = (val << 2n) | BigInt(typeIndex);
  val = (val << 4n) | BigInt(rand);

  return val.toString(36).toUpperCase();
}

function parseBase36ToBigInt(str) {
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    let val;
    if (charCode >= 48 && charCode <= 57) val = BigInt(charCode - 48);
    else if (charCode >= 65 && charCode <= 90) val = BigInt(charCode - 55);
    else if (charCode >= 97 && charCode <= 122) val = BigInt(charCode - 87);
    else throw new Error("Invalid base36 char");
    result = result * 36n + val;
  }
  return result;
}

export function decodeTrackingData(trackingNumber) {
  const types = ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"];
  const epoch = new Date("2024-01-01T00:00:00Z");

  let carrier = CARRIERS.find(c => trackingNumber.startsWith(c.prefix));
  if (!carrier) carrier = CARRIERS[0];

  let encodedStr = trackingNumber.substring(carrier.prefix.length);
  if (carrier.suffix && encodedStr.endsWith(carrier.suffix)) {
    encodedStr = encodedStr.substring(0, encodedStr.length - carrier.suffix.length);
  }

  try {
    let val = parseBase36ToBigInt(encodedStr);

    const rand = Number(val & 15n);
    val = val >> 4n;
    
    const typeIndex = Number(val & 3n);
    val = val >> 2n;

    const weightIndex = Number(val & 63n);
    val = val >> 6n;

    const daysSinceEpoch = Number(val & 4095n);
    val = val >> 12n;

    const cityIndex = Number(val & 32767n);
    val = val >> 15n;

    const countryNum = Number(val);
    
    const c1 = Math.floor(countryNum / 26);
    const c2 = countryNum % 26;
    const countryCode = String.fromCharCode(c1 + 65) + String.fromCharCode(c2 + 65);
    
    const countryInfo = Country.getCountryByCode(countryCode);
    const countryName = countryInfo ? countryInfo.name : "Unknown Country";
    const flag = countryInfo ? countryInfo.flag : "🌍";

    let cityName = "Unknown City";
    if (countryInfo) {
      const cities = City.getCitiesOfCountry(countryCode);
      if (cityIndex >= 0 && cityIndex < cities.length) {
        cityName = cities[cityIndex].name;
      } else if (cities.length > 0) {
        cityName = cities[0].name;
      }
    }

    const createdAt = new Date(epoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);

    let zipHash = 0;
    for (let i = 0; i < trackingNumber.length; i++) {
      zipHash = (zipHash * 31 + trackingNumber.charCodeAt(i)) % 90000;
    }
    const zip = (zipHash + 10000).toString();

    return {
      trackingNumber: trackingNumber.toUpperCase(),
      carrier: carrier,
      destination: {
        country: countryName,
        code: countryCode,
        city: cityName,
        flag: flag,
        zip: zip
      },
      createdAt: createdAt.toISOString(),
      weight: (weightIndex / 10).toFixed(1) + " kg",
      type: types[typeIndex]
    };
  } catch (e) {
    return generateDeterministicEntryFallback(trackingNumber);
  }
}

export function generateDeterministicEntryFallback(trackingNumber) {
  let hash = 0;
  for (let i = 0; i < trackingNumber.length; i++) {
    hash = trackingNumber.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const rng = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  let carrier = CARRIERS.find(c => trackingNumber.startsWith(c.prefix));
  if (!carrier) carrier = CARRIERS[Math.floor(rng() * CARRIERS.length)];

  const countries = [
    { name: "United States", code: "US", flag: "🇺🇸", city: "New York" },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧", city: "London" },
    { name: "Canada", code: "CA", flag: "🇨🇦", city: "Toronto" },
    { name: "Australia", code: "AU", flag: "🇦🇺", city: "Sydney" },
    { name: "Germany", code: "DE", flag: "🇩🇪", city: "Berlin" },
    { name: "France", code: "FR", flag: "🇫🇷", city: "Paris" },
    { name: "Singapore", code: "SG", flag: "🇸🇬", city: "Singapore" }
  ];
  
  const selectedCountry = countries[Math.floor(rng() * countries.length)];
  
  const destination = {
    country: selectedCountry.name,
    code: selectedCountry.code,
    city: selectedCountry.city,
    flag: selectedCountry.flag,
    zip: Math.floor(rng() * 90000 + 10000).toString()
  };

  const daysAgo = Math.floor(rng() * 15);
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);

  return {
    trackingNumber: trackingNumber.toUpperCase(),
    carrier: carrier,
    destination: destination,
    createdAt: createdAt.toISOString(),
    weight: (rng() * 4 + 0.3).toFixed(1) + " kg",
    type: ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"][Math.floor(rng() * 4)]
  };
}

export function getCheckpoints(destination) {
  return [
    { day: 0, status: "Order Received", location: "Tokyo, Japan", detail: "Package registered at sender facility", iconName: "PackageOpen" },
    { day: 1, status: "Picked Up", location: "Tokyo, Japan", detail: "Package collected by courier", iconName: "Truck" },
    { day: 2, status: "Arrived at Origin Facility", location: "Narita International Airport, Japan", detail: "Package processed at NRT export hub", iconName: "Factory" },
    { day: 3, status: "Customs Clearance — Japan", location: "Narita Airport, Japan", detail: "Export customs cleared successfully", iconName: "CheckCircle" },
    { day: 4, status: "Departed Origin Country", location: "Narita Airport (NRT), Japan", detail: "Package loaded on international flight", iconName: "PlaneTakeoff" },
    { day: 6, status: "In Transit — International", location: "Mid-route", detail: "Package in transit over international airspace", iconName: "Globe" },
    { day: 8, status: `Arrived at Regional Hub`, location: `${destination.city}, ${destination.country}`, detail: `Package arrived at international gateway`, iconName: "PlaneLanding" },
    { day: 9, status: "Customs Clearance — Destination", location: `${destination.city}, ${destination.country}`, detail: "Import customs inspection in progress", iconName: "FileSearch" },
    { day: 10, status: "Customs Released", location: `${destination.city}, ${destination.country}`, detail: "Package cleared customs successfully", iconName: "CheckCircle" },
    { day: 11, status: "Arrived at Local Facility", location: `${destination.city}, ${destination.country} ${destination.zip}`, detail: "Package at local sorting center", iconName: "Factory" },
    { day: 12, status: "Out for Delivery", location: `${destination.city}, ${destination.country} ${destination.zip}`, detail: "Package with local delivery driver", iconName: "Truck" },
    { day: 13, status: "Delivery Attempted", location: `${destination.city}, ${destination.country} ${destination.zip}`, detail: "First delivery attempt made", iconName: "Bell" },
    { day: 14, status: "Delivered", location: `${destination.city}, ${destination.country} ${destination.zip}`, detail: "Package delivered successfully. Signed by recipient.", iconName: "PackageCheck" },
  ];
}

export function getTrackingProgress(trackingData) {
  const createdAt = new Date(trackingData.createdAt);
  const now = new Date();
  const diffMs = now - createdAt;
  const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const checkpoints = getCheckpoints(trackingData.destination);
  const reached = checkpoints.filter(c => c.day <= Math.min(daysPassed, 14));
  return { checkpoints, reached, daysPassed: Math.min(daysPassed, 14) };
}

export function loadStorage() {
  try {
    const raw = localStorage.getItem("jp_tracking_v1");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveStorage(data) {
  try { localStorage.setItem("jp_tracking_v1", JSON.stringify(data)); } catch {}
}
