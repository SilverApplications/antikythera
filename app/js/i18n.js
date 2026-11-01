// Mehrsprachigkeit. Zwei getrennte Einstellungen:
//  - Webseitensprache (UI + Inhalte): de | en | el
//  - Beschriftung am Gerät (Texturen):  orig (Altgriechisch) | de | en
import { I18N } from './generated/data.js';

export const SITE_LANGS = { de: 'Deutsch', en: 'English', el: 'Ελληνικά' };
export const DEVICE_LANGS = { orig: { de: 'Original (Altgriechisch)', en: 'Original (Ancient Greek)', el: 'Πρωτότυπο (αρχαία ελληνικά)' }, de: { de: 'Deutsch', en: 'German', el: 'Γερμανικά' }, en: { de: 'Englisch', en: 'English', el: 'Αγγλικά' } };

const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } } };
const guess = () => { const n = (navigator.language || 'de').slice(0, 2); return SITE_LANGS[n] ? n : 'en'; };
export let lang = store.get('ak-lang') || guess();
export let deviceLang = store.get('ak-device') || 'orig';
const listeners = new Set();
export const onLangChange = (fn) => listeners.add(fn);
export function setLang(l) { lang = l; store.set('ak-lang', l); document.documentElement.lang = l; listeners.forEach((f) => f('site')); }
export function setDeviceLang(l) { deviceLang = l; store.set('ak-device', l); listeners.forEach((f) => f('device')); }

