// ─── Provinces ────────────────────────────────────────────────

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Azad Kashmir",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
] as const;

export type Province = (typeof PROVINCES)[number];

// ─── Cities by province ───────────────────────────────────────

export const CITIES_BY_PROVINCE: Record<Province, string[]> = {
  Punjab: [
    "Lahore",
    "Faisalabad",
    "Rawalpindi",
    "Gujranwala",
    "Multan",
    "Sialkot",
    "Bahawalpur",
    "Sargodha",
    "Sheikhupura",
    "Gujrat",
    "Jhelum",
    "Okara",
    "Rahim Yar Khan",
    "Sahiwal",
    "Wah Cantonment",
    "Dera Ghazi Khan",
    "Kasur",
    "Attock",
    "Nankana Sahib",
    "Vehari",
    "Chiniot",
    "Mianwali",
    "Bhawalnagar",
    "Hafizabad",
    "Toba Tek Singh",
    "Chakwal",
    "Narowal",
    "Pakpattan",
    "Muzaffargarh",
    "Layyah",
    "Mandi Bahauddin",
    "Bahawalnagar",
    "Khushab",
    "Lodhran",
    "Khanewal",
  ],
  Sindh: [
    "Karachi",
    "Hyderabad",
    "Sukkur",
    "Larkana",
    "Nawabshah",
    "Mirpur Khas",
    "Jacobabad",
    "Shikarpur",
    "Khairpur",
    "Dadu",
    "Badin",
    "Thatta",
    "Sanghar",
    "Umerkot",
    "Tando Adam",
    "Tando Allahyar",
    "Ghotki",
    "Shahdadpur",
    "Matiari",
    "Jamshoro",
    "Qambar Shahdadkot",
    "Naushahro Firoze",
    "Kashmore",
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar",
    "Abbottabad",
    "Mardan",
    "Swat",
    "Mingora",
    "Nowshera",
    "Charsadda",
    "Kohat",
    "Mansehra",
    "Bannu",
    "Swabi",
    "Dera Ismail Khan",
    "Buner",
    "Dir",
    "Chitral",
    "Hangu",
    "Karak",
    "Battagram",
    "Haripur",
    "Lakki Marwat",
    "Shangla",
    "Malakand",
    "Tank",
  ],
  Balochistan: [
    "Quetta",
    "Turbat",
    "Khuzdar",
    "Hub",
    "Chaman",
    "Zhob",
    "Gwadar",
    "Sibi",
    "Dera Murad Jamali",
    "Panjgur",
    "Nushki",
    "Kalat",
    "Loralai",
    "Kharan",
    "Mastung",
    "Nasirabad",
    "Lasbela",
    "Washuk",
  ],
  "Azad Kashmir": [
    "Muzaffarabad",
    "Mirpur",
    "Rawalakot",
    "Kotli",
    "Bagh",
    "Bhimber",
    "Pallandri",
    "Hattian Bala",
    "Haveli",
    "Sudhnoti",
  ],
  "Gilgit-Baltistan": [
    "Gilgit",
    "Skardu",
    "Hunza",
    "Ghanche",
    "Diamer",
    "Astore",
    "Ghizer",
    "Nagar",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
};

// ─── Flat list for searching ───────────────────────────────────

export const ALL_CITIES: string[] = [
  "Islamabad",
  "Karachi",
  "Lahore",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Swat",
  "Mardan",
  "Sukkur",
  "Jhelum",
  "Gujrat",
  "Sheikhupura",
  "Okara",
  "Rahim Yar Khan",
  "Dera Ghazi Khan",
  "Charsadda",
  "Nowshera",
  "Mingora",
  "Larkana",
  "Sahiwal",
  "Nawabshah",
  "Mirpur Khas",
  "Muzaffarabad",
  "Mirpur",
  "Gilgit",
  "Skardu",
  "Turbat",
  "Gwadar",
  "Wah Cantonment",
  "Attock",
  "Kasur",
  "Hafizabad",
  "Chiniot",
  "Mianwali",
  "Chakwal",
  "Dera Ismail Khan",
  "Kohat",
  "Mansehra",
  "Bannu",
  "Khairpur",
  "Jacobabad",
  "Shikarpur",
  "Naushahro Firoze",
  "Toba Tek Singh",
  "Muzaffargarh",
  "Khanewal",
  "Lodhran",
  "Vehari",
  "Pakpattan",
  "Layyah",
  "Mandi Bahauddin",
  "Narowal",
  "Hub",
  "Khuzdar",
  "Chaman",
  "Zhob",
  "Swabi",
  "Buner",
  "Rawalakot",
  "Kotli",
];

// ─── Shipping rates ───────────────────────────────────────────

const MAJOR_CITIES = new Set([
  "Islamabad",
  "Karachi",
  "Lahore",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
]);

const REMOTE_PROVINCES = new Set([
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Kashmir",
]);

export type ShippingRate = {
  id: string;
  label: string;
  description: string;
  price: number;
  days: string;
};

export function getShippingRates(city: string, province: string): ShippingRate[] {
  const isRemote = REMOTE_PROVINCES.has(province as Province);
  const isMajor = MAJOR_CITIES.has(city);

  const standardPrice = isRemote ? 350 : isMajor ? 150 : 200;
  const expressPrice = isRemote ? 600 : isMajor ? 300 : 400;
  const standardDays = isRemote ? "7–10" : isMajor ? "2–4" : "3–5";
  const expressDays = isRemote ? "3–5" : isMajor ? "1–2" : "2–3";

  return [
    {
      id: "standard",
      label: "Standard Delivery",
      description: `Delivered in ${standardDays} business days`,
      price: standardPrice,
      days: standardDays,
    },
    {
      id: "express",
      label: "Express Delivery",
      description: `Delivered in ${expressDays} business days`,
      price: expressPrice,
      days: expressDays,
    },
  ];
}

export function getProvinceForCity(city: string): Province | null {
  for (const [province, cities] of Object.entries(CITIES_BY_PROVINCE)) {
    if (cities.includes(city)) return province as Province;
  }
  return null;
}

export function getDeliveryDate(daysRange: string): string {
  const match = daysRange.match(/(\d+)–(\d+)/);
  if (!match) return "";
  const min = parseInt(match[1]);
  const max = parseInt(match[2]);
  const now = new Date();
  const minDate = new Date(now);
  const maxDate = new Date(now);
  minDate.setDate(now.getDate() + min);
  maxDate.setDate(now.getDate() + max);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}
