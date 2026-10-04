/** Mini-simulateurs du lot « h » : aides (επιδόματα), RECETTE §9.3. Moteur : engine/epidomata.ts. */
import { PARAMS as P, parentalBenefit } from './engine/gr';
import {
  childBenefit, childBenefitLimits, birthAllowance, housingBenefit, heatingAllowance, unemploymentBenefit, unemploymentMonths,
  rentRefund, rentRefundIncomeLimit, maternitySpecial, studentHousing, widowPension, FUELS, type RentHousehold,
} from './engine/epidomata';
import { formatMoney, formatDecimal, pct } from './format';
import type { MiniSpec } from './mini-types';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
const kids = (l: L, def = 2, from = 0, max = 6) => ({ id: 'k', label: T(l, 'Παιδιά', 'Children'), def, options: Array.from({ length: max - from + 1 }, (_, i) => ({ value: String(i + from), label: String(i + from) })) });
const parents = (l: L) => ({ id: 'p', label: T(l, 'Γονείς', 'Parents'), def: 2, options: [{ value: '2', label: T(l, 'Δύο', 'Two') }, { value: '1', label: T(l, 'Ένας', 'One') }] });
const CAT = ['Α', 'Β', 'Γ'];
const HH: RentHousehold[] = ['single', 'couple', 'singleParent'];
const FUEL_EL: Record<string, string> = { oil: 'Πετρέλαιο', gas: 'Φυσικό αέριο', electricity: 'Ρεύμα', pellet: 'Πέλετ', wood: 'Καυσόξυλα', district: 'Τηλεθέρμανση' };
const FUEL_EN: Record<string, string> = { oil: 'Heating oil', gas: 'Natural gas', electricity: 'Electricity', pellet: 'Pellets', wood: 'Firewood', district: 'District heating' };
const toChild = (l: L) => T(l, 'Υπολογιστής επιδόματος παιδιού', 'Child benefit calculator');

