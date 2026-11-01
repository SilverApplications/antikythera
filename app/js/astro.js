// Kalender- und Astronomie-Hilfen.
// Datumsangaben: astronomische Jahreszählung (Jahr 0 = 1 v. Chr., -204 = 205 v. Chr.).
// Vor dem 15.10.1582 julianischer, danach gregorianischer Kalender.
import * as Astronomy from '../vendor/astronomy.js';
import { t, lang } from './i18n.js';

export const TROPICAL_YEAR = 365.24219;
export const J2000 = 2451545.0;

export function julianDay(year, month, day) {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const gregorian = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)));
  let b = 0;
  if (gregorian) { const a = Math.floor(y / 100); b = 2 - a + Math.floor(a / 4); }
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

export function calendarDate(jd) {
  const z = Math.floor(jd + 0.5), f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) { const al = Math.floor((z - 1867216.25) / 36524.25); a = z + 1 + al - Math.floor(al / 4); }
  const b = a + 1524, c = Math.floor((b - 122.1) / 365.25), d = Math.floor(365.25 * c), e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { year, month, day: Math.floor(day) };
}

export function formatYear(y) {
  // y: astronomische Jahreszählung
  if (y <= 0) return lang === 'en' ? `${1 - y} BC` : `${1 - y} ${t('bc')}`;
  return lang === 'en' ? `AD ${y}` : `${y} ${t('ad')}`;
}
export function formatDate(jd) {
  const { year, month, day } = calendarDate(jd); const m = t('months')[month - 1];
  if (lang === 'en') return `${day} ${m} ${formatYear(year)}`;
  if (lang === 'el') return `${day} ${m} ${formatYear(year)}`;
  return `${day}. ${m} ${formatYear(year)}`;
}
export function calendarName(jd) { return jd < 2299160.5 ? t('julian') : t('gregorian'); }

// Ägyptischer Kalender (Ära Nabonassar, Thoth 1 = 26.2.747 v. Chr. jul.)
const EG_EPOCH = 1448638;
export const EG_MONTHS = ['Thoth', 'Phaophi', 'Athyr', 'Choiak', 'Tybi', 'Mechir', 'Phamenoth', 'Pharmuthi', 'Pachon', 'Payni', 'Epiphi', 'Mesore', 'Epagomenai'];
export function egyptianDate(jd) {
  const x = jd + 0.5 - EG_EPOCH;
  const frac = ((x % 365) + 365) % 365;   // stetiger Tag im Jahr (0 … 365)
  const doy = Math.floor(frac);
  return { doy, frac, month: Math.floor(doy / 30), day: (doy % 30) + 1 };
}

// Mittlere Bahnelemente (Meeus / Standish), tropisch, Grad. T in julianischen Jahrhunderten ab J2000.
export function meanElements(jd) {
  const T = (jd - J2000) / 36525;
  const prec = 1.396971 * T + 0.0003086 * T * T; // Standish-Elemente sind J2000-fest -> auf Äquinoktium des Datums
  return {
    sunL: 280.46646 + 36000.76983 * T,
    moonL: 218.3164477 + 481267.88123421 * T,
    moonM: 134.9633964 + 477198.8675055 * T,
    node: 125.0445479 - 1934.1362891 * T,
    helio: {
      mercury: 252.25032350 + 149472.67411175 * T + prec,
      venus: 181.97909950 + 58517.81538729 * T + prec,
      mars: -4.55343205 + 19140.30268499 * T + prec,
      jupiter: 34.39644051 + 3034.74612775 * T + prec,
      saturn: 49.95424423 + 1222.49362201 * T + prec,
    },
  };
}

// Echter Himmel (astronomy-engine, VSOP87 / NAO), wahre Ekliptik des Datums.
const BODIES = { mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn' };
export function realSky(jd) {
  const t = Astronomy.MakeTime(jd - J2000);
  const out = { sun: Astronomy.SunPosition(t).elon, moon: Astronomy.EclipticGeoMoon(t).lon };
  for (const [k, b] of Object.entries(BODIES)) out[k] = Astronomy.Ecliptic(Astronomy.GeoVector(b, t, true)).elon;
  const phase = Astronomy.MoonPhase(t); // 0 = Neumond, 180 = Vollmond
  out.moonPhase = phase;
  return out;
}

export function nextEclipses(jd) {
  const t = Astronomy.MakeTime(jd - J2000);
  const res = {};
  try { const l = Astronomy.SearchLunarEclipse(t); res.lunar = { jd: l.peak.ut + J2000, kind: l.kind }; } catch (e) { /* außerhalb des Gültigkeitsbereichs */ }
  try { const s = Astronomy.SearchGlobalSolarEclipse(t); res.solar = { jd: s.peak.ut + J2000, kind: s.kind }; } catch (e) { /* dito */ }
  return res;
}

export const norm360 = (a) => ((a % 360) + 360) % 360;
export const angDiff = (a, b) => { const d = norm360(a - b); return d > 180 ? d - 360 : d; };

export function zodiacLabel(lon) {
  const l = norm360(lon), i = Math.floor(l / 30);
  return `${t('zodiac')[i]} ${Math.floor(l - i * 30)}°`;
}
