/**
 * Calculateurs complets des pages outils (RECETTE §17), en grec et en anglais, calculés par
 * `engine/gr.ts`. Un sujet = une entrée ; `ToolCalc.tsx` affiche les champs, le résultat et le détail.
 */
import {
  salary, grossForNet, christmasBonus, easterBonus, leaveAllowance, severance, roadTax, roadCategoryFor, enfia,
  pension, bonusNet, PARAMS as P, type Age, type Floor, type RoadCategory,
} from './engine/gr';
import { formatMoney, pct } from './format';
import { CALCS_FOROI } from './calc-specs-foroi';
import { CALCS_EPIDOMATA } from './calc-specs-epidomata';

export type CalcValues = Record<string, number | string>;
export interface CalcField {
  id: string; label: string; kind: 'number' | 'select' | 'toggle'; def: number | string;
  unit?: string; max?: number; decimals?: number; help?: string; wide?: boolean; plain?: boolean;
  options?: Array<{ value: string; label: string }>; show?: (v: CalcValues) => boolean;
}
export interface CalcRow { label: string; value: string; strong?: boolean }
export interface CalcOut { headLabel: string; head: string; sub?: string; rows: CalcRow[]; bar?: Array<{ label: string; value: number; color: string }>; note?: string }
export interface CalcSpec { fields: CalcField[]; run: (v: CalcValues) => CalcOut; footer: string; methodLabel: string; barLabel?: string }

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
const n = (v: CalcValues, k: string) => Number(v[k]) || 0;
const s = (v: CalcValues, k: string) => String(v[k]);

const ageField = (l: L): CalcField => ({ id: 'age', label: T(l, 'Ηλικία το 2026', 'Age in 2026'), kind: 'select', def: 'over30',
  options: [{ value: 'u25', label: T(l, 'έως 25 ετών (0 % έως 20.000 €)', 'up to 25 (0% up to €20,000)') }, { value: '26_30', label: T(l, '26 έως 30 ετών (9 % έως 20.000 €)', '26 to 30 (9% up to €20,000)') }, { value: 'over30', label: T(l, '31 ετών και άνω', '31 or older') }] });
const kidsField = (l: L): CalcField => ({ id: 'kids', label: T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), kind: 'select', def: '0',
  options: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: k === 6 ? T(l, '6 ή περισσότερα', '6 or more') : String(k) })) });
const paymentsField = (l: L): CalcField => ({ id: 'pay', label: T(l, 'Καταβολές τον χρόνο', 'Payments per year'), kind: 'toggle', def: '14',
  options: [{ value: '14', label: '14' }, { value: '12', label: '12' }] });
const grossField = (l: L, def = 1500): CalcField => ({ id: 'g', label: T(l, 'Μικτός μηνιαίος μισθός', 'Monthly gross salary'), kind: 'number', def, unit: '€', max: 1_000_000, wide: true,
  help: T(l, 'Το ποσό «μικτές αποδοχές» της σύμβασης ή της μισθοδοσίας.', 'The “gross earnings” figure on your contract or payslip.') });
const footer = (l: L) => T(l, `Συντελεστές ${P.year} από τον νόμο, τον e-ΕΦΚΑ και το Υπουργείο Εργασίας · ο υπολογισμός γίνεται στον browser σας, τίποτα δεν αποστέλλεται.`, `${P.year} rates from Greek law, e-EFKA and the Ministry of Labour · calculated in your browser, nothing is sent.`);
const methodLabel = (l: L) => T(l, 'Πώς υπολογίζουμε (μεθοδολογία)', 'How we calculate (methodology)');
const COLORS = { net: '#15803d', efka: '#1e3a8a', tax: '#b91c1c', er: '#a16207' };