export const EXTRA_H: Record<string, (l: string) => MiniSpec> = {
  /** Distance à la limite de catégorie suivante. */
  childnext: (l) => ({ title: T(l, 'Πόσο απέχετε από την επόμενη κατηγορία', 'How far you are from the next band'), cta: toChild(l),
    inputs: [{ id: 'i', label: T(l, 'Οικογενειακό εισόδημα', 'Family income'), def: 19000, unit: '€', max: 10_000_000 }, kids(l, 2, 1), parents(l)],
    run: ({ i, k, p }) => { const r = childBenefit({ income: i, parents: p, children: k }); const lims = childBenefitLimits(p, k); const next = r.category >= 0 ? lims[r.category] : null; const worse = r.category >= 0 ? childBenefit({ income: (next ?? 0) + 1, parents: p, children: k }).monthly : 0;
      return { head: [T(l, 'Περιθώριο μέχρι το όριο', 'Room before the limit'), next !== null ? $(next - i, l) : '—'], rows: [[T(l, 'Κατηγορία σήμερα', 'Band now'), r.category >= 0 ? CAT[r.category] : '—'], [T(l, 'Επίδομα σήμερα', 'Benefit now'), $(r.monthly, l)], [T(l, 'Μετά το όριο', 'Above the limit'), $(worse, l)]], note: T(l, 'Ένα ευρώ πάνω από το όριο αλλάζει κατηγορία για όλο το έτος.', 'One euro over the limit changes the band for the whole year.') }; } }),

  /** Allocation de naissance selon le rang. */
  birth: (l) => ({ title: T(l, 'Επίδομα γέννησης για το παιδί που περιμένετε', 'Birth allowance for the baby you expect'), cta: toChild(l),
    inputs: [{ id: 'r', label: T(l, 'Ποιο παιδί θα είναι', 'Which child it will be'), def: 1, options: [1, 2, 3, 4, 5].map((x) => ({ value: String(x), label: x === 5 ? T(l, '5ο ή επόμενο', '5th or later') : T(l, `${x}ο`, `No. ${x}`) })) }],
    run: ({ r }) => { const b = birthAllowance(r);
      return { head: [T(l, 'Επίδομα γέννησης', 'Birth allowance'), $(b.amount, l)], rows: [[T(l, 'Σε δύο δόσεις των', 'In two instalments of'), $(b.installment, l)], [T(l, 'Όριο ισοδύναμου εισοδήματος', 'Equivalent income limit'), $(b.limit, l)], [T(l, 'Αίτηση μέσα σε', 'Apply within'), T(l, `${P.birth_allowance.apply_within_months} μήνες`, `${P.birth_allowance.apply_within_months} months`)]] }; } }),

  /** Montant d'une échéance bimestrielle et cumul 2026. */
  childinst: (l) => ({ title: T(l, 'Πόσα παίρνετε σε κάθε πληρωμή', 'What each payment brings you'), cta: toChild(l),
    inputs: [{ id: 'i', label: T(l, 'Οικογενειακό εισόδημα', 'Family income'), def: 14000, unit: '€', max: 10_000_000 }, kids(l, 2, 1), parents(l)],
    run: ({ i, k, p }) => { const r = childBenefit({ income: i, parents: p, children: k }); const paid = P.child_benefit.payments_2026.length;
      return { head: [T(l, 'Κάθε διμηνιαία δόση', 'Each two-month payment'), $(r.installment, l)], rows: [[T(l, 'Τον μήνα', 'Per month'), $(r.monthly, l)], [T(l, `Οι ${paid} δόσεις που πληρώθηκαν ως τον Σεπτέμβριο`, `The ${paid} payments made by September`), $(r.installment * paid, l)], [T(l, 'Ολόκληρο το έτος (6 δόσεις)', 'Whole year (6 payments)'), $(r.annual, l)]] }; } }),

  /** Achats insuffisants : moitié des factures. */
  heatpurchase: (l) => ({ title: T(l, 'Αγοράσατε αρκετό καύσιμο;', 'Did you buy enough fuel?'), cta: T(l, 'Υπολογιστής επιδόματος θέρμανσης', 'Heating allowance calculator'),
    inputs: [{ id: 'a', label: T(l, 'Επίδομα που δικαιούστε', 'Allowance you qualify for'), def: 400, unit: '€', max: 100000 }, { id: 'b', label: T(l, 'Αξία αγορών με τιμολόγιο', 'Value of invoiced purchases'), def: 600, unit: '€', max: 1_000_000 }],
    run: ({ a, b }) => { const need = a * P.heating.purchase_multiple; const got = b >= need ? a : Math.max(P.heating.min, Math.min(a, b / 2));
      return { head: [T(l, 'Επίδομα που θα πάρετε', 'Allowance you will get'), $(got, l)], rows: [[T(l, 'Αγορές που χρειάζονται', 'Purchases needed'), $(need, l)], [T(l, 'Λείπουν', 'Missing'), $(Math.max(0, need - b), l)], [T(l, 'Σε λίτρα πετρελαίου', 'In litres of heating oil'), formatDecimal(Math.max(0, need - b) / P.heating.oil_price_per_litre, 0, l)]] }; } }),

  /** Comparaison des combustibles pour un même ΣΟ-Μ. */
  heatfuel: (l) => ({ title: T(l, 'Ποιο καύσιμο δίνει μεγαλύτερο επίδομα', 'Which fuel gives the larger allowance'), cta: T(l, 'Υπολογιστής επιδόματος θέρμανσης', 'Heating allowance calculator'),
    inputs: [{ id: 's', label: T(l, 'ΣΟ-Μ του οικισμού σας', 'Your settlement’s weather coefficient'), def: 0.7, max: 3, decimals: 2 }, kids(l, 1)],
    run: ({ s, k }) => { const all = FUELS.map((f) => [f, heatingAllowance({ fuel: f, som: s, children: k }).amount] as const);
      return { head: [T(l, 'Ρεύμα', 'Electricity'), $(all.find((x) => x[0] === 'electricity')![1], l)], rows: all.filter((x) => x[0] !== 'electricity' && x[0] !== 'district').map(([f, a]) => [T(l, FUEL_EL[f], FUEL_EN[f]), $(a, l)] as [string, string]) }; } }),

  /** Grille de l'allocation logement par taille du foyer. */
  housingtable: (l) => ({ title: T(l, 'Ποσό και όρια για το νοικοκυριό σας', 'Amount and limits for your household'), cta: T(l, 'Υπολογιστής επιδόματος στέγασης', 'Housing benefit calculator'),
    inputs: [{ id: 'm', label: T(l, 'Μέλη', 'Members'), def: 2, options: [1, 2, 3, 4, 5, 6].map((x) => ({ value: String(x), label: String(x) })) }, { id: 's', label: T(l, 'Μονογονεϊκή;', 'Single parent?'), def: 0, options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] }],
    run: ({ m, s }) => { const h = housingBenefit({ members: m, singleParent: s === 1, rent: 100000 });
      return { head: [T(l, 'Επίδομα τον μήνα', 'Benefit per month'), $(h.gross, l)], rows: [[T(l, 'Όριο εισοδήματος', 'Income limit'), $(h.incomeLimit, l)], [T(l, 'Όριο ακινήτων', 'Property limit'), $(h.propertyLimit, l)], [T(l, 'Όριο καταθέσεων', 'Savings limit'), $(h.depositsLimit, l)]] }; } }),

  /** Durée selon les jours et l'âge. */
  unempduration: (l) => ({ title: T(l, 'Πόσους μήνες θα πάρετε επίδομα', 'How many months you will be paid'), cta: T(l, 'Υπολογιστής επιδόματος ανεργίας', 'Unemployment benefit calculator'),
    inputs: [{ id: 'd', label: T(l, 'Ημέρες εργασίας', 'Days worked'), def: 190, max: 1000 }, { id: 'a', label: T(l, 'Ηλικία', 'Age'), def: 50, max: 120 }],
    run: ({ d, a }) => { const m = unemploymentMonths(d, a); const next = P.unemployment.duration.find((x) => x.minDays > d);
      return { head: [T(l, 'Διάρκεια επιδότησης', 'Benefit duration'), T(l, `${m} μήνες`, `${m} months`)], rows: [[T(l, 'Επόμενο κλιμάκιο', 'Next step'), next ? T(l, `${next.months} μήνες από ${next.minDays} ημέρες`, `${next.months} months from ${next.minDays} days`) : '—'], [T(l, `12 μήνες από ${P.unemployment.age49_age} ετών με`, `12 months from age ${P.unemployment.age49_age} with`), T(l, `${P.unemployment.age49_days} ημέρες`, `${P.unemployment.age49_days} days`)]] }; } }),

  /** Revalorisation d'avril 2026. */
  unempraise: (l) => ({ title: T(l, 'Τι άλλαξε με τον νέο κατώτατο μισθό', 'What the new minimum wage changed'), cta: T(l, 'Υπολογιστής επιδόματος ανεργίας', 'Unemployment benefit calculator'),
    inputs: [kids(l, 0)],
    run: ({ k }) => { const now = unemploymentBenefit({ days: 250, dependants: k }).monthly; const before = P.unemployment.monthly_before_april_2026 * (1 + P.unemployment.dependant_uplift * k);
      return { head: [T(l, 'Επίδομα από 1.4.2026', 'Benefit from 1 April 2026'), $2(now, l)], rows: [[T(l, 'Πριν από τον Απρίλιο', 'Before April'), $2(before, l)], [T(l, 'Αύξηση τον μήνα', 'Increase per month'), $2(now - before, l)]], note: T(l, 'Το «Παιδιά» εδώ σημαίνει προστατευόμενα μέλη.', '“Children” here means dependants.') }; } }),

  /** Plafond et loyer nécessaire. */
  rentcap: (l) => ({ title: T(l, 'Το μέγιστο που επιστρέφεται στην οικογένειά σας', 'The most your family can get back'), cta: T(l, 'Υπολογιστής επιστροφής ενοικίου', 'Rent refund calculator'),
    inputs: [kids(l, 2), { id: 'm', label: T(l, 'Μηνιαίο ενοίκιο', 'Monthly rent'), def: 550, unit: '€', max: 100000 }],
    run: ({ k, m }) => { const r = rentRefund({ annualRent: m * 12, children: k });
      return { head: [T(l, 'Επιστροφή', 'Refund'), $(r.amount, l)], rows: [[T(l, 'Όριο', 'Cap'), $(r.cap, l)], [T(l, 'Μηνιαίο ενοίκιο για το μέγιστο', 'Monthly rent for the maximum'), $(r.cap, l)]] }; } }),

  /** Plafonds de revenu 2025 contre 2026. */
  rentlimit: (l) => ({ title: T(l, 'Τα νέα εισοδηματικά όρια', 'The new income limits'), cta: T(l, 'Υπολογιστής επιστροφής ενοικίου', 'Rent refund calculator'),
    inputs: [{ id: 'h', label: T(l, 'Νοικοκυριό', 'Household'), def: 1, options: [{ value: '0', label: T(l, 'Άγαμος', 'Single') }, { value: '1', label: T(l, 'Έγγαμοι', 'Married') }, { value: '2', label: T(l, 'Μονογονεϊκή', 'Single parent') }] }, kids(l, 1)],
    run: ({ h, k }) => { const hh = HH[h] ?? 'single'; const a = rentRefundIncomeLimit(hh, k), b = rentRefundIncomeLimit(hh, k, 2025);
      return { head: [T(l, `Όριο ${P.year}`, `${P.year} limit`), $(a, l)], rows: [[T(l, 'Όριο 2025', '2025 limit'), $(b, l)], [T(l, 'Αύξηση', 'Increase'), $(a - b, l)]] }; } }),

  /** Ce que la ΔΥΠΑ verse autour d'une naissance. */
  maternitytotal: (l) => ({ title: T(l, 'Όλα όσα πληρώνει η ΔΥΠΑ μετά τη γέννα', 'Everything DYPA pays after a birth'), cta: T(l, 'Υπολογιστής μητρότητας', 'Maternity calculator'),
    inputs: [{ id: 'p', label: T(l, 'Απασχόληση', 'Work'), def: 0, options: [{ value: '0', label: T(l, 'Πλήρης', 'Full time') }, { value: '1', label: T(l, 'Μερική', 'Part time') }] }],
    run: ({ p }) => { const m = maternitySpecial(p === 1 ? 'part' : 'full'); const g = parentalBenefit();
      return { head: [T(l, 'Σύνολο μικτά', 'Total gross'), $(m.total + g.total, l)], rows: [[T(l, `Ειδική παροχή (${m.months} μήνες)`, `Special benefit (${m.months} months)`), $(m.total, l)], [T(l, `Γονική άδεια (${g.months} μήνες)`, `Parental leave (${g.months} months)`), $(g.total, l)]], note: T(l, 'Η γονική άδεια πληρώνεται ξεχωριστά σε κάθε γονέα.', 'Parental leave pay is per parent.') }; } }),

  /** Plafond de revenu de l'allocation étudiante. */
  studentlimit: (l) => ({ title: T(l, 'Το εισοδηματικό όριο της οικογένειάς σας', 'Your family’s income limit'), cta: T(l, 'Υπολογιστής φοιτητικού επιδόματος', 'Student allowance calculator'),
    inputs: [kids(l, 2, 1, 8), { id: 'i', label: T(l, 'Οικογενειακό εισόδημα', 'Family income'), def: 33000, unit: '€', max: 10_000_000 }],
    run: ({ k, i }) => { const r = studentHousing({ regional: false, shared: false, income: i, children: k });
      return { head: [T(l, 'Όριο', 'Limit'), $(r.limit, l)], rows: [[T(l, 'Το εισόδημά σας', 'Your income'), $(i, l)], [T(l, 'Δικαιούστε;', 'Eligible?'), r.ok ? T(l, 'Ναι', 'Yes') : T(l, 'Όχι', 'No')]] }; } }),

  /** Parts de la pension de réversion. */
  widowshare: (l) => ({ title: T(l, 'Πώς μοιράζεται η σύνταξη', 'How the pension is shared'), cta: T(l, 'Υπολογιστής σύνταξης χηρείας', 'Survivors’ pension calculator'),
    inputs: [{ id: 'p', label: T(l, 'Σύνταξη του θανόντος', 'Pension of the deceased'), def: 900, unit: '€', max: 100000 }, kids(l, 2), { id: 'o', label: T(l, 'Ορφανά και από τους δύο γονείς;', 'Orphaned of both parents?'), def: 0, options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] }],
    run: ({ p, k, o }) => { const r = widowPension({ pension: p, children: k, orphans: o === 1 });
      return { head: [T(l, 'Σύνολο οικογένειας', 'Family total'), $(r.total, l)], rows: [[T(l, 'Σύζυγος', 'Spouse'), $(r.spouse, l)], [T(l, 'Κάθε παιδί', 'Each child'), $(r.perChild, l)], [T(l, 'Ποσοστό της σύνταξης', 'Share of the pension'), pct(p > 0 ? r.total / p : 0, l)]] }; } }),
};
