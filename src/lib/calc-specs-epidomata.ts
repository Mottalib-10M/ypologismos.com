/**
 * Calculateurs complets des pages d'aides (RECETTE §17). Moteur : `engine/epidomata.ts`, paramètres
 * relus sur les sources officielles (OPEKA, ΔΥΠΑ, e-ΕΦΚΑ, ministère de l'Éducation, ΦΕΚ).
 */
import { PARAMS as P } from './engine/gr';
import { childBenefit, childBenefitLimits, housingBenefit, unemploymentBenefit, rentRefund, maternitySpecial, studentHousing, widowPension, type RentHousehold, type MotherStatus } from './engine/epidomata';
import { formatMoney, pct } from './format';
import type { CalcSpec, CalcValues, CalcField } from './calc-specs';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
const n = (v: CalcValues, k: string) => Number(v[k]) || 0;
const s = (v: CalcValues, k: string) => String(v[k]);
const methodLabel = (l: L) => T(l, 'Πώς υπολογίζουμε (μεθοδολογία)', 'How we calculate (methodology)');
const footer = (l: L, who: string, whoEn: string) => T(l, `Ποσά και όρια από ${who}, όπως ισχύουν το ${P.year} · ο υπολογισμός γίνεται στον browser σας, τίποτα δεν αποστέλλεται.`, `Amounts and limits from ${whoEn}, as in force in ${P.year} · calculated in your browser, nothing is sent.`);
const yesNo = (l: L, id: string, label: string, def = '0', show?: (v: CalcValues) => boolean): CalcField => ({ id, label, kind: 'toggle', def, options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }], show });
const count = (l: L, id: string, label: string, def: string, max = 6, from = 0): CalcField => ({ id, label, kind: 'select', def, options: Array.from({ length: max - from + 1 }, (_, i) => ({ value: String(i + from), label: String(i + from) })) });
const CAT = ['Α', 'Β', 'Γ'];
const C = { a: '#15803d', b: '#1e3a8a', c: '#a16207' };

