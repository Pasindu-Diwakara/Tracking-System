import { Country, City } from "country-state-city";

function encodeTrackingData(entry) {
  const cCode = entry.destination.code; // "US"
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

function decodeTrackingData(encodedStr, carrier) {
  const types = ["Standard Package", "Express Parcel", "Registered Mail", "Priority Shipment"];
  const epoch = new Date("2024-01-01T00:00:00Z");

  try {
    // Parse BigInt from base 36
    // BigInt can't directly parse base 36 strings easily if they're very large unless we use a custom parser
    // Or we can convert base 36 to base 16 string first
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
