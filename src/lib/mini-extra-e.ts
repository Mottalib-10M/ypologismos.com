/** Mini-simulateurs supplémentaires du lot « e » (RECETTE §9.3). Même forme que lib/mini-specs.ts. */
import { salary, grossForNet, enfia, enfiaAgeFactor, PARAMS as P } from './engine/gr';
import { formatMoney, formatNumber, pct } from './format';
import type { MiniSpec } from './mini-types';

/**
 * Seuils de l'art. 13 et de l'art. 10 par. 5 du ΚΦΠ (ν. 5219/2025) absents de params-2026.json,
 * relevés sur taxheaven.gr le 2026-10-03. À déplacer dans `params.enfia` à la prochaine révision
 * des paramètres (le lot E n'a pas le droit de modifier ce fichier).
 *  - art. 13 par. 1 β : valeur totale du patrimoine ≤ 85 000 € (célibataire), 150 000 € (couple ou
 *    parent seul avec un enfant), 200 000 € (couple avec enfants ou parent seul avec deux enfants) ;
 *  - art. 13 par. 2 δ : trois enfants à charge ou handicap ≥ 80 % pour la réduction de 100 % ;
 *  - art. 10 par. 5 : valeur de reconstruction retenue au moins 1 000 €/m², assurance d'au moins 3 mois.
 */
export const ENFIA_LOW_WEALTH = { single: 85_000, couple: 150_000, family: 200_000 } as const;
export const ENFIA_FULL_CHILDREN = 3;
export const ENFIA_FULL_DISABILITY = 0.8;
export const ENFIA_RECON_MIN_SQM = 1_000;
export const ENFIA_INS_MIN_MONTHS = 3;

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
const yesNo = (l: L, id: string, label: string, def = 0) => ({ id, label, def, options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] });
const ENF = (l: L) => T(l, 'Πλήρης υπολογιστής ΕΝΦΙΑ', 'Full ENFIA calculator');
const E = P.enfia;

