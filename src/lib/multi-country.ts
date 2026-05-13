// Multi-Country Compare — fetch same indicator for ASEAN peers from World Bank API.
// Includes fallback static data in case API is slow/blocked by CORS.

const WB_BASE = "https://api.worldbank.org/v2";

export type CountryData = {
  country: string;
  countryCode: string;
  values: Array<{ year: string; value: number | null }>;
};

export const ASEAN_COUNTRIES = [
  { code: "IDN", name: "Indonesia", flag: "🇮🇩" },
  { code: "MYS", name: "Malaysia", flag: "🇲🇾" },
  { code: "THA", name: "Thailand", flag: "🇹🇭" },
  { code: "VNM", name: "Vietnam", flag: "🇻🇳" },
  { code: "PHL", name: "Philippines", flag: "🇵🇭" },
  { code: "SGP", name: "Singapore", flag: "🇸🇬" },
] as const;

export const COMPARE_INDICATORS = [
  { code: "NY.GDP.MKTP.KD.ZG", name: "GDP Growth (%)", unit: "%" },
  { code: "FP.CPI.TOTL.ZG", name: "Inflation (%)", unit: "%" },
  { code: "SL.UEM.TOTL.ZS", name: "Unemployment (%)", unit: "%" },
  { code: "FR.INR.RINR", name: "Real Interest Rate (%)", unit: "%" },
  { code: "BX.KLT.DINV.CD.WD", name: "FDI Net Inflows (USD)", unit: "USD" },
] as const;

export type CompareIndicatorCode = typeof COMPARE_INDICATORS[number]["code"];

// Fallback data (World Bank actual data, cached) for when API is unreachable
const FALLBACK_GDP: CountryData[] = [
  { country: "Indonesia", countryCode: "IDN", values: [
    { year: "2016", value: 5.03 }, { year: "2017", value: 5.07 }, { year: "2018", value: 5.17 },
    { year: "2019", value: 5.02 }, { year: "2020", value: -2.07 }, { year: "2021", value: 3.70 },
    { year: "2022", value: 5.31 }, { year: "2023", value: 5.05 }, { year: "2024", value: 5.03 },
  ]},
  { country: "Malaysia", countryCode: "MYS", values: [
    { year: "2016", value: 4.45 }, { year: "2017", value: 5.81 }, { year: "2018", value: 4.77 },
    { year: "2019", value: 4.41 }, { year: "2020", value: -5.46 }, { year: "2021", value: 3.30 },
    { year: "2022", value: 8.65 }, { year: "2023", value: 3.67 }, { year: "2024", value: 5.10 },
  ]},
  { country: "Thailand", countryCode: "THA", values: [
    { year: "2016", value: 3.40 }, { year: "2017", value: 4.05 }, { year: "2018", value: 4.19 },
    { year: "2019", value: 2.14 }, { year: "2020", value: -6.10 }, { year: "2021", value: 1.55 },
    { year: "2022", value: 2.64 }, { year: "2023", value: 1.92 }, { year: "2024", value: 2.80 },
  ]},
  { country: "Vietnam", countryCode: "VNM", values: [
    { year: "2016", value: 6.21 }, { year: "2017", value: 6.81 }, { year: "2018", value: 7.08 },
    { year: "2019", value: 7.02 }, { year: "2020", value: 2.91 }, { year: "2021", value: 2.58 },
    { year: "2022", value: 8.02 }, { year: "2023", value: 5.05 }, { year: "2024", value: 7.09 },
  ]},
  { country: "Philippines", countryCode: "PHL", values: [
    { year: "2016", value: 7.15 }, { year: "2017", value: 6.92 }, { year: "2018", value: 6.34 },
    { year: "2019", value: 6.12 }, { year: "2020", value: -9.52 }, { year: "2021", value: 5.72 },
    { year: "2022", value: 7.57 }, { year: "2023", value: 5.55 }, { year: "2024", value: 5.60 },
  ]},
  { country: "Singapore", countryCode: "SGP", values: [
    { year: "2016", value: 3.60 }, { year: "2017", value: 4.49 }, { year: "2018", value: 3.65 },
    { year: "2019", value: 1.30 }, { year: "2020", value: -3.90 }, { year: "2021", value: 8.86 },
    { year: "2022", value: 3.64 }, { year: "2023", value: 1.14 }, { year: "2024", value: 4.40 },
  ]},
];

