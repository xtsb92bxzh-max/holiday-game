/**
 * Imports the January 2027 holiday workbook into normalised JSON for the site.
 *
 *   npm run import-data [path/to/workbook.xlsx]
 *
 * Reads the "Viable itineraries" and "Connections to verify" sheets and writes
 * src/data/itineraries.json. Totals are recomputed from src/data/assumptions.json
 * and compared with the workbook's own "With extras / two" column.
 */
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assumptions from '../src/data/assumptions.json';
import { estimateTotal, extrasForParty } from '../src/lib/pricing';
import { isEligibleTrip, nightsBetween } from '../src/lib/dates';
import type { EvidenceStatus, Itinerary, RouteType } from '../src/lib/types';

const ROOT = path.resolve(__dirname, '..');
const workbookPath =
  process.argv[2] ?? path.join(ROOT, 'data/source', assumptions.sourceWorkbook);
const outPath = path.join(ROOT, 'src/data/itineraries.json');

/** Workbook destination name → site destination id. Several names can share one destination. */
const DESTINATION_IDS: Record<string, string> = {
  'Wrocław': 'wroclaw',
  'Kaunas': 'kaunas',
  'Warsaw': 'warsaw',
  'Gdańsk': 'gdansk',
  'Kraków': 'krakow',
  'Vilnius via Kaunas': 'vilnius',
  'Vilnius': 'vilnius',
  'Prague': 'prague',
  'Pisa / Florence base': 'pisa-florence',
  'Berlin': 'berlin',
  'Copenhagen': 'copenhagen',
  'Tallinn': 'tallinn',
  'Paris via Beauvais': 'paris',
  'Paris CDG': 'paris',
  'Málaga': 'malaga',
  'Munich': 'munich',
  'Paphos': 'paphos',
  'Tenerife South': 'tenerife',
  'Rome': 'rome',
  'Porto': 'porto',
  'Luxembourg City': 'luxembourg',
  'Poznań': 'poznan',
  'Santander': 'santander',
  'Istanbul': 'istanbul',
  'Helsinki': 'helsinki',
  'Alicante': 'alicante',
  'Venice': 'venice',
  'Amsterdam': 'amsterdam',
  'Lanzarote': 'lanzarote',
  'Gran Canaria': 'gran-canaria',
  'Madrid': 'madrid',
  'Barcelona': 'barcelona',
  'Brussels Charleroi': 'brussels',
  'Geneva': 'geneva',
  'Zurich': 'zurich',
  'Vienna': 'vienna',
  'Bratislava via Vienna': 'bratislava',
  'Bucharest': 'bucharest',
  'Ljubljana': 'ljubljana',
  'Riga': 'riga',
  'Budapest': 'budapest',
  'Sofia': 'sofia',
  'Lisbon': 'lisbon',
  "Malta / St Julian's": 'malta',
  'Athens': 'athens',
  'Milan': 'milan',
  'Naples': 'naples',
  'Oslo': 'oslo',
  'Stockholm': 'stockholm',
};

/** Extra route warnings that the workbook states in prose rather than in a column. */
const GROUND_CAUTIONS: Record<string, string> = {
  KUN: 'Flight lands in Kaunas, not Vilnius. Allow for the onward bus or train each way.',
  BVA: 'Beauvais airport is well outside Paris. The coach transfer adds time and cost.',
  CRL: 'Charleroi airport is outside Brussels. The transfer adds time and cost.',
  VIE: 'Flight lands in Vienna. Allow for the onward bus or train to Bratislava.',
};

type Row = Record<string, unknown>;

/** Reads a sheet as objects keyed by the header row (first row whose first cell equals `firstHeader`). */
function readTable(ws: XLSX.WorkSheet, firstHeader: string): Row[] {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: null, blankrows: false });
  const headerIndex = grid.findIndex((r) => r[0] === firstHeader);
  if (headerIndex < 0) throw new Error(`Header "${firstHeader}" not found`);
  // Duplicate header names (e.g. two "Destination" columns) get a numeric suffix.
  const seen: Record<string, number> = {};
  const headers = grid[headerIndex].map((h) => {
    const name = String(h ?? '').trim();
    seen[name] = (seen[name] ?? 0) + 1;
    return seen[name] > 1 ? `${name} ${seen[name]}` : name;
  });
  return grid
    .slice(headerIndex + 1)
    .filter((values) => values.some((x) => x != null && x !== ''))
    .map((values) => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? null])));
}

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[£,]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
};
const janDate = (day: unknown) => `2027-01-${String(num(day)).padStart(2, '0')}`;