export const CALCS_EPIDOMATA: Record<string, (l: L) => CalcSpec> = {
  childbenefit: (l) => ({
    fields: [
      { id: 'i', label: T(l, 'Οικογενειακό εισόδημα τον χρόνο', 'Family income per year'), kind: 'number', def: 18000, unit: '€', max: 10_000_000, wide: true, help: T(l, 'Φορολογητέο εισόδημα όλης της οικογένειας από το εκκαθαριστικό.', 'Taxable income of the whole family, from the tax assessment.') },
      { id: 'p', label: T(l, 'Γονείς στην οικογένεια', 'Parents in the family'), kind: 'toggle', def: '2', options: [{ value: '2', label: T(l, 'Δύο', 'Two') }, { value: '1', label: T(l, 'Μονογονεϊκή', 'Single parent') }] },
      count(l, 'k', T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), '2', 8, 1),
    ],
    run: (v) => {
      const r = childBenefit({ income: n(v, 'i'), parents: n(v, 'p'), children: n(v, 'k') });
      const lims = childBenefitLimits(n(v, 'p'), n(v, 'k'));
      return {
        headLabel: T(l, 'Επίδομα παιδιού τον μήνα', 'Child benefit per month'), head: $(r.monthly, l),
        sub: r.category >= 0 ? T(l, `Κατηγορία ${CAT[r.category]} · ${$(r.installment, l)} κάθε δίμηνο · ${$(r.annual, l)} τον χρόνο`, `Band ${CAT[r.category]} · ${$(r.installment, l)} every two months · ${$(r.annual, l)} a year`) : T(l, 'Το ισοδύναμο εισόδημα ξεπερνά το όριο της κατηγορίας Γ.', 'The equivalent income is above the band Γ limit.'),
        bar: r.perChild.length ? r.perChild.map((x, i) => ({ label: T(l, `${i + 1}ο παιδί`, `Child ${i + 1}`), value: x, color: i < 2 ? C.b : C.a })) : undefined,
        rows: [
          { label: T(l, 'Κλίμακα ισοδυναμίας', 'Equivalence scale'), value: String(r.scale).replace('.', T(l, ',', '.')) },
          { label: T(l, 'Ισοδύναμο εισόδημα', 'Equivalent income'), value: $(r.equivalent, l) },
          ...r.perChild.map((x, i) => ({ label: T(l, `${i + 1}ο παιδί`, `Child ${i + 1}`), value: $(x, l) })),
          { label: T(l, 'Εισόδημα έως το οποίο κρατάτε την Α / Β / Γ', 'Income up to which you stay in Α / Β / Γ'), value: lims.map((x) => $(x, l)).join(' / '), strong: true },
        ],
        note: T(l, 'Τα παιδιά μετρούν έως 18 ετών (19 στη δευτεροβάθμια, 24 σε σπουδές). Απαιτείται πενταετής νόμιμη διαμονή, δωδεκαετής για πολίτες τρίτων χωρών.', 'Children count up to 18 (19 in secondary school, 24 if studying). Five years of legal residence are required, twelve for most non-EU nationals.'),
      };
    }, footer: footer(l, 'το άρθρο 214 του ν. 4512/2018 και την ΟΠΕΚΑ', 'article 214 of Law 4512/2018 and OPEKA'), methodLabel: methodLabel(l), barLabel: T(l, 'Ποσό ανά παιδί', 'Amount per child'),
  }),

  housing: (l) => ({
    fields: [
      count(l, 'm', T(l, 'Μέλη του νοικοκυριού', 'Household members'), '3', 8, 1),
      yesNo(l, 'sp', T(l, 'Μονογονεϊκή οικογένεια;', 'Single-parent family?')),
      { id: 'r', label: T(l, 'Μηνιαίο ενοίκιο', 'Monthly rent'), kind: 'number', def: 400, unit: '€', max: 100000 },
      { id: 'i', label: T(l, 'Συνολικό εισόδημα νοικοκυριού', 'Total household income'), kind: 'number', def: 11000, unit: '€', max: 10_000_000, help: T(l, 'Όλα τα μέλη, πριν από τον φόρο, μαζί με τα επιδόματα εκτός του επιδόματος παιδιού.', 'All members, before tax, including benefits other than child benefit.') },
      { id: 'pr', label: T(l, 'Αξία ακινήτων (ΕΝΦΙΑ)', 'Property value (ENFIA)'), kind: 'number', def: 0, unit: '€', max: 100_000_000 },
      { id: 'd', label: T(l, 'Καταθέσεις και μετοχές', 'Savings and shares'), kind: 'number', def: 3000, unit: '€', max: 100_000_000 },
    ],
    run: (v) => {
      const h = housingBenefit({ members: n(v, 'm'), singleParent: s(v, 'sp') === '1', rent: n(v, 'r'), income: n(v, 'i'), property: n(v, 'pr'), deposits: n(v, 'd') });
      const ok = (b: boolean) => (b ? T(l, 'εντός', 'within') : T(l, 'εκτός', 'over'));
      return {
        headLabel: T(l, 'Επίδομα στέγασης τον μήνα', 'Housing benefit per month'), head: $(h.amount, l),
        sub: h.eligible ? T(l, `${$(h.annual, l)} τον χρόνο${h.cappedByRent ? ', περιορισμένο στο ενοίκιο' : ''}`, `${$(h.annual, l)} a year${h.cappedByRent ? ', limited to the rent' : ''}`) : T(l, 'Ένα από τα κριτήρια δεν πληρείται.', 'One of the tests is not met.'),
        rows: [
          { label: T(l, 'Ποσό για αυτό το νοικοκυριό', 'Amount for this household'), value: $(h.gross, l) },
          { label: T(l, `Όριο εισοδήματος ${$(h.incomeLimit, l)}`, `Income limit ${$(h.incomeLimit, l)}`), value: ok(h.incomeOk) },
          { label: T(l, `Όριο ακινήτων ${$(h.propertyLimit, l)}`, `Property limit ${$(h.propertyLimit, l)}`), value: ok(h.propertyOk) },
          { label: T(l, `Όριο καταθέσεων ${$(h.depositsLimit, l)}`, `Savings limit ${$(h.depositsLimit, l)}`), value: ok(h.depositsOk) },
          { label: T(l, 'Μέγιστο για κάθε νοικοκυριό', 'Maximum for any household'), value: $(P.housing_benefit.max, l), strong: true },
        ],
        note: T(l, 'Ηλεκτρονικό μισθωτήριο κύριας κατοικίας, πενταετής νόμιμη διαμονή. Δεν δίνεται για μίσθωση από γονέα ή σύζυγο ούτε σε φοιτητές κάτω των 25 που μένουν μόνοι.', 'Electronic lease on the main home, five years of legal residence. Not paid for a lease from a parent or spouse, nor to students under 25 living alone.'),
      };
    }, footer: footer(l, 'την ΚΥΑ του επιδόματος στέγασης και την ΟΠΕΚΑ', 'the housing benefit decision and OPEKA'), methodLabel: methodLabel(l),
  }),

  unemployment: (l) => ({
    fields: [
      { id: 'd', label: T(l, 'Ημέρες εργασίας στους 14 μήνες', 'Days worked in the 14 months'), kind: 'number', def: 200, max: 1000, wide: true, help: T(l, 'Πριν από τη λήξη της σύμβασης, χωρίς τους δύο τελευταίους μήνες.', 'Before the contract ended, leaving out the last two months.') },
      { id: 'p', label: T(l, 'Μέσος μικτός μισθός τελευταίου εξαμήνου', 'Average gross pay, last six months'), kind: 'number', def: 1100, unit: '€', max: 1_000_000 },
      count(l, 'f', T(l, 'Προστατευόμενα μέλη', 'Dependants'), '0', 6),
      { id: 'a', label: T(l, 'Ηλικία', 'Age'), kind: 'number', def: 35, max: 120 },
    ],
    run: (v) => {
      const u = unemploymentBenefit({ days: n(v, 'd'), avgPay: n(v, 'p'), dependants: n(v, 'f'), age: n(v, 'a') });
      return {
        headLabel: T(l, 'Επίδομα ανεργίας τον μήνα', 'Unemployment benefit per month'), head: $2(u.monthly, l),
        sub: u.eligible ? T(l, `για ${u.months} μήνες · ${$(u.total, l)} συνολικά`, `for ${u.months} months · ${$(u.total, l)} in total`) : T(l, `Χρειάζονται τουλάχιστον ${P.unemployment.duration[0].minDays} ημέρες.`, `At least ${P.unemployment.duration[0].minDays} days are needed.`),
        rows: [
          { label: T(l, `Ημερήσιο επίδομα (${pct(P.unemployment.rate, l)} του κατώτατου ημερομισθίου)`, `Daily rate (${pct(P.unemployment.rate, l)} of the minimum daily wage)`), value: $2(u.dailyBase, l) },
          { label: T(l, 'Ποσοστό λόγω αποδοχών', 'Share for your pay level'), value: pct(u.share, l) },
          { label: T(l, `Βασικό ποσό (${P.unemployment.days_per_month} ημερήσια)`, `Base amount (${P.unemployment.days_per_month} daily rates)`), value: $2(u.base, l) },
          { label: T(l, `Προσαύξηση ${pct(P.unemployment.dependant_uplift, l)} ανά μέλος`, `${pct(P.unemployment.dependant_uplift, l)} per dependant`), value: `+${$2(u.monthly - u.base, l)}` },
          { label: T(l, 'Διάρκεια', 'Duration'), value: T(l, `${u.months} μήνες`, `${u.months} months`), strong: true },
        ],
        note: T(l, 'Τακτική επιδότηση για απόλυση ή λήξη σύμβασης. Στην πρώτη αίτηση απαιτούνται επιπλέον 80 ημέρες σε καθένα από τα δύο προηγούμενα έτη. Αίτηση μέσα σε 60 ημέρες.', 'Regular benefit after dismissal or the end of a contract. A first claim also needs 80 days in each of the two previous years. Apply within 60 days.'),
      };
    }, footer: footer(l, 'την εγκύκλιο της ΔΥΠΑ', 'the DYPA circular'), methodLabel: methodLabel(l),
  }),

  rentrefund: (l) => ({
    fields: [
      { id: 'r', label: T(l, 'Ενοίκιο που πληρώσατε πέρυσι (σύνολο)', 'Rent paid last year (total)'), kind: 'number', def: 7200, unit: '€', max: 1_000_000, wide: true, help: T(l, 'Όπως δηλώθηκε στο μισθωτήριο της ΑΑΔΕ και στο Ε1.', 'As declared on the AADE lease and your E1 return.') },
      { id: 'h', label: T(l, 'Νοικοκυριό', 'Household'), kind: 'select', def: 'couple', options: [{ value: 'single', label: T(l, 'Άγαμος', 'Single') }, { value: 'couple', label: T(l, 'Έγγαμοι ή σύμφωνο', 'Married or civil partners') }, { value: 'singleParent', label: T(l, 'Μονογονεϊκή', 'Single parent') }] },
      count(l, 'k', T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), '1', 6),
      { id: 'i', label: T(l, 'Οικογενειακό εισόδημα', 'Family income'), kind: 'number', def: 30000, unit: '€', max: 10_000_000 },
      yesNo(l, 'st', T(l, 'Φοιτητική κατοικία;', 'Student flat?')),
    ],
    run: (v) => {
      const st = s(v, 'st') === '1';
      const r = rentRefund({ annualRent: n(v, 'r'), household: s(v, 'h') as RentHousehold, children: n(v, 'k'), income: n(v, 'i'), student: st });
      return {
        headLabel: T(l, `Επιστροφή ενοικίου Νοεμβρίου ${P.year}`, `Rent refund, November ${P.year}`), head: $(r.amount, l),
        sub: r.eligible ? (r.capped ? T(l, `Το 1/12 είναι ${$(r.twelfth, l)}, περιορίζεται στο όριο των ${$(r.cap, l)}.`, `One twelfth is ${$(r.twelfth, l)}, capped at ${$(r.cap, l)}.`) : T(l, 'Ένα δωδέκατο του ενοικίου της χρονιάς.', 'One twelfth of the year’s rent.')) : T(l, `Το εισόδημα ξεπερνά το όριο των ${$(r.incomeLimit, l)}.`, `Income is above the ${$(r.incomeLimit, l)} limit.`),
        rows: [
          { label: T(l, 'Ένα δωδέκατο του ετήσιου ενοικίου', 'One twelfth of the annual rent'), value: $(r.twelfth, l) },
          { label: st ? T(l, 'Όριο ανά φοιτητή', 'Cap per student') : T(l, `Όριο: ${$(P.rent_refund.cap, l)} + ${$(P.rent_refund.per_child, l)} ανά παιδί`, `Cap: ${$(P.rent_refund.cap, l)} + ${$(P.rent_refund.per_child, l)} per child`), value: $(r.cap, l) },
          { label: T(l, 'Εισοδηματικό όριο 2026', '2026 income limit'), value: $(r.incomeLimit, l) },
          { label: T(l, 'Ενοίκιο που δίνει το μέγιστο', 'Rent that reaches the maximum'), value: T(l, `${$(r.rentForMax, l)} τον χρόνο`, `${$(r.rentForMax, l)} a year`), strong: true },
        ],
        note: T(l, `Χωρίς αίτηση: η ΑΑΔΕ υπολογίζει από το μισθωτήριο (δηλωμένο έως ${P.rent_refund.lease_declared_by}) και τη δήλωση. Για κύρια κατοικία ελέγχεται και η ακίνητη περιουσία.`, `No application: AADE works it out from the lease (declared by ${P.rent_refund.lease_declared_by_en}) and the tax return. Property value is also checked for a main home.`),
      };
    }, footer: footer(l, 'το άρθρο 70 του ν. 5217/2025 και την ΑΑΔΕ', 'article 70 of Law 5217/2025 and AADE'), methodLabel: methodLabel(l),
  }),

  maternity: (l) => ({
    fields: [
      { id: 'st', label: T(l, 'Απασχόληση πριν από τον τοκετό', 'Work before the birth'), kind: 'select', def: 'full', wide: true, options: [{ value: 'full', label: T(l, 'Μισθωτή, πλήρης απασχόληση', 'Employee, full time') }, { value: 'part', label: T(l, 'Μισθωτή, μερική απασχόληση', 'Employee, part time') }, { value: 'self', label: T(l, 'Αυτοαπασχολούμενη ή αγρότισσα', 'Self-employed or farmer') }] },
      count(l, 'fa', T(l, 'Μήνες που παίρνει ο πατέρας', 'Months taken by the father'), '0', P.maternity.special_transferable_to_father),
    ],
    run: (v) => {
      const m = maternitySpecial(s(v, 'st') as MotherStatus, n(v, 'fa'));
      return {
        headLabel: T(l, 'Ειδική παροχή μητρότητας ΔΥΠΑ', 'DYPA special maternity benefit'), head: T(l, `${$(m.monthly, l)} τον μήνα`, `${$(m.monthly, l)} a month`),
        sub: T(l, `για ${m.months} μήνες · ${$(m.total, l)} συνολικά, μικτά`, `for ${m.months} months · ${$(m.total, l)} in total, gross`),
        bar: [{ label: T(l, 'Μητέρα', 'Mother'), value: m.mother, color: C.a }, ...(m.father ? [{ label: T(l, 'Πατέρας', 'Father'), value: m.father, color: C.b }] : [])],
        rows: [
          { label: T(l, 'Πριν: άδεια μητρότητας e-ΕΦΚΑ', 'First: e-EFKA maternity leave'), value: T(l, `${m.efkaDays} ημέρες (${m.efkaWeeks} εβδομάδες)`, `${m.efkaDays} days (${m.efkaWeeks} weeks)`) },
          { label: T(l, 'Μήνες για τη μητέρα', 'Months for the mother'), value: String(m.mother) },
          { label: T(l, 'Μήνες για τον πατέρα', 'Months for the father'), value: String(m.father) },
          { label: T(l, 'Ποσό ανά μήνα', 'Amount per month'), value: $(m.monthly, l), strong: true },
        ],
        note: s(v, 'st') === 'self' ? T(l, 'Για αυτοαπασχολούμενες ο πατέρας μπορεί να πάρει μήνες αφού η μητέρα πάρει δύο. Χωρίς δώρα εορτών.', 'For self-employed mothers the father can take months once the mother has had two. No holiday bonuses.') : T(l, 'Στις μισθωτές προστίθενται αναλογία δώρων και επιδόματος αδείας, και η ΔΥΠΑ πληρώνει τις εισφορές. Δεν φορολογείται.', 'Employees also receive a share of the holiday bonuses and leave allowance, and DYPA pays the contributions. It is tax-free.'),
      };
    }, footer: footer(l, 'τη ΔΥΠΑ και τον e-ΕΦΚΑ', 'DYPA and e-EFKA'), methodLabel: methodLabel(l), barLabel: T(l, 'Μήνες ανά γονέα', 'Months per parent'),
  }),

  student: (l) => ({
    fields: [
      { id: 'g', label: T(l, 'Πού σπουδάζει', 'Where they study'), kind: 'select', def: '0', wide: true, options: [{ value: '0', label: T(l, 'Αττική ή Θεσσαλονίκη', 'Attica or Thessaloniki') }, { value: '1', label: T(l, 'Άλλη πόλη', 'Elsewhere') }] },
      yesNo(l, 'sh', T(l, 'Συγκατοικεί με άλλον φοιτητή;', 'Shares with another student?')),
      { id: 'i', label: T(l, 'Οικογενειακό εισόδημα', 'Family income'), kind: 'number', def: 24000, unit: '€', max: 10_000_000 },
      count(l, 'k', T(l, 'Εξαρτώμενα τέκνα στην οικογένεια', 'Dependent children in the family'), '2', 8, 1),
    ],
    run: (v) => {
      const r = studentHousing({ regional: s(v, 'g') === '1', shared: s(v, 'sh') === '1', income: n(v, 'i'), children: n(v, 'k') });
      return {
        headLabel: T(l, 'Φοιτητικό στεγαστικό επίδομα', 'Student housing allowance'), head: $(r.amount, l),
        sub: r.ok ? T(l, 'τον χρόνο, για το ακαδημαϊκό έτος 2025-2026', 'per year, academic year 2025-2026') : T(l, `Το εισόδημα ξεπερνά το όριο των ${$(r.limit, l)}.`, `Income is above the ${$(r.limit, l)} limit.`),
        rows: [
          { label: T(l, 'Ποσό για αυτή την περίπτωση', 'Amount for this case'), value: $(r.gross, l) },
          { label: T(l, 'Εισοδηματικό όριο', 'Income limit'), value: $(r.limit, l) },
          { label: T(l, 'Μέγιστο ποσό', 'Highest amount'), value: $(P.student_housing.regional_shared, l), strong: true },
        ],
        note: T(l, `Μισθωτήριο τουλάχιστον ${P.student_housing.min_lease_months} μηνών σε άλλη πόλη από την κατοικία της οικογένειας, επιτυχία στα μισά μαθήματα της προηγούμενης χρονιάς, κατοικίες έως ${P.student_housing.max_sqm} m².`, `A lease of at least ${P.student_housing.min_lease_months} months in a different town from the family home, half of last year’s courses passed, family homes up to ${P.student_housing.max_sqm} m².`),
      };
    }, footer: footer(l, 'την εγκύκλιο του Υπουργείου Παιδείας', 'the Ministry of Education circular'), methodLabel: methodLabel(l),
  }),

  widow: (l) => ({
    fields: [
      { id: 'p', label: T(l, 'Σύνταξη του θανόντος', 'Pension of the deceased'), kind: 'number', def: 1000, unit: '€', max: 100000, wide: true, help: T(l, 'Μηνιαία κύρια σύνταξη, ή αυτή που θα δικαιούνταν.', 'Monthly main pension, or the one they were entitled to.') },
      count(l, 'k', T(l, 'Παιδιά κάτω των 24', 'Children under 24'), '0', 6),
      { id: 'a', label: T(l, 'Ηλικία του επιζώντα συζύγου', 'Age of the surviving spouse'), kind: 'number', def: 58, max: 120 },
      yesNo(l, 'w', T(l, 'Εργάζεται ή παίρνει άλλη σύνταξη;', 'Works or has another pension?')),
    ],
    run: (v) => {
      const k = n(v, 'k');
      const r = widowPension({ pension: n(v, 'p'), children: k, age: n(v, 'a'), works: s(v, 'w') === '1' });
      return {
        headLabel: T(l, 'Σύνταξη χηρείας τον μήνα', 'Widow’s pension per month'), head: $(r.spouse, l),
        sub: r.lifetime ? T(l, 'εφ’ όρου ζωής', 'for life') : T(l, `για ${P.widow.temporary_years} χρόνια, ξανά από τα ${P.widow.resume_age}`, `for ${P.widow.temporary_years} years, again from age ${P.widow.resume_age}`),
        bar: [{ label: T(l, 'Σύζυγος', 'Spouse'), value: r.spouse, color: C.a }, ...(k ? [{ label: T(l, 'Παιδιά', 'Children'), value: r.childrenTotal, color: C.b }] : [])],
        rows: [
          { label: T(l, `Σύζυγος (${pct(P.widow.spouse_share, l)})`, `Spouse (${pct(P.widow.spouse_share, l)})`), value: $(r.spouse, l) },
          ...(k ? [{ label: T(l, 'Κάθε παιδί', 'Each child'), value: $(r.perChild, l) }] : []),
          { label: T(l, 'Σύνολο οικογένειας', 'Family total'), value: $(r.total, l) },
          { label: T(l, 'Μετά την τριετία', 'After the first three years'), value: r.lifetime ? $(r.after3, l) : T(l, `διακοπή έως τα ${P.widow.resume_age}`, `stops until age ${P.widow.resume_age}`), strong: true },
        ],
        note: T(l, 'Θάνατος μετά τις 17.5.2019. Απαιτούνται τρία χρόνια γάμου, εκτός αν υπάρχει παιδί ή ο θάνατος οφείλεται σε ατύχημα. Η μισή σύνταξη δεν πέφτει κάτω από το νόμιμο ελάχιστο.', 'Death after 17 May 2019. Three years of marriage are required unless there is a child or the death was an accident. The halved pension cannot fall below the legal minimum.'),
      };
    }, footer: footer(l, 'το άρθρο 12 του ν. 4387/2016', 'article 12 of Law 4387/2016'), methodLabel: methodLabel(l), barLabel: T(l, 'Μερίδια', 'Shares'),
  }),
};
