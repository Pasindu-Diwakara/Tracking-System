import { Country, City } from "country-state-city";

function encodeTrackingData(entry) {
  // 1. Country -> 0-675 (26 * 26)
  const cCode = entry.destination.code; // "US"
  const c1 = cCode.charCodeAt(0) - 65;
  const c2 = cCode.charCodeAt(1) - 65;
  const countryNum = c1 * 26 + c2;

  // 2. City Hash -> 0-1023
  let cityHash = 0;
  const city = entry.destination.city;
  for (let i = 0; i < city.length; i++) {
    cityHash = (cityHash * 31 + city.charCodeAt(i)) % 1024;
  }

  // 3. Days Since Epoch -> 0-4095
  const epoch = new Date("2024-01-01T00:00:00Z");
  const createdAt = new Date(entry.createdAt);
  const diffTime = Math.abs(createdAt - epoch);
  const daysSinceEpoch = Math.floor(diffTime / (1000 * 60 * 60 * 24)) % 4096;

  // 4. Weight Index -> 0-63
  const weightVal = parseFloat(entry.weight); // "1.5 kg" -> 1.5
  const weightIndex = Math.floor(weightVal * 10) % 64;

  // 5. Type Index -> 0-3
  const types = ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"];
  let typeIndex = types.indexOf(entry.type);
  if (typeIndex === -1) typeIndex = 0;

  // 6. Rand -> 0-15
  const rand = Math.floor(Math.random() * 16);

  // Combine into a single BigInt or Number (up to 44 bits is safe in JS Number)
  // countryNum: 10 bits
  // cityHash: 10 bits
  // daysSinceEpoch: 12 bits
  // weightIndex: 6 bits
  // typeIndex: 2 bits
  // rand: 4 bits
  let val = BigInt(countryNum);
  val = (val << 10n) | BigInt(cityHash);
  val = (val << 12n) | BigInt(daysSinceEpoch);
  val = (val << 6n) | BigInt(weightIndex);
  val = (val << 2n) | BigInt(typeIndex);
  val = (val << 4n) | BigInt(rand);

  return val.toString(36).toUpperCase();
}

function decodeTrackingData(encodedStr, carrier) {
  const types = ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"];
  const epoch = new Date("2024-01-01T00:00:00Z");

  try {
    let val = BigInt("0x" + parseInt(encodedStr, 36).toString(16));

    const rand = Number(val & 15n);
    val = val >> 4n;
    
    const typeIndex = Number(val & 3n);
    val = val >> 2n;

    const weightIndex = Number(val & 63n);
    val = val >> 6n;

    const daysSinceEpoch = Number(val & 4095n);
    val = val >> 12n;

    const cityHash = Number(val & 1023n);
    val = val >> 10n;

    const countryNum = Number(val);
    
    // Reconstruct Country
    const c1 = Math.floor(countryNum / 26);
    const c2 = countryNum % 26;
    const countryCode = String.fromCharCode(c1 + 65) + String.fromCharCode(c2 + 65);
    
    const countryInfo = Country.getCountryByCode(countryCode);
    const countryName = countryInfo ? countryInfo.name : "Unknown Country";
    const flag = countryInfo ? countryInfo.flag : "🌍";

    // Reconstruct City
    let cityName = "Unknown City";
    if (countryInfo) {
      const cities = City.getCitiesOfCountry(countryCode);
      // Find a city that matches the hash
      const matchingCity = cities.find(c => {
        let h = 0;
        for (let i = 0; i < c.name.length; i++) {
          h = (h * 31 + c.name.charCodeAt(i)) % 1024;
        }
        return h === cityHash;
      });
      if (matchingCity) {
        cityName = matchingCity.name;
      } else if (cities.length > 0) {
        cityName = cities[0].name;
      }
    }

    // Reconstruct Date
    const createdAt = new Date(epoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);

    // Reconstruct zip deterministically
    let zipHash = 0;
    for (let i = 0; i < encodedStr.length; i++) {
      zipHash = (zipHash * 31 + encodedStr.charCodeAt(i)) % 90000;
    }
    const zip = (zipHash + 10000).toString();

    return {
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
    return null;
  }
}

const mockEntry = {
  destination: { code: "US", city: "Los Angeles" },
  createdAt: new Date().toISOString(),
  weight: "2.4 kg",
  type: "Express Parcel"
};

const encoded = encodeTrackingData(mockEntry);
console.log("Encoded Base36:", encoded);

const decoded = decodeTrackingData(encoded, { name: "Mock Carrier" });
console.log("Decoded:", JSON.stringify(decoded, null, 2));