function routeTypeOf(evidence: string): RouteType {
  const e = evidence.toLowerCase();
  if (e.startsWith('direct + ground')) return 'direct_plus_ground';
  if (e.startsWith('connecting')) return 'connecting';
  if (e.startsWith('direct') || e.startsWith('scheduled direct')) return 'direct';
  return 'unknown';
}

function flightLinkKind(url?: string): Itinerary['flightLinkKind'] {
  if (!url) return undefined;
  if (url.includes('skyscanner')) return 'generic_search';
  if (url.includes('flightsfrom.com')) return 'timetable';
  return 'route_page';
}

function hhmm(v: unknown): string | undefined {
  const s = str(v);
  return s && /^\d{1,2}:\d{2}/.test(s) ? s.slice(0, 5).padStart(5, '0') : undefined;
}

function cautionsFor(it: Omit<Itinerary, 'routeCaution' | 'label'>): string | undefined {
  const notes: string[] = [];
  if (it.routeType === 'connecting')
    notes.push('The priced example involves a connection. Check layover length and whether it is a self-transfer.');
  if (it.routeType === 'direct_plus_ground' && GROUND_CAUTIONS[it.arrivalAirport])
    notes.push(GROUND_CAUTIONS[it.arrivalAirport]);
  if (it.arrivalAirport === 'CRL') notes.push(GROUND_CAUTIONS.CRL);
  if (it.sourceSheet === 'Connections to verify')
    notes.push('Exact-date search showed results, but stops, timings and fares are not established.');
  else if (!it.timesConfirmed) notes.push('Flight times were not reconfirmed. Check them before booking.');
  if (it.flightTimes) {
    if (it.flightTimes.leaveUK < '07:00')
      notes.push(`Early ${it.flightTimes.leaveUK} departure from ${it.departureAirport}.`);
    if (it.flightTimes.leaveThere < '15:00')
      notes.push(`Return flight leaves at ${it.flightTimes.leaveThere} local time, so the last day is short.`);
  }
  if (it.fareEvidence === 'scheduled_unpriced')
    notes.push('A schedule exists, but no fare has been matched to these dates.');
  return notes.length ? notes.join(' ') : undefined;
}

