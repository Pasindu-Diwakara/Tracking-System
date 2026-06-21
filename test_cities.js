import { Country, City } from "country-state-city";
let maxCities = 0;
for (const c of Country.getAllCountries()) {
  const cities = City.getCitiesOfCountry(c.isoCode);
  if (cities.length > maxCities) maxCities = cities.length;
}
console.log("Max cities in a country:", maxCities);