const SPECS: Record<string, (l: L) => CalcSpec> = {
  salary: (l) => ({
    fields: [grossField(l), ageField(l), kidsField(l), paymentsField(l)],
    run: (v) => {
      const r = salary({ gross: n(v, 'g'), payments: n(v, 'pay'), children: n(v, 'kids'), age: s(v, 'age') as Age });
      return {
        headLabel: T(l, 'Καθαρός μισθός ανά καταβολή', 'Net pay per payment'), head: $(r.net, l),
        sub: T(l, `${$(r.netAnnual, l)} καθαρά τον χρόνο · ${$(r.netPer12, l)} τον μήνα σε 12μηνη βάση`, `${$(r.netAnnual, l)} net a year · ${$(r.netPer12, l)} a month on a 12-month basis`),
        bar: [{ label: T(l, 'Καθαρά', 'Net'), value: r.net, color: COLORS.net }, { label: 'ΕΦΚΑ', value: r.efka, color: COLORS.efka }, { label: T(l, 'Φόρος', 'Tax'), value: r.tax, color: COLORS.tax }],
        rows: [
          { label: T(l, `Εισφορές ΕΦΚΑ (${pct(P.efka.employee_rate, l)})`, `EFKA contributions (${pct(P.efka.employee_rate, l)})`), value: `−${$(r.efka, l)}` },
          { label: T(l, 'Παρακράτηση φόρου (ΦΜΥ)', 'Income tax withheld'), value: `−${$(r.tax, l)}` },
          { label: T(l, 'Φόρος κλίμακας τον χρόνο', 'Scale tax per year'), value: $(r.scaleAnnual, l) },
          { label: T(l, 'Μείωση φόρου άρθρου 16', 'Article 16 tax reduction'), value: `−${$(r.creditAnnual, l)}` },
          { label: T(l, 'Οριακός συντελεστής', 'Marginal tax rate'), value: pct(r.marginal, l) },
          { label: T(l, 'Κόστος εργοδότη ανά καταβολή', 'Employer cost per payment'), value: $(r.cost, l), strong: true },
        ],
        note: r.capped ? T(l, `Οι εισφορές υπολογίζονται έως το πλαφόν των ${$2(P.efka.ceiling_monthly, l)} τον μήνα.`, `Contributions stop at the monthly ceiling of ${$2(P.efka.ceiling_monthly, l)}.`)
          : T(l, 'Ιδιωτικός τομέας, ΚΠΚ 101 (κύρια, επικουρική, υγεία, ΔΥΠΑ). Ο φόρος μοιράζεται ισόποσα στις καταβολές του έτους.', 'Private sector, package code 101 (main and auxiliary pension, health, DYPA). Tax is spread evenly over the year’s payments.'),
      };
    }, footer: footer(l), methodLabel: methodLabel(l), barLabel: T(l, 'Κατανομή του μικτού', 'Split of the gross'),
  }),
  nettogross: (l) => ({
    fields: [{ id: 'n', label: T(l, 'Επιθυμητός καθαρός μηνιαίος μισθός', 'Target monthly net pay'), kind: 'number', def: 1200, unit: '€', max: 500_000, wide: true }, ageField(l), kidsField(l), paymentsField(l)],
    run: (v) => {
      const opts = { payments: n(v, 'pay'), children: n(v, 'kids'), age: s(v, 'age') as Age };
      const g = grossForNet(n(v, 'n'), opts); const r = salary({ gross: g, ...opts });
      return {
        headLabel: T(l, 'Απαιτούμενος μικτός μισθός', 'Gross salary needed'), head: $(g, l),
        bar: [{ label: T(l, 'Καθαρά', 'Net'), value: r.net, color: COLORS.net }, { label: 'ΕΦΚΑ', value: r.efka, color: COLORS.efka }, { label: T(l, 'Φόρος', 'Tax'), value: r.tax, color: COLORS.tax }],
        rows: [{ label: T(l, 'Εισφορές ΕΦΚΑ', 'EFKA contributions'), value: `−${$(r.efka, l)}` }, { label: T(l, 'Φόρος ανά καταβολή', 'Tax per payment'), value: `−${$(r.tax, l)}` }, { label: T(l, 'Καθαρά', 'Net'), value: $(r.net, l), strong: true }, { label: T(l, 'Μικτά τον χρόνο', 'Gross per year'), value: $(r.annualGross, l) }, { label: T(l, 'Κόστος εργοδότη ανά καταβολή', 'Employer cost per payment'), value: $(r.cost, l) }],
      };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
  employer: (l) => ({
    fields: [grossField(l, 1500), paymentsField(l)],
    run: (v) => {
      const r = salary({ gross: n(v, 'g'), payments: n(v, 'pay') });
      return {
        headLabel: T(l, 'Συνολικό κόστος εργοδότη τον χρόνο', 'Total employer cost per year'), head: $(r.costAnnual, l),
        sub: T(l, `${$(r.cost, l)} ανά καταβολή`, `${$(r.cost, l)} per payment`),
        bar: [{ label: T(l, 'Καθαρά εργαζομένου', 'Employee net'), value: r.net, color: COLORS.net }, { label: T(l, 'ΕΦΚΑ εργαζομένου', 'Employee EFKA'), value: r.efka, color: COLORS.efka }, { label: T(l, 'Φόρος', 'Tax'), value: r.tax, color: COLORS.tax }, { label: T(l, 'ΕΦΚΑ εργοδότη', 'Employer EFKA'), value: r.employer, color: COLORS.er }],
        rows: [{ label: T(l, 'Μικτός μισθός', 'Gross salary'), value: $(r.gross, l) }, { label: T(l, `Εργοδοτικές εισφορές (${pct(P.efka.employer_rate, l)})`, `Employer contributions (${pct(P.efka.employer_rate, l)})`), value: `+${$(r.employer, l)}` }, { label: T(l, 'Κόστος ανά καταβολή', 'Cost per payment'), value: $(r.cost, l), strong: true }, { label: T(l, 'Καθαρά εργαζομένου', 'Employee net pay'), value: $(r.net, l) }, { label: T(l, 'Καθαρά ως ποσοστό του κόστους', 'Net as a share of cost'), value: pct(r.cost > 0 ? r.net / r.cost : 0, l) }],
      };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
  road: (l) => ({
    fields: [
      { id: 'y', label: T(l, 'Έτος πρώτης ταξινόμησης (ΕΕ)', 'Year first registered (EU)'), kind: 'number', def: 2018, max: 2026, plain: true, help: T(l, 'Πεδίο B της άδειας κυκλοφορίας.', 'Field B of the registration certificate.') },
      { id: 'm', label: T(l, 'Μήνας', 'Month'), kind: 'number', def: 6, max: 12, help: T(l, 'Μετράει μόνο για το 2010 (από τον 11ο).', 'Only matters for 2010 (from month 11).') },
      { id: 'co2', label: T(l, 'Εκπομπές CO₂ (άδεια, πεδίο V.7)', 'CO₂ emissions (licence, field V.7)'), kind: 'number', def: 125, unit: 'g/km', max: 999, help: T(l, 'Χρησιμοποιείται για ταξινόμηση από 1.11.2010.', 'Used for cars registered from 1.11.2010.') },
      { id: 'cc', label: T(l, 'Κυβισμός', 'Engine size'), kind: 'number', def: 1400, unit: 'cc', max: 20000, help: T(l, 'Χρησιμοποιείται για ταξινόμηση έως 31.10.2010.', 'Used for cars registered up to 31.10.2010.') },
      { id: 'f', label: T(l, 'Κινητήρας', 'Powertrain'), kind: 'toggle', def: 'ice', options: [{ value: 'ice', label: T(l, 'Θερμικός', 'Combustion') }, { value: 'ev', label: T(l, 'Ηλεκτρικό', 'Electric') }] },
    ],
    run: (v) => {
      const cat = roadCategoryFor(n(v, 'y'), n(v, 'm') || 12, s(v, 'f') === 'ev') as RoadCategory;
      const r = roadTax({ category: cat, cc: n(v, 'cc'), co2: n(v, 'co2') });
      const catLabel: Record<RoadCategory, string> = {
        cc_until_2000: T(l, 'κυβισμός, ταξινόμηση έως το 2000', 'engine size, registered up to 2000'), cc_2001_2005: T(l, 'κυβισμός, ταξινόμηση 2001-2005', 'engine size, registered 2001-2005'),
        cc_from_2006: T(l, 'κυβισμός, ταξινόμηση 2006 έως 31.10.2010', 'engine size, registered 2006 to 31.10.2010'), co2_nedc: T(l, 'CO₂ NEDC, ταξινόμηση 1.11.2010-31.12.2020', 'NEDC CO₂, registered 1.11.2010-31.12.2020'),
        co2_wltp: T(l, 'CO₂ WLTP, ταξινόμηση από 1.1.2021', 'WLTP CO₂, registered from 1.1.2021'), electric: T(l, 'ηλεκτρικό: απαλλαγή', 'electric: exempt'),
      };
      return {
        headLabel: T(l, `Τέλη κυκλοφορίας ${P.year}`, `Road tax ${P.year}`), head: $2(r.amount, l),
        rows: [{ label: T(l, 'Πίνακας που εφαρμόζεται', 'Table applied'), value: catLabel[cat] }, ...(r.method === 'co2' ? [{ label: T(l, 'Κλιμάκιο CO₂', 'CO₂ band'), value: `${r.bandLabel} g/km` }, { label: T(l, 'Ευρώ ανά γραμμάριο', 'Euros per gram'), value: $2(r.rate, l) }] : r.method === 'cc' ? [{ label: T(l, 'Κλιμάκιο κυβισμού', 'Engine band'), value: `${r.bandLabel} cc` }] : []), { label: T(l, 'Ανά μήνα (για προϋπολογισμό)', 'Per month (for budgeting)'), value: $2(r.amount / 12, l) }],
        note: r.method === 'co2' ? T(l, 'Όλα τα γραμμάρια πολλαπλασιάζονται με τον συντελεστή του κλιμακίου όπου ανήκει το όχημα.', 'All grams are multiplied by the rate of the band the car falls in.') : undefined,
      };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
  enfia: (l) => ({
    fields: [
      { id: 'sqm', label: T(l, 'Εμβαδόν κύριων χώρων', 'Main floor area'), kind: 'number', def: 85, unit: 'm²', max: 100000 },
      { id: 'zone', label: T(l, 'Τιμή ζώνης', 'Zone price'), kind: 'number', def: 1600, unit: '€/m²', max: 50000 },
      { id: 'year', label: T(l, 'Έτος οικοδομικής άδειας', 'Building permit year'), kind: 'number', def: 1995, max: 2026, plain: true },
      { id: 'floor', label: T(l, 'Όροφος', 'Floor'), kind: 'select', def: 'f2_3', options: [{ value: 'basement', label: T(l, 'Υπόγειο', 'Basement') }, { value: 'ground_1', label: T(l, 'Ισόγειο ή 1ος', 'Ground or 1st') }, { value: 'f2_3', label: T(l, '2ος ή 3ος', '2nd or 3rd') }, { value: 'f4_5', label: T(l, '4ος ή 5ος', '4th or 5th') }, { value: 'f6_up', label: T(l, '6ος και πάνω', '6th or higher') }, { value: 'detached', label: T(l, 'Μονοκατοικία', 'Detached house') }] },
      { id: 'fac', label: T(l, 'Προσόψεις', 'Street frontages'), kind: 'select', def: '1', options: [{ value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: T(l, '2 ή περισσότερες', '2 or more') }] },
      { id: 'share', label: T(l, 'Ποσοστό ιδιοκτησίας', 'Ownership share'), kind: 'number', def: 100, unit: '%', max: 100 },
      { id: 'aux', label: T(l, 'Βοηθητικοί χώροι (αποθήκη, θέση)', 'Auxiliary space (storage, parking)'), kind: 'number', def: 0, unit: 'm²', max: 100000 },
      { id: 'val', label: T(l, 'Συνολική αξία ακινήτων (αν τη γνωρίζετε)', 'Total property value (if known)'), kind: 'number', def: 0, unit: '€', max: 100_000_000, help: T(l, 'Κενό: εκτίμηση εμβαδόν × τιμή ζώνης.', 'Blank: estimated as area × zone price.') },
      { id: 'ins', label: T(l, 'Ασφαλισμένη κατοικία;', 'Home insured?'), kind: 'toggle', def: '0', options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] },
      { id: 'vil', label: T(l, 'Κύρια κατοικία σε οικισμό έως 1.500 κατ.;', 'Main home in a village up to 1,500?'), kind: 'toggle', def: '0', options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] },
    ],
    run: (v) => {
      const fl = s(v, 'floor');
      const r = enfia({ sqm: n(v, 'sqm'), zonePrice: n(v, 'zone'), buildYear: n(v, 'year') || P.year, floor: (fl === 'detached' ? 'ground_1' : fl) as Floor, detached: fl === 'detached', facades: n(v, 'fac'), share: n(v, 'share') / 100, auxSqm: n(v, 'aux'), totalValue: n(v, 'val'), insured: s(v, 'ins') === '1', smallSettlement: s(v, 'vil') === '1' });
      const rows: CalcRow[] = [
        { label: T(l, 'Βασικός φόρος ζώνης', 'Zone basic tax'), value: `${$2(r.basicRate, l)}/m²` },
        { label: T(l, `Συντελεστής παλαιότητας (${r.ageYears} έτη)`, `Age factor (${r.ageYears} years)`), value: String(r.ageFactor).replace('.', l === 'en' ? '.' : ',') },
        { label: T(l, 'Κύριος φόρος κτίσματος', 'Main building tax'), value: $2(r.mainBuilding + r.auxiliary, l) },
      ];
      if (r.rightTax > 0) rows.push({ label: T(l, 'Φόρος επί της αξίας (άνω των 300.000 €)', 'Value tax (above €300,000)'), value: $2(r.rightTax, l) });
      if (r.surchargeRate > 0) rows.push({ label: T(l, 'Προσαύξηση λόγω αξίας', 'Surcharge for value'), value: `+${pct(r.surchargeRate, l)}` });
      if (r.valueReductionRate > 0) rows.push({ label: T(l, 'Μείωση λόγω συνολικής αξίας', 'Reduction for total value'), value: `−${pct(r.valueReductionRate, l)}` });
      if (r.insuranceRate > 0) rows.push({ label: T(l, 'Ασφάλιση κατοικίας', 'Home insurance'), value: `−${pct(r.insuranceRate, l)}` });
      if (r.smallSettlementRate > 0) rows.push({ label: T(l, 'Μικρός οικισμός (2026)', 'Small settlement (2026)'), value: `−${pct(r.smallSettlementRate, l)}` });
      rows.push({ label: T(l, 'Αξία που λήφθηκε υπόψη', 'Value used'), value: $(r.valueUsed, l) });
      return { headLabel: T(l, `ΕΝΦΙΑ ${P.year} για το ακίνητο`, `ENFIA ${P.year} for this property`), head: $2(r.total, l), rows,
        note: T(l, 'Εκτίμηση για ένα κτίσμα: ο ΕΝΦΙΑ του εκκαθαριστικού αθροίζει όλα τα ακίνητα του Ε9, μαζί με τα οικόπεδα.', 'Estimate for one building: the AADE assessment adds up every property on your E9, including plots.') };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
  severance: (l) => ({
    fields: [
      { id: 'p', label: T(l, 'Τακτικές μηνιαίες αποδοχές', 'Regular monthly pay'), kind: 'number', def: 1400, unit: '€', max: 1_000_000, wide: true, help: T(l, 'Ημερομίσθιο: επιλέξτε «ημερομίσθιο» και δώστε το ποσό της ημέρας.', 'Daily-paid: choose “daily wage” and enter the daily amount.') },
      { id: 'd', label: T(l, 'Τρόπος αμοιβής', 'Pay basis'), kind: 'toggle', def: 'm', options: [{ value: 'm', label: T(l, 'Μισθός', 'Monthly') }, { value: 'd', label: T(l, 'Ημερομίσθιο', 'Daily wage') }] },
      { id: 'y', label: T(l, 'Συμπληρωμένα έτη στον εργοδότη', 'Full years with the employer'), kind: 'number', def: 7, max: 60 },
      { id: 'n', label: T(l, 'Έγγραφη προειδοποίηση;', 'Written notice given?'), kind: 'toggle', def: '0', options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] },
      { id: 'y12', label: T(l, 'Έτη στον ίδιο εργοδότη στις 12.11.2012', 'Years with the same employer on 12.11.2012'), kind: 'number', def: 0, max: 60, help: T(l, 'Μόνο αν είχατε 17 έτη και άνω τότε.', 'Only matters if you had 17 or more then.') },
    ],
    run: (v) => {
      const r = severance({ pay: n(v, 'p'), daily: s(v, 'd') === 'd', years: n(v, 'y'), notice: s(v, 'n') === '1', yearsAt2012: n(v, 'y12') });
      const rows: CalcRow[] = [
        { label: T(l, 'Μισθοί αποζημίωσης (πίνακας)', 'Months of pay (table)'), value: String(r.months) },
        ...(r.extraMonths ? [{ label: T(l, 'Επιπλέον μισθοί (17+ έτη το 2012)', 'Extra months (17+ years in 2012)'), value: String(r.extraMonths) }] : []),
        { label: T(l, 'Μηνιαίος μισθός υπολογισμού', 'Monthly pay used'), value: $(r.monthlyCapped, l) },
        { label: T(l, 'Βασική αποζημίωση', 'Base severance'), value: $(r.base + r.extra, l) },
        { label: T(l, 'Προσαύξηση 1/6 (δώρα και επίδομα αδείας)', '1/6 uplift (bonuses and leave allowance)'), value: `+${$(r.uplift, l)}` },
        { label: T(l, 'Προειδοποίηση που απαιτείται', 'Notice required'), value: T(l, `${r.noticeMonths} μήνες`, `${r.noticeMonths} months`) },
      ];
      return { headLabel: r.withNotice ? T(l, 'Αποζημίωση με προειδοποίηση (το μισό)', 'Severance with notice (half)') : T(l, 'Αποζημίωση απόλυσης χωρίς προειδοποίηση', 'Severance without notice'), head: $(r.total, l), rows,
        note: !r.eligible ? T(l, 'Κάτω από 12 μήνες εργασίας δεν οφείλεται αποζημίωση (δοκιμαστική περίοδος).', 'Under 12 months of service no severance is owed (probation period).') : r.capped ? T(l, `Ο μισθός περιορίστηκε στο ανώτατο όριο του άρθρου 5 ν. 3198/1955 (${$2(r.cap, l)}).`, `Pay was capped at the Law 3198/1955 article 5 limit (${$2(r.cap, l)}).`) : T(l, 'Μικτό ποσό με τις τακτικές αποδοχές του τελευταίου μήνα πλήρους απασχόλησης.', 'Gross amount, based on the last month of full-time regular pay.') };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
  christmas: (l) => holidaySpec(l, 'christmas'),
  easter: (l) => holidaySpec(l, 'easter'),
  leave: (l) => ({
    fields: [{ id: 'p', label: T(l, 'Μηνιαίος μισθός ή ημερομίσθιο', 'Monthly salary or daily wage'), kind: 'number', def: 1300, unit: '€', max: 1_000_000, wide: true },
      { id: 'd', label: T(l, 'Τρόπος αμοιβής', 'Pay basis'), kind: 'toggle', def: 'm', options: [{ value: 'm', label: T(l, 'Μισθός', 'Monthly') }, { value: 'd', label: T(l, 'Ημερομίσθιο', 'Daily wage') }] },
      { id: 'mo', label: T(l, 'Μήνες εργασίας στο έτος', 'Months worked this year'), kind: 'number', def: 12, max: 12 }, ageField(l), kidsField(l)],
    run: (v) => {
      const a = leaveAllowance({ pay: n(v, 'p'), daily: s(v, 'd') === 'd', months: n(v, 'mo') });
      const monthly = s(v, 'd') === 'd' ? n(v, 'p') * P.severance.daily_wages_per_month : n(v, 'p');
      const net = bonusNet(a.amount, { gross: monthly, children: n(v, 'kids'), age: s(v, 'age') as Age });
      return { headLabel: T(l, 'Επίδομα αδείας μικτό', 'Gross leave allowance'), head: $(a.amount, l),
        rows: [{ label: T(l, 'Ανώτατο: μισός μισθός ή 13 ημερομίσθια', 'Maximum: half a month or 13 daily wages'), value: $(a.cap, l) }, { label: T(l, 'Εισφορές ΕΦΚΑ', 'EFKA contributions'), value: `−${$(net.efka, l)}` }, { label: T(l, 'Φόρος (μέσος συντελεστής έτους)', 'Tax (average rate of the year)'), value: `−${$(net.tax, l)}` }, { label: T(l, 'Καθαρό επίδομα', 'Net allowance'), value: $(net.net, l), strong: true }] };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
  pension: (l) => ({
    fields: [{ id: 'y', label: T(l, 'Έτη ασφάλισης', 'Years of insurance'), kind: 'number', def: 35, max: 60 }, { id: 'a', label: T(l, 'Μέσος μηνιαίος μισθός του ασφαλιστικού βίου', 'Average monthly pay over your career'), kind: 'number', def: 1300, unit: '€', max: 100000, wide: true }, { id: 'r', label: T(l, 'Έτη διαμονής στην Ελλάδα (15-67)', 'Years living in Greece (15-67)'), kind: 'number', def: 40, max: 52 }],
    run: (v) => {
      const p = pension({ years: n(v, 'y'), avgEarnings: n(v, 'a'), residenceYears: n(v, 'r') });
      return { headLabel: T(l, 'Εκτιμώμενη μικτή σύνταξη', 'Estimated gross pension'), head: $(p.total, l),
        rows: [{ label: T(l, 'Ανταποδοτική σύνταξη', 'Contributory pension'), value: $(p.contributory, l) }, { label: T(l, 'Ποσοστό αναπλήρωσης', 'Accrual rate'), value: pct(p.rate, l) }, { label: T(l, 'Εθνική σύνταξη', 'National pension'), value: $(p.national, l) }, { label: T(l, 'Πλήρης εθνική σύνταξη (1.1.2025)', 'Full national pension (1.1.2025)'), value: $2(P.pension.national_full, l) }],
        note: p.eligible ? T(l, 'Μικτό ποσό, πριν από την εισφορά υγείας και τον φόρο. Οι συντάξιμες αποδοχές αναπροσαρμόζονται με τον πληθωρισμό.', 'Gross amount before health contribution and tax. Pensionable earnings are indexed to inflation.') : T(l, `Χρειάζονται τουλάχιστον ${P.pension.min_years} έτη ασφάλισης.`, `At least ${P.pension.min_years} years of insurance are needed.`) };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
};

function holidaySpec(l: L, which: 'christmas' | 'easter'): CalcSpec {
  const xmas = which === 'christmas';
  const period = xmas ? P.bonuses.christmas_period_days : P.bonuses.easter_period_days;
  return {
    fields: [
      { id: 'p', label: T(l, 'Μηνιαίος μισθός ή ημερομίσθιο', 'Monthly salary or daily wage'), kind: 'number', def: 1300, unit: '€', max: 1_000_000, wide: true },
      { id: 'd', label: T(l, 'Τρόπος αμοιβής', 'Pay basis'), kind: 'toggle', def: 'm', options: [{ value: 'm', label: T(l, 'Μισθός', 'Monthly') }, { value: 'd', label: T(l, 'Ημερομίσθιο', 'Daily wage') }] },
      { id: 'days', label: xmas ? T(l, 'Ημέρες εργασίας 1/5 έως 31/12', 'Days employed 1 May to 31 Dec') : T(l, 'Ημέρες εργασίας 1/1 έως 30/4', 'Days employed 1 Jan to 30 Apr'), kind: 'number', def: period, max: period, help: T(l, `Ολόκληρη η περίοδος: ${period} ημέρες.`, `Whole period: ${period} days.`) },
      ageField(l), kidsField(l),
    ],
    run: (v) => {
      const daily = s(v, 'd') === 'd';
      const b = (xmas ? christmasBonus : easterBonus)({ pay: n(v, 'p'), daily, days: n(v, 'days') });
      const monthly = daily ? n(v, 'p') * P.severance.daily_wages_per_month : n(v, 'p');
      const net = bonusNet(b.amount, { gross: monthly, children: n(v, 'kids'), age: s(v, 'age') as Age });
      return {
        headLabel: xmas ? T(l, `Δώρο Χριστουγέννων ${P.year} μικτό`, `Christmas bonus ${P.year}, gross`) : T(l, `Δώρο Πάσχα ${P.year} μικτό`, `Easter bonus ${P.year}, gross`), head: $(b.amount, l),
        sub: T(l, `${$(net.net, l)} καθαρά`, `${$(net.net, l)} net`),
        rows: [
          { label: b.full ? T(l, 'Ολόκληρο δώρο', 'Full bonus') : T(l, `Αναλογία (${b.days} ημέρες)`, `Pro rata (${b.days} days)`), value: $(b.base, l) },
          { label: T(l, 'Αναλογία επιδόματος αδείας (1/24)', 'Leave allowance share (1/24)'), value: `+${$(b.leaveShare, l)}` },
          { label: T(l, 'Εισφορές ΕΦΚΑ', 'EFKA contributions'), value: `−${$(net.efka, l)}` },
          { label: T(l, 'Φόρος (μέσος συντελεστής έτους)', 'Tax (average rate of the year)'), value: `−${$(net.tax, l)}` },
          { label: T(l, 'Καθαρό δώρο', 'Net bonus'), value: $(net.net, l), strong: true },
        ],
        note: xmas ? T(l, 'Καταβάλλεται έως τις 21 Δεκεμβρίου, με βάση τις αποδοχές της 10ης Δεκεμβρίου.', 'Paid by 21 December, based on pay on 10 December.') : T(l, 'Καταβάλλεται έως τη Μεγάλη Τετάρτη, με βάση τις αποδοχές της 15ης ημέρας πριν από το Πάσχα.', 'Paid by Holy Wednesday, based on pay 15 days before Easter.'),
      };
    }, footer: footer(l), methodLabel: methodLabel(l),
  };
}

const ALL_CALCS: Record<string, (l: L) => CalcSpec> = { ...SPECS, ...CALCS_FOROI, ...CALCS_EPIDOMATA };
export function getCalc(kind: string, lang = 'el'): CalcSpec {
  const f = ALL_CALCS[kind]; if (!f) throw new Error(`calc-spec inconnu : ${kind}`); return f(lang);
}
export const CALC_KINDS = Object.keys(ALL_CALCS);