const FALLBACK_INFLATION: CountryData[] = [
  { country: "Indonesia", countryCode: "IDN", values: [
    { year: "2016", value: 3.53 }, { year: "2017", value: 3.81 }, { year: "2018", value: 3.20 },
    { year: "2019", value: 2.82 }, { year: "2020", value: 2.04 }, { year: "2021", value: 1.56 },
    { year: "2022", value: 4.21 }, { year: "2023", value: 3.71 }, { year: "2024", value: 2.18 },
  ]},
  { country: "Malaysia", countryCode: "MYS", values: [
    { year: "2016", value: 2.09 }, { year: "2017", value: 3.87 }, { year: "2018", value: 0.97 },
    { year: "2019", value: 0.66 }, { year: "2020", value: -1.14 }, { year: "2021", value: 2.48 },
    { year: "2022", value: 3.38 }, { year: "2023", value: 2.49 }, { year: "2024", value: 1.80 },
  ]},
  { country: "Thailand", countryCode: "THA", values: [
    { year: "2016", value: 0.19 }, { year: "2017", value: 0.67 }, { year: "2018", value: 1.06 },
    { year: "2019", value: 0.71 }, { year: "2020", value: -0.85 }, { year: "2021", value: 1.23 },
    { year: "2022", value: 6.08 }, { year: "2023", value: 1.23 }, { year: "2024", value: 0.40 },
  ]},
  { country: "Vietnam", countryCode: "VNM", values: [
    { year: "2016", value: 2.67 }, { year: "2017", value: 3.52 }, { year: "2018", value: 3.54 },
    { year: "2019", value: 2.80 }, { year: "2020", value: 3.23 }, { year: "2021", value: 1.83 },
    { year: "2022", value: 3.16 }, { year: "2023", value: 3.25 }, { year: "2024", value: 3.63 },
  ]},
  { country: "Philippines", countryCode: "PHL", values: [
    { year: "2016", value: 1.25 }, { year: "2017", value: 2.85 }, { year: "2018", value: 5.21 },
    { year: "2019", value: 2.48 }, { year: "2020", value: 2.39 }, { year: "2021", value: 3.93 },
    { year: "2022", value: 5.82 }, { year: "2023", value: 5.97 }, { year: "2024", value: 3.20 },
  ]},
  { country: "Singapore", countryCode: "SGP", values: [
    { year: "2016", value: -0.53 }, { year: "2017", value: 0.58 }, { year: "2018", value: 0.44 },
    { year: "2019", value: 0.57 }, { year: "2020", value: -0.18 }, { year: "2021", value: 2.30 },
    { year: "2022", value: 6.12 }, { year: "2023", value: 4.82 }, { year: "2024", value: 2.40 },
  ]},
];