const UI = {
  de: {
    version: 'Rekonstruktion v0.3 · Forschungsstand 11/2026', siteLang: 'Sprache', deviceLang: 'Beschriftung am Gerät',
    'view.front': 'Front', 'view.back': 'Rückseite', 'view.gears': 'Getriebe', 'view.explode': 'Explosion',
    schematic: 'Achslagen schematisch', schematicTitle: 'Abstände aus Zähnezahlen exakt, Richtungen schematisch',
    'tab.model': 'Modell', 'tab.dials': 'Anzeigen', 'tab.map': 'Karte', 'tab.time': 'Zeitstrahl', 'tab.research': 'Forschung',
    tools: 'Werkzeuge', explode: 'Demontage', section: 'Schnitt', evidence: 'Evidenz einfärben', ghosts: 'Echten Himmel einblenden', assemblies: 'Baugruppen',
    setDate: 'Datum einstellen', go: 'Los', bc: 'v. Chr.', ad: 'n. Chr.', day: 'Tag', month: 'Monat', year: 'Jahr', era: 'Ära',
    'preset.saros': 'Saros-Start 205 v. Chr.', 'preset.calendar': 'Kalenderstart', 'preset.eclipse': 'Vollmond 12.5.205 v. Chr. (Saros-Monat 1)', 'preset.wreck': 'Untergang ~65 v. Chr.', 'preset.today': 'Heute',
    frontH: 'Front: Kosmos', mech: 'Mechanismus', sky: 'Himmel', delta: 'Δ',
    deltaHint: 'Δ = Abweichung des Mechanismus vom echten Himmel (berechnet mit astronomy-engine). Kleine Δ nahe 205 v. Chr. zeigen, wie gut das Gerät rechnete; über Jahrhunderte wächst der Fehler.',
    backH: 'Rückseite: Kalender & Finsternisse', eclH: 'Nächste Finsternisse (echter Himmel)', goThere: 'hin',
    sun: 'Sonne', moon: 'Mond', mercury: 'Merkur', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', date: 'Datum',
    moonPhase: 'Mondphase', lit: '{n} % beleuchtet',
    metonic: 'Metonisch', monthOf: 'Monat {a} / {b}', yearOf: 'Jahr {a} / {b}', games: 'Spiele', gamesYear: 'Jahr {a}: {b}', callippic: 'Kallipp', sector: 'Sektor {a} / {b}',
    saros: 'Saros', exeligmos: 'Exeligmos', correction: 'Korrektur {a}', egCal: 'Ägypt. Kalender', and: ' & ',
    lunarEcl: 'Mondfinsternis', solarEcl: 'Sonnenfinsternis', 'k.total': 'total', 'k.partial': 'partiell', 'k.penumbral': 'Halbschatten', 'k.annular': 'ringförmig', 'k.hybrid': 'hybrid',
    mapH: 'Fundort, Herkunft, Route', mapHint: 'Küstenlinien: Natural Earth (Public Domain). Heutige Küsten, nicht antike.', route: 'Vermutete Schiffsroute',
    timeH: 'Zeitstrahl', jump: 'Mechanismus auf {y} stellen',
    sureH: 'Was ist sicher?', papersH: 'Forschung kurz erklärt', sourcesH: 'Quellen', swHint: 'Software: three.js (MIT), astronomy-engine (MIT). Getriebe-Rekonstruktion der Front nach Freeth et al. 2021 (CC BY 4.0).',
    done: 'Gemacht', result: 'Ergebnis', why: 'Warum wichtig', certainty: 'Sicherheit', gears: 'Räder', teeth: 'Zähne',
    loading: 'Zahnräder werden gefeilt …', julian: 'julianisch', gregorian: 'gregorianisch', egShort: 'ägypt.', crank: 'Kurbel', crankTurns: 'Kurbel {n} U.', crankTitle: 'Kurbel drehen: 1 Umdrehung ≈ 78 Tage',
    play: 'Abspielen', pause: 'Pause', stepBack: 'Einen Schritt zurück', stepFwd: 'Einen Schritt vor', close: 'Schließen', speed: 'Geschwindigkeit',
    'sp.1': '1 Tag/s', 'sp.7': '1 Woche/s', 'sp.30': '1 Monat/s', 'sp.365': '1 Jahr/s', 'sp.saros': '1 Saros/s',
    months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    zodiac: ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau', 'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'],
    'lvl.belegt': 'belegt', 'lvl.modell': 'Modell', 'lvl.hypothese': 'Hypothese', 'lvl.historisch': 'historisch',
  },
  en: {
    version: 'Reconstruction v0.3 · research as of 11/2026', siteLang: 'Language', deviceLang: 'Lettering on the device',
    'view.front': 'Front', 'view.back': 'Back', 'view.gears': 'Gearing', 'view.explode': 'Exploded',
    schematic: 'Axle positions schematic', schematicTitle: 'Distances exact from tooth counts, directions schematic',
    'tab.model': 'Model', 'tab.dials': 'Dials', 'tab.map': 'Map', 'tab.time': 'Timeline', 'tab.research': 'Research',
    tools: 'Tools', explode: 'Disassemble', section: 'Section', evidence: 'Colour by evidence', ghosts: 'Show real sky', assemblies: 'Assemblies',
    setDate: 'Set date', go: 'Go', bc: 'BC', ad: 'AD', day: 'Day', month: 'Month', year: 'Year', era: 'Era',
    'preset.saros': 'Saros start 205 BC', 'preset.calendar': 'Calendar start', 'preset.eclipse': 'Full moon 12 May 205 BC (Saros month 1)', 'preset.wreck': 'Shipwreck ~65 BC', 'preset.today': 'Today',
    frontH: 'Front: cosmos', mech: 'Mechanism', sky: 'Sky', delta: 'Δ',
    deltaHint: 'Δ = how far the mechanism is from the real sky (computed with astronomy-engine). Small Δ near 205 BC show how well the device calculated; over centuries the error grows.',
    backH: 'Back: calendar & eclipses', eclH: 'Next eclipses (real sky)', goThere: 'go',
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', date: 'Date',
    moonPhase: 'Moon phase', lit: '{n} % lit',
    metonic: 'Metonic', monthOf: 'Month {a} / {b}', yearOf: 'Year {a} / {b}', games: 'Games', gamesYear: 'Year {a}: {b}', callippic: 'Callippic', sector: 'Sector {a} / {b}',
    saros: 'Saros', exeligmos: 'Exeligmos', correction: 'Correction {a}', egCal: 'Egyptian calendar', and: ' & ',
    lunarEcl: 'Lunar eclipse', solarEcl: 'Solar eclipse', 'k.total': 'total', 'k.partial': 'partial', 'k.penumbral': 'penumbral', 'k.annular': 'annular', 'k.hybrid': 'hybrid',
    mapH: 'Find spot, origin, route', mapHint: 'Coastlines: Natural Earth (public domain). Modern coasts, not ancient ones.', route: 'Presumed route of the ship',
    timeH: 'Timeline', jump: 'Set mechanism to {y}',
    sureH: 'What is certain?', papersH: 'Research in brief', sourcesH: 'Sources', swHint: 'Software: three.js (MIT), astronomy-engine (MIT). Front gearing reconstructed after Freeth et al. 2021 (CC BY 4.0).',
    done: 'What they did', result: 'Result', why: 'Why it matters', certainty: 'Certainty', gears: 'gears', teeth: 'teeth',
    loading: 'Filing the gear teeth …', julian: 'Julian', gregorian: 'Gregorian', egShort: 'Egypt.', crank: 'Crank', crankTurns: 'Crank {n} turns', crankTitle: 'Turn the crank: 1 turn ≈ 78 days',
    play: 'Play', pause: 'Pause', stepBack: 'Step back', stepFwd: 'Step forward', close: 'Close', speed: 'Speed',
    'sp.1': '1 day/s', 'sp.7': '1 week/s', 'sp.30': '1 month/s', 'sp.365': '1 year/s', 'sp.saros': '1 Saros/s',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    zodiac: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    'lvl.belegt': 'established', 'lvl.modell': 'model', 'lvl.hypothese': 'hypothesis', 'lvl.historisch': 'historical',
  },
  el: {
    version: 'Ανακατασκευή v0.3 · ερευνητικά δεδομένα 11/2026', siteLang: 'Γλώσσα', deviceLang: 'Επιγραφές στη συσκευή',
    'view.front': 'Εμπρός', 'view.back': 'Πίσω', 'view.gears': 'Γρανάζια', 'view.explode': 'Ανάπτυξη',
    schematic: 'Θέσεις αξόνων σχηματικές', schematicTitle: 'Αποστάσεις ακριβείς από τον αριθμό δοντιών, κατευθύνσεις σχηματικές',
    'tab.model': 'Μοντέλο', 'tab.dials': 'Ενδείξεις', 'tab.map': 'Χάρτης', 'tab.time': 'Χρονολόγιο', 'tab.research': 'Έρευνα',
    tools: 'Εργαλεία', explode: 'Αποσυναρμολόγηση', section: 'Τομή', evidence: 'Χρωματισμός τεκμηρίωσης', ghosts: 'Εμφάνιση πραγματικού ουρανού', assemblies: 'Υποσυστήματα',
    setDate: 'Ορισμός ημερομηνίας', go: 'Μετάβαση', bc: 'π.Χ.', ad: 'μ.Χ.', day: 'Ημέρα', month: 'Μήνας', year: 'Έτος', era: 'Εποχή',
    'preset.saros': 'Έναρξη Σάρου 205 π.Χ.', 'preset.calendar': 'Έναρξη ημερολογίου', 'preset.eclipse': 'Πανσέληνος 12.5.205 π.Χ. (μήνας 1 του Σάρου)', 'preset.wreck': 'Ναυάγιο ~65 π.Χ.', 'preset.today': 'Σήμερα',
    frontH: 'Εμπρός: Κόσμος', mech: 'Μηχανισμός', sky: 'Ουρανός', delta: 'Δ',
    deltaHint: 'Δ = απόκλιση του μηχανισμού από τον πραγματικό ουρανό (υπολογισμός με astronomy-engine). Μικρές τιμές κοντά στο 205 π.Χ. δείχνουν πόσο καλά υπολόγιζε η συσκευή· με τους αιώνες το σφάλμα μεγαλώνει.',
    backH: 'Πίσω: ημερολόγιο & εκλείψεις', eclH: 'Επόμενες εκλείψεις (πραγματικός ουρανός)', goThere: 'μετάβαση',
    sun: 'Ήλιος', moon: 'Σελήνη', mercury: 'Ερμής', venus: 'Αφροδίτη', mars: 'Άρης', jupiter: 'Δίας', saturn: 'Κρόνος', date: 'Ημερομηνία',
    moonPhase: 'Φάση Σελήνης', lit: '{n} % φωτισμένη',
    metonic: 'Μετωνικός', monthOf: 'Μήνας {a} / {b}', yearOf: 'Έτος {a} / {b}', games: 'Αγώνες', gamesYear: 'Έτος {a}: {b}', callippic: 'Καλλιππικός', sector: 'Τομέας {a} / {b}',
    saros: 'Σάρος', exeligmos: 'Εξελιγμός', correction: 'Διόρθωση {a}', egCal: 'Αιγυπτ. ημερολόγιο', and: ' & ',
    lunarEcl: 'Σεληνιακή έκλειψη', solarEcl: 'Ηλιακή έκλειψη', 'k.total': 'ολική', 'k.partial': 'μερική', 'k.penumbral': 'παρασκιώδης', 'k.annular': 'δακτυλιοειδής', 'k.hybrid': 'υβριδική',
    mapH: 'Τόπος εύρεσης, προέλευση, διαδρομή', mapHint: 'Ακτογραμμές: Natural Earth (δημόσιος τομέας). Σημερινές ακτές, όχι αρχαίες.', route: 'Πιθανή διαδρομή του πλοίου',
    timeH: 'Χρονολόγιο', jump: 'Ρύθμιση μηχανισμού στο {y}',
    sureH: 'Τι είναι βέβαιο;', papersH: 'Η έρευνα με λίγα λόγια', sourcesH: 'Πηγές', swHint: 'Λογισμικό: three.js (MIT), astronomy-engine (MIT). Ανακατασκευή εμπρόσθιων γραναζιών κατά Freeth et al. 2021 (CC BY 4.0).',
    done: 'Τι έγινε', result: 'Αποτέλεσμα', why: 'Γιατί μετράει', certainty: 'Βεβαιότητα', gears: 'γρανάζια', teeth: 'δόντια',
    loading: 'Λιμάρουμε τα δόντια των γραναζιών …', julian: 'ιουλιανό', gregorian: 'γρηγοριανό', egShort: 'αιγυπτ.', crank: 'Μανιβέλα', crankTurns: 'Μανιβέλα {n} στροφές', crankTitle: 'Γυρίστε τη μανιβέλα: 1 στροφή ≈ 78 ημέρες',
    play: 'Αναπαραγωγή', pause: 'Παύση', stepBack: 'Ένα βήμα πίσω', stepFwd: 'Ένα βήμα μπροστά', close: 'Κλείσιμο', speed: 'Ταχύτητα',
    'sp.1': '1 ημέρα/δ', 'sp.7': '1 εβδομάδα/δ', 'sp.30': '1 μήνας/δ', 'sp.365': '1 έτος/δ', 'sp.saros': '1 Σάρος/δ',
    months: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'],
    zodiac: ['Κριός', 'Ταύρος', 'Δίδυμοι', 'Καρκίνος', 'Λέων', 'Παρθένος', 'Ζυγός', 'Σκορπιός', 'Τοξότης', 'Αιγόκερως', 'Υδροχόος', 'Ιχθύες'],
    'lvl.belegt': 'τεκμηριωμένο', 'lvl.modell': 'μοντέλο', 'lvl.hypothese': 'υπόθεση', 'lvl.historisch': 'ιστορικό',
  },
};