function label(it: Pick<Itinerary, 'departDate' | 'returnDate' | 'nights' | 'departureAirport' | 'arrivalAirport'>) {
  const d = (iso: string) => {
    const date = new Date(iso + 'T00:00:00Z');
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  return `${it.nights} nights · ${d(it.departDate)} → ${d(it.returnDate)} Jan · ${it.departureAirport} → ${it.arrivalAirport}`;
}

const warnings: string[] = [];

function finalise(base: Omit<Itinerary, 'routeCaution' | 'label'>): Itinerary | null {
  if (!isEligibleTrip(base.departDate, base.returnDate)) {
    warnings.push(`${base.sourceRef}: ${base.departDate}→${base.returnDate} breaks the travel window; skipped.`);
    return null;
  }
  return { ...base, label: label(base), routeCaution: cautionsFor(base) };
}

async function main() {
  const wb = XLSX.read(readFileSync(workbookPath));
  console.log(`Read ${path.basename(workbookPath)}: ${wb.SheetNames.join(', ')}`);

  const viable = wb.Sheets['Viable itineraries'];
  const connections = wb.Sheets['Connections to verify'];
  if (!viable || !connections) throw new Error('Expected sheets "Viable itineraries" and "Connections to verify".');

  const out: Itinerary[] = [];

  for (const r of readTable(viable, 'ID')) {
    const id = str(r['ID']);
    const name = str(r['Destination']);
    if (!id || !name) continue;
    if (assumptions.excludedCountries.includes(String(r['Country']))) continue;
    const destinationId = DESTINATION_IDS[name];
    if (!destinationId) {
      warnings.push(`${id}: no destination mapping for "${name}"; skipped.`);
      continue;
    }
    const evidence = str(r['Route evidence']) ?? '';
    const departDate = janDate(r['Depart Jan']);
    const returnDate = janDate(r['Return Jan']);
    const flightsPP = num(r['Flight £ / adult']);
    const room = num(r['Room £ / two']);
    const workbookTotal = num(r['With extras / two']);
    const total = estimateTotal(flightsPP, room);
    if (total != null && workbookTotal != null && Math.abs(total - workbookTotal) > 0.01)
      warnings.push(`${id}: recomputed total £${total} differs from workbook £${workbookTotal}.`);
    const fareEvidence: EvidenceStatus =
      total != null && workbookTotal != null ? 'priced_indicative' : 'scheduled_unpriced';
    const leaveUK = hhmm(r['Leave UK']);
    const flightTimes = leaveUK
      ? {
          leaveUK,
          arriveThere: hhmm(r['Arrive there'])!,
          leaveThere: hhmm(r['Leave there'])!,
          arriveUK: hhmm(r['Arrive UK'])!,
        }
      : undefined;
    const flightUrl = str(r['Flight link']);
    const it = finalise({
      id,
      destinationId,
      departureAirport: str(r['UK airport']) as 'GLA' | 'EDI',
      arrivalAirport: str(r['Destination 2']) ?? '',
      departDate,
      returnDate,
      nights: nightsBetween(departDate, returnDate) as 4 | 5,
      routeType: routeTypeOf(evidence),
      routeEvidence: evidence,
      timesConfirmed: evidence.startsWith('Scheduled direct pair'),
      flightTimes,
      hoursInDestination: num(r['Hours in destination']) ?? undefined,
      flightNumbers: str(r['Flight number(s)']),
      flightsPerPersonGBP: fareEvidence === 'priced_indicative' ? flightsPP : null,
      roomForTwoGBP: room,
      extrasForTwoGBP: fareEvidence === 'priced_indicative' ? extrasForParty() : null,
      estimatedTotalForTwoGBP: fareEvidence === 'priced_indicative' ? total : null,
      workbookTotalForTwoGBP: workbookTotal,
      fareEvidence,
      fareSource: str(r['Fare source / caution']) ?? '',
      flightSourceUrl: flightUrl,
      flightLinkKind: flightLinkKind(flightUrl),
      roomSourceUrl: str(r['Room link']),
      hotelName: str(r['Suggested room']),
      hotelReviewOutOf10: num(r['Rating /10']) ?? undefined,
      sourceSheet: 'Viable itineraries',
      sourceRef: id,
      workbookNote: str(r['Why go / caveat']),
    });
    if (it) out.push(it);
  }

  let n = 0;
  for (const r of readTable(connections, 'Destination')) {
    const name = str(r['Destination']);
    if (!name) continue;
    n += 1;
    const sourceRef = `CV${String(n).padStart(3, '0')}`;
    if (assumptions.excludedCountries.includes(String(r['Country']))) continue;
    const destinationId = DESTINATION_IDS[name];
    if (!destinationId) {
      warnings.push(`${sourceRef}: no destination mapping for "${name}"; skipped.`);
      continue;
    }
    const route = str(r['Route']) ?? '';
    const [from, toRaw] = route.split('→').map((s) => s.trim());
    const arrivalAirport = (toRaw ?? '').split(/\s|\+/)[0];
    const departDate = janDate(r['Outbound Jan']);
    const returnDate = janDate(r['Return Jan']);
    const it = finalise({
      id: sourceRef,
      destinationId,
      departureAirport: from as 'GLA' | 'EDI',
      arrivalAirport,
      departDate,
      returnDate,
      nights: nightsBetween(departDate, returnDate) as 4 | 5,
      routeType: route.includes('+') ? 'direct_plus_ground' : 'unknown',
      routeEvidence: str(r['Source status']) ?? '',
      timesConfirmed: false,
      flightsPerPersonGBP: null,
      roomForTwoGBP: num(r['Room / two']),
      extrasForTwoGBP: null,
      estimatedTotalForTwoGBP: null,
      workbookTotalForTwoGBP: null,
      fareEvidence: 'needs_manual_review',
      fareSource: 'Connection search only; no fare recorded',
      roomSourceUrl: str(r['Hotel quote link']),
      hotelName: str(r['Property']),
      hotelReviewOutOf10: num(r['Review']) ?? undefined,
      sourceSheet: 'Connections to verify',
      sourceRef,
      workbookNote: str(r['Why consider']),
    });
    if (it) out.push(it);
  }

  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  const priced = out.filter((i) => i.fareEvidence === 'priced_indicative').length;
  console.log(`Wrote ${out.length} itineraries (${priced} priced) to ${path.relative(ROOT, outPath)}`);
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    warnings.forEach((w) => console.warn(' - ' + w));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