const FALLBACK_UNEMPLOYMENT: CountryData[] = [
  { country: "Indonesia", countryCode: "IDN", values: [
    { year: "2016", value: 5.61 }, { year: "2017", value: 5.50 }, { year: "2018", value: 5.34 },
    { year: "2019", value: 5.28 }, { year: "2020", value: 7.07 }, { year: "2021", value: 6.49 },
    { year: "2022", value: 5.86 }, { year: "2023", value: 5.32 }, { year: "2024", value: 4.91 },
  ]},
  { country: "Malaysia", countryCode: "MYS", values: [
    { year: "2016", value: 3.44 }, { year: "2017", value: 3.41 }, { year: "2018", value: 3.31 },
    { year: "2019", value: 3.28 }, { year: "2020", value: 4.55 }, { year: "2021", value: 4.65 },
    { year: "2022", value: 3.87 }, { year: "2023", value: 3.58 }, { year: "2024", value: 3.30 },
  ]},
  { country: "Thailand", countryCode: "THA", values: [
    { year: "2016", value: 0.97 }, { year: "2017", value: 1.16 }, { year: "2018", value: 1.06 },
    { year: "2019", value: 0.98 }, { year: "2020", value: 1.69 }, { year: "2021", value: 1.93 },
    { year: "2022", value: 1.33 }, { year: "2023", value: 1.01 }, { year: "2024", value: 1.10 },
  ]},
  { country: "Vietnam", countryCode: "VNM", values: [
    { year: "2016", value: 2.30 }, { year: "2017", value: 2.17 }, { year: "2018", value: 2.19 },
    { year: "2019", value: 2.16 }, { year: "2020", value: 2.39 }, { year: "2021", value: 3.22 },
    { year: "2022", value: 2.32 }, { year: "2023", value: 2.28 }, { year: "2024", value: 2.24 },
  ]},
  { country: "Philippines", countryCode: "PHL", values: [
    { year: "2016", value: 5.49 }, { year: "2017", value: 5.73 }, { year: "2018", value: 5.29 },
    { year: "2019", value: 5.12 }, { year: "2020", value: 10.39 }, { year: "2021", value: 7.77 },
    { year: "2022", value: 5.43 }, { year: "2023", value: 4.45 }, { year: "2024", value: 3.80 },
  ]},
  { country: "Singapore", countryCode: "SGP", values: [
    { year: "2016", value: 2.09 }, { year: "2017", value: 2.20 }, { year: "2018", value: 2.13 },
    { year: "2019", value: 2.26 }, { year: "2020", value: 2.99 }, { year: "2021", value: 2.67 },
    { year: "2022", value: 2.14 }, { year: "2023", value: 1.94 }, { year: "2024", value: 2.00 },
  ]},
];

const FALLBACK_MAP: Partial<Record<CompareIndicatorCode, CountryData[]>> = {
  "NY.GDP.MKTP.KD.ZG": FALLBACK_GDP,
  "FP.CPI.TOTL.ZG": FALLBACK_INFLATION,
  "SL.UEM.TOTL.ZS": FALLBACK_UNEMPLOYMENT,
};

export async function fetchMultiCountryData(
  indicatorCode: CompareIndicatorCode,
  countries = ASEAN_COUNTRIES.map((c) => c.code),
): Promise<CountryData[]> {
  const countryCodes = countries.join(";");
  const currentYear = new Date().getFullYear();
  // Use per_page=500 to ensure we get all data in one request
  const url =
    `${WB_BASE}/country/${countryCodes}/indicator/${indicatorCode}` +
    `?format=json&per_page=500&date=${currentYear - 10}:${currentYear}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);

    const json = await res.json() as [unknown, Array<{
      country: { id: string; value: string };
      date: string;
      value: number | null;
    }> | null];

    if (!Array.isArray(json) || !Array.isArray(json[1]) || json[1].length === 0) {
      throw new Error("No data returned from World Bank");
    }

    // Group by country
    const grouped: Record<string, CountryData> = {};
    for (const row of json[1]) {
      const code = row.country.id;
      if (!grouped[code]) {
        grouped[code] = { country: row.country.value, countryCode: code, values: [] };
      }
      grouped[code].values.push({ year: row.date, value: row.value });
    }

    // Sort values by year
    for (const cd of Object.values(grouped)) {
      cd.values.sort((a, b) => a.year.localeCompare(b.year));
    }

    const result = Object.values(grouped);
    // If we got data for at least 2 countries, use it
    if (result.length >= 2) return result;
    throw new Error("Insufficient data");
  } catch (err) {
    // Fallback to cached static data
    const fallback = FALLBACK_MAP[indicatorCode];
    if (fallback) return fallback;
    throw err;
  }
}
