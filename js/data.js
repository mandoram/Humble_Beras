/** Observatory model 2026.11.0. Stored sheet, not a live feed. */

export const MODEL = "2026.11.0";
export const AS_OF_LABEL = "Friday, 6 November 2026";
export const ZONE_LABEL = "Pacific";

export const Z95 = 1.6448536269514722;
export const Q95_LOG = 0.19598093964477425;
export const SIGMA = Q95_LOG / Z95;
export const MEAN = 0;
export const SHOCK = 0.2;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function normalCdf(z) {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

export function pricePercent(logReturn) {
  return (Math.exp(logReturn) - 1) * 100;
}

function phi(z) {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

export function brentDensity(minPct = -40, maxPct = 45, step = 0.5) {
  const samples = [];
  for (let pct = minPct; pct <= maxPct + 1e-9; pct += step) {
    const fraction = pct / 100;
    const logReturn = Math.log(1 + fraction);
    const density = phi((logReturn - MEAN) / SIGMA) / (SIGMA * (1 + fraction));
    samples.push({ pct: Math.round(pct * 10) / 10, density });
  }
  return samples;
}

export function riseTail() {
  return 1 - normalCdf(Math.log(1 + SHOCK) / SIGMA);
}

export function fallTail() {
  return normalCdf(Math.log(1 - SHOCK) / SIGMA);
}

export function middleHalf() {
  const z = 0.67448975;
  return {
    lo: pricePercent(MEAN - z * SIGMA),
    hi: pricePercent(MEAN + z * SIGMA),
  };
}

export const paths = [
  {
    id: "brent-21",
    name: "Brent, 21 days",
    series: "EIA Europe Brent spot",
    model: "Random walk",
    center: 0,
    centerLabel: "0%",
    lo: -18,
    hi: 22,
    loLabel: "-18%",
    hiLabel: "+22%",
    unit: "price change",
    cutoff: "2026-11-04",
    status: "open",
    statusLabel: "Unsettled",
    note: "Center is a zero log return, so the price change is zero. The band is the stored 5th to 95th percentile. Sigma is 0.119, from that 95% log-return quantile. On the holdout this Gaussian covered 87.9% of 33 origins inside the 90% band, so the tail is a scale, not a quoted price. Twenty-one days is the nearest scored horizon to the 30-day scenario. The Friday settle does not close this call.",
  },
  {
    id: "brent-5",
    name: "Brent, 5 days",
    series: "EIA Europe Brent spot",
    model: "Random walk",
    center: 0,
    centerLabel: "0%",
    lo: -9,
    hi: 10,
    loLabel: "-9%",
    hiLabel: "+10%",
    unit: "price change",
    cutoff: "2026-11-04",
    status: "open",
    statusLabel: "Unsettled",
    note: "Same random walk, shorter horizon. Thursday, 5 Nov, rose about 3.9% to about $98.29. Friday settled at $98.32, up three cents. Those sessions sit inside this band. The five-day window is not finished.",
  },
  {
    id: "cpi-headline",
    name: "US headline CPI, 1 month",
    series: "US consumer prices",
    model: "Oil pass-through",
    center: 0.33,
    centerLabel: "+0.33 pp",
    lo: -0.11,
    hi: 0.76,
    loLabel: "-0.11 pp",
    hiLabel: "+0.76 pp",
    unit: "percentage points",
    cutoff: "2026-10-14",
    status: "quiet",
    statusLabel: "No print",
    note: "Confirmed holdout model. It is not an operational accrual until a real-time vintage repeats the gain. CPI on this sheet still scores revised vintages. No print on 6 Nov.",
  },
  {
    id: "cpi-energy",
    name: "US energy CPI, 1 month",
    series: "US consumer prices",
    model: "Oil pass-through",
    center: 1.2,
    centerLabel: "+1.2 pp",
    lo: -2.9,
    hi: 5.3,
    loLabel: "-2.9 pp",
    hiLabel: "+5.3 pp",
    unit: "percentage points",
    cutoff: "2026-10-14",
    status: "quiet",
    statusLabel: "No print",
    note: "Same pass-through, applied to energy CPI. No print on 6 Nov.",
  },
  {
    id: "policy",
    name: "US policy rate, 3 months",
    series: "US policy rate",
    model: "AR(1)",
    center: 0.05,
    centerLabel: "+0.05 pp",
    lo: -1.4,
    hi: 1.5,
    loLabel: "-1.4 pp",
    hiLabel: "+1.5 pp",
    unit: "percentage points",
    cutoff: "2026-11-10",
    status: "ahead",
    statusLabel: "Cutoff ahead",
    note: "The center is a small number inside a wide band. The information cutoff is 10 Nov 2026, which has not arrived.",
  },
  {
    id: "stocks",
    name: "US crude stocks, 1 week",
    series: "US crude stocks",
    model: "AR(1)",
    center: -52,
    centerLabel: "-52 kbbl/day",
    lo: -7600,
    hi: 7500,
    loLabel: "-7,600",
    hiLabel: "+7,500",
    unit: "kbbl/day",
    cutoff: "2026-11-04",
    status: "quiet",
    statusLabel: "No print",
    note: "The center is a small number inside a wide band. No weekly print is on this sheet for 6 Nov.",
  },
  {
    id: "euro",
    name: "Euro-area inflation",
    series: "Euro-area inflation",
    model: "No change",
    center: 1.9,
    centerLabel: "1.9% yoy",
    lo: 1.4,
    hi: 2.4,
    loLabel: "1.4%",
    hiLabel: "2.4%",
    unit: "percent, year on year",
    cutoff: "2026-01-18",
    status: "quiet",
    statusLabel: "No print",
    note: "No-change forecast. No print on 6 Nov.",
  },
  {
    id: "gdp",
    name: "US real GDP growth",
    series: "US real GDP",
    model: "No change",
    center: 2.2,
    centerLabel: "2.2%",
    lo: -2.1,
    hi: 6.4,
    loLabel: "-2.1%",
    hiLabel: "+6.4%",
    unit: "percent",
    cutoff: "2026-07-01",
    status: "quiet",
    statusLabel: "No print",
    note: "No-change forecast. GDP on this sheet still scores revised vintages. No print on 6 Nov.",
  },
];

export const jobs = {
  title: "October employment",
  kicker: "Street consensus. Not an Observatory path.",
  actual: 165,
  actualLabel: "+165,000",
  consensusLo: 59,
  consensusHi: 70,
  consensusLabel: "59-70 thousand",
  scaleMax: 180,
  rows: [
    ["Unemployment", "4.1%", "4.2%"],
    ["Hourly earnings, month", "0.4%", "about 0.3%"],
    ["Hourly earnings, year", "3.1%", "about 2.9-3.0%"],
    ["Private payrolls", "159,000", "about 64,000"],
    ["Aug and Sep revisions", "+84,000 combined", ""],
  ],
  read: "Direction matched the consensus. The size did not. The print was about two and a half times the high end of the 59-70 thousand range.",
  source:
    "October employment situation, released the morning of 6 Nov 2026. Consensus draws on Dow Jones 59k, Econoday 62k, FactSet 65k, and Scotiabank 70k.",
};

export const brentTape = {
  settle: "$98.32",
  day: "+$0.03",
  dayPct: "+0.03%",
  week: "Down more than 16% on the week, and much of that drop came before the 4 Nov cutoff. It does not score against this sheet.",
  source: "Friday settle and the Thursday session, as recorded on 6 Nov 2026.",
};

export const shockMap = [
  ["Energy CPI", "+2.7 pp"],
  ["Headline CPI", "+0.26 pp"],
  ["Policy rate", "-0.001 pp"],
];

export function pathById(id) {
  return paths.find((path) => path.id === id) ?? null;
}