export function t(key, vars) {
  let s = UI[lang]?.[key] ?? UI.de[key] ?? key;
  if (vars && typeof s === 'string') for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

// Übersetzte Datenfelder (Deutsch ist die Basis in /data)
export function td(section, id, field, fallback) {
  if (lang === 'de') return fallback;
  const v = I18N[lang]?.[section]?.[id];
  if (v == null) return fallback;
  return typeof v === 'string' ? (field ? fallback : v) : (v[field] ?? fallback);
}

// ---------------------------------------------------------------- Gerätebeschriftung
export const DEVICE = {
  orig: {
    zodiac: ['ΚΡΙΟΣ', 'ΤΑΥΡΟΣ', 'ΔΙΔΥΜΟΙ', 'ΚΑΡΚΙΝΟΣ', 'ΛΕΩΝ', 'ΠΑΡΘΕΝΟΣ', 'ΧΗΛΑΙ', 'ΣΚΟΡΠΙΟΣ', 'ΤΟΞΟΤΗΣ', 'ΑΙΓΟΚΕΡΩΣ', 'ΥΔΡΟΧΟΟΣ', 'ΙΧΘΥΕΣ'],
    egMonths: ['ΘΩΘ', 'ΦΑΩΦΙ', 'ΑΘΥΡ', 'ΧΟΙΑΚ', 'ΤΥΒΙ', 'ΜΕΧΙΡ', 'ΦΑΜΕΝΩΘ', 'ΦΑΡΜΟΥΘΙ', 'ΠΑΧΩΝ', 'ΠΑΥΝΙ', 'ΕΠΙΦΙ', 'ΜΕΣΟΡΗ', 'ΕΠΑΓ'],
    games: [['ΙΣΘΜΙΑ', 'ΟΛΥΜΠΙΑ'], ['ΝΕΜΕΑ', 'ΝΑΑ'], ['ΙΣΘΜΙΑ', 'ΠΥΘΙΑ'], ['ΝΕΜΕΑ', 'ΑΛΙΕΙΑ']],
    exeligmos: ['', 'Η', 'ΙϚ'], callippic: ['Α', 'Β', 'Γ', 'Δ'], metonicTitle: '', sarosTitle: '',
  },
  de: {
    zodiac: ['WIDDER', 'STIER', 'ZWILLINGE', 'KREBS', 'LÖWE', 'JUNGFRAU', 'WAAGE', 'SKORPION', 'SCHÜTZE', 'STEINBOCK', 'WASSERMANN', 'FISCHE'],
    egMonths: ['THOTH', 'PHAOPHI', 'ATHYR', 'CHOIAK', 'TYBI', 'MECHIR', 'PHAMENOTH', 'PHARMUTHI', 'PACHON', 'PAYNI', 'EPIPHI', 'MESORE', 'ZUSATZ'],
    games: [['ISTHMIEN', 'OLYMPIA'], ['NEMEA', 'NAA'], ['ISTHMIEN', 'PYTHIEN'], ['NEMEA', 'HALIEIA']],
    exeligmos: ['0 h', '+8 h', '+16 h'], callippic: ['1', '2', '3', '4'], metonicTitle: 'METONISCHER KALENDER · 235 MONATE', sarosTitle: 'SAROS · 223 MONATE · FINSTERNISSE',
  },
  en: {
    zodiac: ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'],
    egMonths: ['THOTH', 'PHAOPHI', 'ATHYR', 'CHOIAK', 'TYBI', 'MECHIR', 'PHAMENOTH', 'PHARMUTHI', 'PACHON', 'PAYNI', 'EPIPHI', 'MESORE', 'EXTRA'],
    games: [['ISTHMIA', 'OLYMPIA'], ['NEMEA', 'NAA'], ['ISTHMIA', 'PYTHIA'], ['NEMEA', 'HALIEIA']],
    exeligmos: ['0 h', '+8 h', '+16 h'], callippic: ['1', '2', '3', '4'], metonicTitle: 'METONIC CALENDAR · 235 MONTHS', sarosTitle: 'SAROS · 223 MONTHS · ECLIPSES',
  },
};
export const deviceText = () => DEVICE[deviceLang] ?? DEVICE.orig;

// ---------------------------------------------------------------- Bauteile ohne Zahnrad
export const PARTS = {
  de: {
    crank: ['Handkurbel', 'Antrieb von Hand. Die Kurbel ist verloren; Form epochengerecht ergänzt.'],
    arbor: ['Welle', 'Bronzewelle (Lage schematisch).'],
    CP: ['Kreisplatte (CP)', 'Trägt die Epizykelräder für Sonne, Mars, Jupiter und Saturn (Freeth 2021).'],
    frontplate: ['Frontplatte', 'Bronzeplatte mit Parapegma-Inschriften oberhalb und unterhalb der Anzeige (Texte hier nicht dargestellt).'],
    holes: ['354 Löcher', 'Lochkreis r = 77,1 mm unter dem Kalenderring. 354 Löcher = Mondjahr (Woan & Bayley 2024). Ein Stift hielt den Ring fest; man setzte ihn regelmäßig um.'],
    zodiac: ['Tierkreis-Skala', '12 Zeichen à 30°, griechische Namen. Erhalten in Fragment C.'],
    calendar: ['Ägyptischer Kalenderring', '365 Tage, 12 × 30 + 5 Zusatztage. Dreht sich nicht mit der Kurbel: Ein Stift hält ihn in einem der Löcher darunter. Weil das ägyptische Jahr dem Sonnenjahr um ¼ Tag pro Jahr davonläuft, steckte man ihn von Hand um – hier automatisch, etwa alle 4 Jahre um ein Loch. Den Tag zeigt der Datumszeiger.'],
    'ring-mercury': ['Merkur-Ring', 'Ring mit Türkis-Marker (Freeth 2021).'],
    'ring-venus': ['Venus-Ring', 'Ring mit Lapislazuli-Marker (Freeth 2021).'],
    'ring-sun': ['Sonnen-Ring', 'Goldene Kugel mit Zeiger („kleine goldene Kugel“ laut Inschrift).'],
    'ring-mars': ['Mars-Ring', 'Ring mit Marker. Das Material des Steins ist nicht überliefert (hier spekulativ: Karneol).'],
    'ring-jupiter': ['Jupiter-Ring', 'Ring mit Marker. Das Material des Steins ist nicht überliefert (hier spekulativ: Bergkristall).'],
    'ring-saturn': ['Saturn-Ring', 'Ring mit Marker. Das Material des Steins ist nicht überliefert (hier spekulativ: Obsidian).'],
    'ring-date': ['Datumsring', 'Äußerster Ring mit Zeiger auf den Kalenderring.'],
    'moon-pointer': ['Mondzeiger mit Phasenkugel', 'Kugel (ca. 6 mm) halb hell, halb dunkel. Ein Differential aus Mond- und Sonnenbewegung dreht sie und zeigt so die Mondphase.'],
    dragon: ['Drachenzeiger', 'Zeigt die Mondknoten (Finsternis-Zonen). Laut Freeth 2021 thematisch begründet, aber ohne direkten physischen Beleg.'],
    backplate: ['Rückplatte mit Spiralen', 'Oben die Metonische Spirale (5 Windungen, 235 Monate), unten die Saros-Spirale (4 Windungen, 223 Monate) mit Nebenzifferblättern.'],
    'ptr-metonic': ['Metonischer Zeiger', 'Zeiger mit Läufer, der in der Spiralnut gleitet (Rekonstruktion).'],
    'ptr-saros': ['Saros-Zeiger', 'Zeigt den Monat im 223-Monats-Zyklus; einzelne Zellen tragen Finsternis-Glyphen.'],
    'ptr-games': ['Spiele-Zeiger', 'Vierjahreszyklus der Panhellenischen Spiele. Einziger Zeiger gegen den Uhrzeigersinn.'],
    'ptr-callippic': ['Kallipp-Zeiger', '76-Jahres-Zyklus in 4 Sektoren.'],
    'ptr-exeligmos': ['Exeligmos-Zeiger', '54-Jahres-Zyklus: Zeitkorrektur 0, +8 oder +16 Stunden für Finsternisse.'],
    case: ['Holzkasten', 'Holzreste sind in den Fragmenten belegt, Holzart und Form nicht. Dargestellt: Olivenholz als typisches Holz der Region (spekulativ). Maße ca. 34 × 18 × 9 cm (unsicher).'],
  },
  en: {
    crank: ['Hand crank', 'Driven by hand. The crank is lost; its shape is a period-appropriate addition.'],
    arbor: ['Arbor', 'Bronze arbor (position schematic).'],
    CP: ['Circular plate (CP)', 'Carries the epicyclic gears for Sun, Mars, Jupiter and Saturn (Freeth 2021).'],
    frontplate: ['Front plate', 'Bronze plate with parapegma inscriptions above and below the dial (texts not shown here).'],
    holes: ['354 holes', 'Ring of holes, r = 77.1 mm, under the calendar ring. 354 holes = lunar year (Woan & Bayley 2024). A pin held the ring; it was moved regularly.'],
    zodiac: ['Zodiac scale', '12 signs of 30° each, Greek names. Preserved in fragment C.'],
    calendar: ['Egyptian calendar ring', '365 days, 12 × 30 + 5 extra days. It does not turn with the crank: a pin holds it in one of the holes underneath. Because the Egyptian year drifts ¼ day per year against the solar year, it was re-pinned by hand – here automatically, about one hole every 4 years. The date pointer shows the day.'],
    'ring-mercury': ['Mercury ring', 'Ring with turquoise marker (Freeth 2021).'],
    'ring-venus': ['Venus ring', 'Ring with lapis lazuli marker (Freeth 2021).'],
    'ring-sun': ['Sun ring', 'Golden sphere with pointer ("little golden sphere" according to the inscription).'],
    'ring-mars': ['Mars ring', 'Ring with marker. The stone is not recorded (speculative here: carnelian).'],
    'ring-jupiter': ['Jupiter ring', 'Ring with marker. The stone is not recorded (speculative here: rock crystal).'],
    'ring-saturn': ['Saturn ring', 'Ring with marker. The stone is not recorded (speculative here: obsidian).'],
    'ring-date': ['Date ring', 'Outermost ring with pointer to the calendar ring.'],
    'moon-pointer': ['Moon pointer with phase ball', 'Ball (approx. 6 mm), half light, half dark. A differential of Moon and Sun motion turns it to show the lunar phase.'],
    dragon: ['Dragon hand', 'Shows the lunar nodes (eclipse zones). Thematically justified by Freeth 2021, but without direct physical evidence.'],
    backplate: ['Back plate with spirals', 'Top: Metonic spiral (5 turns, 235 months). Bottom: Saros spiral (4 turns, 223 months) with subsidiary dials.'],
    'ptr-metonic': ['Metonic pointer', 'Pointer with a follower sliding in the spiral groove (reconstruction).'],
    'ptr-saros': ['Saros pointer', 'Shows the month in the 223-month cycle; some cells carry eclipse glyphs.'],
    'ptr-games': ['Games pointer', 'Four-year cycle of the Panhellenic games. The only anticlockwise pointer.'],
    'ptr-callippic': ['Callippic pointer', '76-year cycle in 4 sectors.'],
    'ptr-exeligmos': ['Exeligmos pointer', '54-year cycle: time correction of 0, +8 or +16 hours for eclipses.'],
    case: ['Wooden case', 'Wood remains are attested in the fragments, but not the species or shape. Shown: olive wood, typical of the region (speculative). Size approx. 34 × 18 × 9 cm (uncertain).'],
  },
  el: {
    crank: ['Χειροκίνητη μανιβέλα', 'Κίνηση με το χέρι. Η μανιβέλα έχει χαθεί· το σχήμα της συμπληρώθηκε σύμφωνα με την εποχή.'],
    arbor: ['Άξονας', 'Χάλκινος άξονας (θέση σχηματική).'],
    CP: ['Κυκλική πλάκα (CP)', 'Φέρει τα επικυκλικά γρανάζια για Ήλιο, Άρη, Δία και Κρόνο (Freeth 2021).'],
    frontplate: ['Εμπρόσθια πλάκα', 'Χάλκινη πλάκα με επιγραφές παραπήγματος πάνω και κάτω από την ένδειξη (τα κείμενα δεν εμφανίζονται εδώ).'],
    holes: ['354 οπές', 'Κύκλος οπών, r = 77,1 mm, κάτω από τον δακτύλιο ημερολογίου. 354 οπές = σεληνιακό έτος (Woan & Bayley 2024). Μια περόνη συγκρατούσε τον δακτύλιο, που μετακινούνταν τακτικά.'],
    zodiac: ['Κλίμακα ζωδιακού', '12 ζώδια των 30°, ελληνικά ονόματα. Σώζεται στο θραύσμα C.'],
    calendar: ['Αιγυπτιακός δακτύλιος ημερολογίου', '365 ημέρες, 12 × 30 + 5 επαγόμενες. Δεν περιστρέφεται με τη μανιβέλα: μια περόνη τον συγκρατεί σε μία από τις οπές από κάτω. Επειδή το αιγυπτιακό έτος ολισθαίνει ¼ ημέρας τον χρόνο έναντι του ηλιακού, μετακινούνταν με το χέρι – εδώ αυτόματα, περίπου μία οπή κάθε 4 χρόνια. Την ημέρα τη δείχνει ο δείκτης ημερομηνίας.'],
    'ring-mercury': ['Δακτύλιος Ερμή', 'Δακτύλιος με δείκτη από τιρκουάζ (Freeth 2021).'],
    'ring-venus': ['Δακτύλιος Αφροδίτης', 'Δακτύλιος με δείκτη από λάπις λάζουλι (Freeth 2021).'],
    'ring-sun': ['Δακτύλιος Ήλιου', 'Χρυσή σφαίρα με δείκτη («χρυσό σφαιρίδιο» κατά την επιγραφή).'],
    'ring-mars': ['Δακτύλιος Άρη', 'Δακτύλιος με δείκτη. Η πέτρα δεν μαρτυρείται (εδώ υποθετικά: καρνεόλη).'],
    'ring-jupiter': ['Δακτύλιος Δία', 'Δακτύλιος με δείκτη. Η πέτρα δεν μαρτυρείται (εδώ υποθετικά: ορεία κρύσταλλος).'],
    'ring-saturn': ['Δακτύλιος Κρόνου', 'Δακτύλιος με δείκτη. Η πέτρα δεν μαρτυρείται (εδώ υποθετικά: οψιανός).'],
    'ring-date': ['Δακτύλιος ημερομηνίας', 'Ο εξωτερικός δακτύλιος με δείκτη προς τον δακτύλιο ημερολογίου.'],
    'moon-pointer': ['Δείκτης Σελήνης με σφαίρα φάσεων', 'Σφαίρα (περ. 6 mm), μισή φωτεινή, μισή σκοτεινή. Ένα διαφορικό της κίνησης Σελήνης και Ήλιου την περιστρέφει και δείχνει τη φάση.'],
    dragon: ['Δείκτης δράκοντα', 'Δείχνει τους σεληνιακούς δεσμούς (ζώνες εκλείψεων). Θεματικά τεκμηριωμένος από τον Freeth 2021, χωρίς άμεσο υλικό τεκμήριο.'],
    backplate: ['Οπίσθια πλάκα με σπείρες', 'Πάνω η μετωνική σπείρα (5 στροφές, 235 μήνες), κάτω η σπείρα του Σάρου (4 στροφές, 223 μήνες) με βοηθητικές ενδείξεις.'],
    'ptr-metonic': ['Μετωνικός δείκτης', 'Δείκτης με ολισθητή που κινείται στην αυλάκωση της σπείρας (ανακατασκευή).'],
    'ptr-saros': ['Δείκτης Σάρου', 'Δείχνει τον μήνα στον κύκλο των 223 μηνών· ορισμένα κελιά φέρουν σύμβολα εκλείψεων.'],
    'ptr-games': ['Δείκτης αγώνων', 'Τετραετής κύκλος των πανελλήνιων αγώνων. Ο μόνος δείκτης με αριστερόστροφη κίνηση.'],
    'ptr-callippic': ['Καλλιππικός δείκτης', 'Κύκλος 76 ετών σε 4 τομείς.'],
    'ptr-exeligmos': ['Δείκτης εξελιγμού', 'Κύκλος 54 ετών: διόρθωση χρόνου 0, +8 ή +16 ωρών για τις εκλείψεις.'],
    case: ['Ξύλινο κιβώτιο', 'Υπολείμματα ξύλου σώζονται στα θραύσματα, όχι όμως το είδος ή το σχήμα. Απεικόνιση: ξύλο ελιάς, χαρακτηριστικό της περιοχής (υποθετικό). Διαστάσεις περ. 34 × 18 × 9 cm (αβέβαιες).'],
  },
};
export const partText = (id) => (PARTS[lang] ?? PARTS.de)[id.startsWith('case-') ? 'case' : id] ?? PARTS.de[id.startsWith('case-') ? 'case' : id];

// ---------------------------------------------------------------- Ergänzungen v0.4 (Footer, Links, Karte, Intro)
const EXTRA = {
  de: {
    disclaimer: 'Hobbyprojekt, erstellt mit KI-Unterstützung (Claude, Anthropic). Sorgfältig recherchiert, aber ohne Gewähr: bitte nicht als Quelle für wissenschaftliche Arbeiten verwenden – dafür die verlinkten Originalarbeiten nutzen.',
    imprint: 'Impressum', privacy: 'Datenschutz', replayIntro: 'Intro abspielen', moreH: 'Weiterlesen & Dank',
    mapNav: 'Zoomen mit Mausrad, Doppelklick oder zwei Fingern; Verschieben durch Ziehen.',
    'link.wiki': 'Antikythera mechanism', 'link.wikiSub': 'Wikipedia (Englisch) – ausführlicher Überblick mit Zahnradtabelle',
    'link.dpma': 'Der Mechanismus von Antikythera', 'link.dpmaSub': 'DPMA – Reihe „Meilensteine: Computer-Pioniere“',
    'link.atlas': 'Danke für die Inspiration!', 'link.atlasSub': 'Angeregt durch das Buch „Mehr Geschichten aus der Geschichte“ von Richard Hemmer und Daniel Meßner (Piper, 2026). Zum GAG-Atlas, der Weltkarte zum Podcast „Geschichten aus der Geschichte“ →',
    skip: 'Intro überspringen', reenact: 'Nachgestellte Szene – Darstellung frei, Fakten nach Quellen',
    'intro.1': 'Frühjahr 1900. Ein Sturm treibt zwei Boote mit Schwammtauchern aus Symi in den Schutz der kleinen Insel Antikythera.',
    'intro.2': 'Im schweren Helmtauchanzug steigt Elias Stadiatis auf rund 45 Meter hinab. Zwischen den Felsen glaubt er Leichen und Pferde zu sehen – es sind Statuen eines antiken Wracks.',
    'intro.3': 'Bis 1901 bergen die Taucher gemeinsam mit der griechischen Marine Statuen, Amphoren und Glas. Darunter: ein unscheinbarer, grün korrodierter Klumpen aus Bronze und Holz.',
    'intro.4': 'Mai 1902, Nationalmuseum Athen: Im zerbrochenen Klumpen wird ein Zahnrad entdeckt.',
    'intro.5': 'Über 120 Jahre Forschung später – eine Rekonstruktion nach heutigem Stand.',
  },
  en: {
    disclaimer: 'Hobby project, created with AI assistance (Claude, Anthropic). Carefully researched but without warranty: please do not use it as a source for academic work – use the linked original publications instead.',
    imprint: 'Legal notice', privacy: 'Privacy', replayIntro: 'Play intro', moreH: 'Further reading & thanks',
    mapNav: 'Zoom with the mouse wheel, double-click or two fingers; drag to pan.',
    'link.wiki': 'Antikythera mechanism', 'link.wikiSub': 'Wikipedia (English) – detailed overview with gear table',
    'link.dpma': 'Der Mechanismus von Antikythera', 'link.dpmaSub': 'German Patent and Trade Mark Office (DPMA) – series “Milestones: computer pioneers” (in German)',
    'link.atlas': 'Thanks for the inspiration!', 'link.atlasSub': 'Inspired by the book “Mehr Geschichten aus der Geschichte” by Richard Hemmer and Daniel Meßner (Piper, 2026). To the GAG Atlas, the world map of the podcast “Geschichten aus der Geschichte” →',
    skip: 'Skip intro', reenact: 'Re-enacted scene – free depiction, facts from sources',
    'intro.1': 'Spring 1900. A storm drives two boats of sponge divers from Symi to shelter behind the small island of Antikythera.',
    'intro.2': 'In heavy standard diving dress, Elias Stadiatis descends to about 45 metres. Among the rocks he thinks he sees corpses and horses – they are statues from an ancient wreck.',
    'intro.3': 'By 1901 the divers, together with the Greek navy, recover statues, amphorae and glass. Among them: an inconspicuous, green, corroded lump of bronze and wood.',
    'intro.4': 'May 1902, National Archaeological Museum, Athens: a gear wheel is spotted in the broken lump.',
    'intro.5': 'More than 120 years of research later – a reconstruction based on today’s knowledge.',
  },
  el: {
    disclaimer: 'Ερασιτεχνικό έργο, δημιουργημένο με τη βοήθεια τεχνητής νοημοσύνης (Claude, Anthropic). Προσεκτικά τεκμηριωμένο αλλά χωρίς εγγύηση: παρακαλούμε μην το χρησιμοποιείτε ως πηγή για επιστημονικές εργασίες – χρησιμοποιήστε τις συνδεδεμένες πρωτότυπες δημοσιεύσεις.',
    imprint: 'Στοιχεία εκδότη', privacy: 'Απόρρητο', replayIntro: 'Αναπαραγωγή εισαγωγής', moreH: 'Περισσότερα & ευχαριστίες',
    mapNav: 'Μεγέθυνση με τον τροχό, διπλό κλικ ή δύο δάχτυλα· μετακίνηση με σύρσιμο.',
    'link.wiki': 'Antikythera mechanism', 'link.wikiSub': 'Wikipedia (αγγλικά) – αναλυτική επισκόπηση με πίνακα γραναζιών',
    'link.dpma': 'Der Mechanismus von Antikythera', 'link.dpmaSub': 'Γερμανικό Γραφείο Διπλωμάτων Ευρεσιτεχνίας (DPMA) – σειρά «Ορόσημα: πρωτοπόροι των υπολογιστών» (στα γερμανικά)',
    'link.atlas': 'Ευχαριστούμε για την έμπνευση!', 'link.atlasSub': 'Εμπνευσμένο από το βιβλίο «Mehr Geschichten aus der Geschichte» των Richard Hemmer και Daniel Meßner (Piper, 2026). Προς τον GAG-Atlas, τον παγκόσμιο χάρτη του podcast «Geschichten aus der Geschichte» →',
    skip: 'Παράλειψη εισαγωγής', reenact: 'Αναπαράσταση – ελεύθερη απεικόνιση, γεγονότα από τις πηγές',
    'intro.1': 'Άνοιξη 1900. Μια καταιγίδα οδηγεί δύο σφουγγαράδικα από τη Σύμη να προφυλαχθούν πίσω από το μικρό νησί των Αντικυθήρων.',
    'intro.2': 'Με το βαρύ σκάφανδρο ο Ηλίας Σταδιάτης κατεβαίνει περίπου 45 μέτρα. Ανάμεσα στους βράχους νομίζει ότι βλέπει πτώματα και άλογα – είναι αγάλματα ενός αρχαίου ναυαγίου.',
    'intro.3': 'Ως το 1901 οι δύτες, μαζί με το Πολεμικό Ναυτικό, ανελκύουν αγάλματα, αμφορείς και γυαλικά. Ανάμεσά τους: ένα ασήμαντο, πράσινο, διαβρωμένο συσσωμάτωμα από χαλκό και ξύλο.',
    'intro.4': 'Μάιος 1902, Εθνικό Αρχαιολογικό Μουσείο Αθηνών: στο σπασμένο συσσωμάτωμα εντοπίζεται ένα γρανάζι.',
    'intro.5': 'Πάνω από 120 χρόνια έρευνας αργότερα – μια ανακατασκευή σύμφωνα με τη σημερινή γνώση.',
  },
};
for (const l of Object.keys(EXTRA)) Object.assign(UI[l], EXTRA[l]);
