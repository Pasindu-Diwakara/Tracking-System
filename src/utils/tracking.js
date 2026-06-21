export const CARRIERS = [
  { name: "Japan Post EMS", code: "JE", prefix: "EA", suffix: "JP" },
  { name: "FedEx International", code: "FX", prefix: "FX", suffix: "JP" },
  { name: "DHL Express", code: "DH", prefix: "JD", suffix: "DE" },
  { name: "UPS Worldwide", code: "UP", prefix: "1Z", suffix: "JP" },
  { name: "Yamato International", code: "YM", prefix: "YM", suffix: "JP" },
  { name: "Sagawa Express", code: "SG", prefix: "SG", suffix: "JP" },
];

export function generateTrackingNumber(carrier, destinationCode) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nums = "0123456789";
  const rand = (len, set) => Array.from({ length: len }, () => set[Math.floor(Math.random() * set.length)]).join("");

  if (carrier.code === "JE") return `${carrier.prefix}${rand(8, nums)}${carrier.suffix}`;
  if (carrier.code === "FX") return `${carrier.prefix}${rand(12, nums)}`;
  if (carrier.code === "DH") return `${carrier.prefix}${rand(10, nums)}`;
  if (carrier.code === "UP") return `${carrier.prefix}${rand(6, chars)}${rand(8, nums)}`;
  return `${carrier.prefix}${rand(4, chars)}${rand(8, nums)}${destinationCode}`;
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