export const EXTRA_E: Record<string, (l: string) => MiniSpec> = {
  /** Φόρος επί της αξίας (Ενότητα Γ) και προσαύξηση (Ενότητα Ε) για μια συνολική αξία. */
  enfiavalue: (l) => ({ title: T(l, 'Συμπληρωματικός φόρος και προσαύξηση πάνω από 300.000 €', 'Value tax and surcharge above €300,000'), cta: ENF(l),
    inputs: [{ id: 'v', label: T(l, 'Συνολική αξία ακινήτων (100 %)', 'Total property value (100%)'), def: 650000, unit: '€', max: 100_000_000 }],
    run: ({ v }) => { const r = enfia({ sqm: 100, zonePrice: v > 0 ? v / 100 : 0, buildYear: 1990, totalValue: v });
      return { head: [T(l, 'Φόρος επί της αξίας', 'Value tax'), $(r.rightTax, l)], rows: [[T(l, 'Προσαύξηση του κύριου φόρου', 'Surcharge on the main tax'), pct(r.surchargeRate, l)], [T(l, 'Μείωση λόγω αξίας', 'Value-based reduction'), pct(r.valueReductionRate, l)], [T(l, 'Κλιμάκια που αρχίζουν να φορολογούνται από', 'Bands start taxing from'), $(E.right_tax_bands[0].upTo ?? 0, l)]],
        note: T(l, 'Υπολογισμός για ένα δικαίωμα πλήρους κυριότητας 100 %, χωρίς οικόπεδα εκτός σχεδίου.', 'One right of full ownership at 100%, no land outside town plans.') }; } }),

  /** Συντελεστής παλαιότητας : ce que coûte un permis récent. */
  enfiaage: (l) => ({ title: T(l, 'Πόσο ανεβάζει τον ΕΝΦΙΑ μια νεότερη άδεια', 'How a newer permit raises ENFIA'), cta: ENF(l),
    inputs: [{ id: 'y', label: T(l, 'Έτος νεότερης οικοδομικής άδειας', 'Year of the newest building permit'), def: 2015, max: P.year }, { id: 's', label: T(l, 'Τετραγωνικά', 'Square metres'), def: 90, unit: 'm²', max: 100000 }, { id: 'z', label: T(l, 'Τιμή ζώνης', 'Zone price'), def: 1800, unit: '€/m²', max: 50000 }],
    run: ({ y, s, z }) => { const a = enfiaAgeFactor(y); const now = enfia({ sqm: s, zonePrice: z, buildYear: y, floor: 'f2_3', facades: 1 }); const old = enfia({ sqm: s, zonePrice: z, buildYear: P.year - 30, floor: 'f2_3', facades: 1 });
      return { head: [T(l, 'Συντελεστής παλαιότητας', 'Age factor'), formatNumber(a.factor, 2, l)], rows: [[T(l, 'Παλαιότητα', 'Building age'), T(l, `${a.age} έτη`, `${a.age} years`)], [T(l, 'ΕΝΦΙΑ με αυτή την άδεια', 'ENFIA with this permit'), $(now.total, l)], [T(l, 'Ίδιο σπίτι άνω των 25 ετών', 'Same home over 25 years old'), $(old.total, l)]],
        note: T(l, '2ος-3ος όροφος, μία πρόσοψη, χωρίς άλλα ακίνητα.', '2nd-3rd floor, one frontage, no other property.') }; } }),

  /** Έκπτωση 50 % / 100 % de l'art. 13 par. 1 et 2. */
  enfialow: (l) => ({ title: T(l, 'Δικαιούστε την έκπτωση 50 % ή 100 % χαμηλού εισοδήματος;', 'Do you qualify for the 50% or 100% low-income cut?'), cta: ENF(l),
    inputs: [{ id: 'i', label: T(l, 'Οικογενειακό φορολογητέο εισόδημα', 'Family taxable income'), def: 11000, unit: '€', max: 10_000_000 },
      { id: 'm', label: T(l, 'Σύζυγος και εξαρτώμενα μέλη', 'Spouse and dependants'), def: 2, max: 20 },
      { id: 'q', label: T(l, 'Συνολικά τετραγωνικά κτισμάτων', 'Total built area'), def: 95, unit: 'm²', max: 100000 },
      yesNo(l, 'c', T(l, '3+ τέκνα ή αναπηρία 80 %+;', '3+ children or 80%+ disability?'))],
    run: ({ i, m, q, c }) => { const add = E.low_income_per_member * Math.max(0, m); const lim50 = E.low_income_50_income + add, lim100 = E.low_income_100_income + add; const area = q <= E.low_income_max_sqm;
      const rate = area && c === 1 && i <= lim100 ? 1 : area && i <= lim50 ? 0.5 : 0;
      return { head: [T(l, 'Έκπτωση που μπορεί να ισχύει', 'Reduction that may apply'), pct(rate, l)], rows: [[T(l, 'Όριο εισοδήματος για 50 %', 'Income limit for 50%'), $(lim50, l)], [T(l, 'Όριο εισοδήματος για 100 %', 'Income limit for 100%'), $(lim100, l)], [T(l, 'Όριο επιφάνειας', 'Area limit'), `${formatNumber(E.low_income_max_sqm, 0, l)} m²`]],
        note: T(l, `Για το 50 % ελέγχεται και η συνολική αξία: έως ${$(ENFIA_LOW_WEALTH.single, l)}, ${$(ENFIA_LOW_WEALTH.couple, l)} ή ${$(ENFIA_LOW_WEALTH.family, l)} ανάλογα με την οικογένεια.`, `For the 50% cut total value is checked too: up to ${$(ENFIA_LOW_WEALTH.single, l)}, ${$(ENFIA_LOW_WEALTH.couple, l)} or ${$(ENFIA_LOW_WEALTH.family, l)} depending on the household.`) }; } }),

  /** Επιλεξιμότητα για τη μείωση των μικρών οικισμών (art. 17 par. 3). */
  villagecheck: (l) => ({ title: T(l, 'Πιάνει ο οικισμός σας τη μείωση;', 'Does your village qualify?'), cta: ENF(l),
    inputs: [{ id: 'p', label: T(l, 'Πληθυσμός οικισμού (απογραφή)', 'Settlement population (census)'), def: 1600, max: 10_000_000 },
      yesNo(l, 'b', T(l, 'Παραμεθόριος δήμος της διάταξης;', 'Border municipality named in the law?'), 1),
      yesNo(l, 'a', T(l, 'Ηπειρωτική Αττική;', 'Mainland Attica?')),
      { id: 'v', label: T(l, 'Αξία κύριας κατοικίας (100 %)', 'Value of the main home (100%)'), def: 120000, unit: '€', max: 100_000_000 }],
    run: ({ p, b, a, v }) => { const limit = b === 1 ? E.small_settlement_population_border : E.small_settlement_population; const ok = a !== 1 && p <= limit && v <= E.small_settlement_value_limit;
      return { head: [T(l, `Μείωση ${P.year}`, `${P.year} cut`), ok ? pct(E.small_settlement_reduction_2026, l) : pct(0, l)], rows: [[T(l, 'Όριο πληθυσμού που ισχύει', 'Population limit that applies'), formatNumber(limit, 0, l)], [T(l, 'Όριο αξίας κατοικίας', 'Home value limit'), $(E.small_settlement_value_limit, l)], [T(l, 'Από το 2027', 'From 2027'), ok ? T(l, 'απαλλαγή', 'exempt') : '—']],
        note: T(l, 'Η κύρια κατοικία κρίνεται από τη δήλωση φορολογίας εισοδήματος του προηγούμενου έτους.', 'The main home is the one in the previous year’s income tax return.') }; } }),

  /** Ασφαλισμένο κεφάλαιο ελάχιστο (αξία ανακατασκευής ≥ 1 000 €/m²). */
  insrecon: (l) => ({ title: T(l, 'Καλύπτει το συμβόλαιό σας την αξία ανακατασκευής;', 'Does your policy cover the rebuild value?'), cta: ENF(l),
    inputs: [{ id: 's', label: T(l, 'Τετραγωνικά κατοικίας', 'Home size'), def: 95, unit: 'm²', max: 100000 }, { id: 'c', label: T(l, 'Ασφαλισμένο κεφάλαιο κτιρίου', 'Building sum insured'), def: 80000, unit: '€', max: 100_000_000 }],
    run: ({ s, c }) => { const min = s * ENFIA_RECON_MIN_SQM; const ok = c >= min;
      return { head: [T(l, 'Ελάχιστο κεφάλαιο για την έκπτωση', 'Minimum sum for the reduction'), $(min, l)], rows: [[T(l, 'Το συμβόλαιό σας', 'Your policy'), $(c, l)], [T(l, 'Επαρκεί;', 'Enough?'), ok ? T(l, 'Ναι', 'Yes') : T(l, `Όχι, λείπουν ${$(min - c, l)}`, `No, ${$(min - c, l)} short`)]],
        note: T(l, 'Απαιτείται κάλυψη για σεισμό, πυρκαγιά και πλημμύρα, χωρίς την αξία του οικοπέδου.', 'Cover must include earthquake, fire and flood, excluding the land value.') }; } }),

  /** Αύξηση : combien de brut demander pour X € nets de plus. */
  raiseask: (l) => ({ title: T(l, 'Πόση μικτή αύξηση να ζητήσετε', 'What gross raise to ask for'), cta: T(l, 'Πλήρης υπολογιστής καθαρά σε μικτά', 'Full net-to-gross calculator'),
    inputs: [{ id: 'g', label: T(l, 'Σημερινός μικτός μισθός', 'Current gross salary'), def: 1500, unit: '€', max: 1_000_000 }, { id: 'x', label: T(l, 'Επιπλέον καθαρά που θέλετε', 'Extra net you want'), def: 150, unit: '€', max: 100000 }],
    run: ({ g, x }) => { const now = salary({ gross: g }); const target = grossForNet(now.net + x); const raise = Math.max(0, target - g);
      return { head: [T(l, 'Μικτή αύξηση ανά καταβολή', 'Gross raise per payment'), $(raise, l)], rows: [[T(l, 'Νέος μικτός', 'New gross'), $(target, l)], [T(l, 'Ποσοστό αύξησης', 'Raise in percent'), pct(g > 0 ? raise / g : 0, l)], [T(l, 'Επιπλέον κόστος εργοδότη τον χρόνο', 'Extra employer cost per year'), $(salary({ gross: target }).costAnnual - now.costAnnual, l)]] }; } }),

  /** Budget employeur : quel brut pour un coût total donné. */
  hirebudget: (l) => ({ title: T(l, 'Ποιον μισθό σηκώνει ο προϋπολογισμός σας', 'What salary your budget allows'), cta: T(l, 'Πλήρης υπολογιστής κόστους', 'Full employer cost calculator'),
    inputs: [{ id: 'b', label: T(l, 'Συνολικό κόστος ανά καταβολή', 'Total cost per payment'), def: 2000, unit: '€', max: 1_000_000 }],
    run: ({ b }) => { const ceilCost = P.efka.ceiling_monthly * (1 + P.efka.employer_rate); const g = b <= ceilCost ? b / (1 + P.efka.employer_rate) : b - P.efka.ceiling_monthly * P.efka.employer_rate; const s = salary({ gross: g });
      return { head: [T(l, 'Μικτός μισθός', 'Gross salary'), $(g, l)], rows: [[T(l, 'Εργοδοτικές εισφορές', 'Employer contributions'), $2(s.employer, l)], [T(l, 'Καθαρά εργαζομένου (άνω των 30, χωρίς τέκνα)', 'Employee net (over 30, no children)'), $(s.net, l)], [T(l, 'Κόστος τον χρόνο (14)', 'Cost per year (14)'), $(s.costAnnual, l)]] }; } }),
};
