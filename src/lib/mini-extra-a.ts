/** Mini-simulateurs supplémentaires du lot « a » (RECETTE §9.3). Même forme que lib/mini-specs.ts. */
import { salary, PARAMS as P, type Age } from './engine/gr';
import { formatMoney, pct } from './format';
import type { MiniSpec } from './mini-types';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const AGE: Age[] = ['u25', '26_30', 'over30'];
const kids = (l: L, def = 0) => ({ id: 'k', label: T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), def, options: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: String(k) })) });

export const EXTRA_A: Record<string, (l: string) => MiniSpec> = {
  /** Page méthodologie : les étapes du calcul de la paie, dans l'ordre du moteur. */
  methodsteps: (l) => ({ title: T(l, 'Ο υπολογισμός βήμα προς βήμα, με τον δικό σας μισθό', 'The calculation step by step, on your own salary'), cta: T(l, 'Πλήρης υπολογισμός μισθού', 'Full salary calculator'),
    inputs: [{ id: 'g', label: T(l, 'Μικτός μηνιαίος μισθός', 'Monthly gross salary'), def: 1500, unit: '€', max: 1_000_000 }, kids(l)],
    run: ({ g, k }) => { const s = salary({ gross: g, children: k });
      return { head: [T(l, 'Καθαρά ανά καταβολή (÷ 14)', 'Net per payment (÷ 14)'), $(s.net, l)],
        rows: [
          [T(l, '1. Μικτά × 14', '1. Gross × 14'), $(s.annualGross, l)],
          [T(l, `2. Εισφορές ΕΦΚΑ ${pct(P.efka.employee_rate, l)} × 14`, `2. EFKA ${pct(P.efka.employee_rate, l)} × 14`), `−${$(s.efkaAnnual, l)}`],
          [T(l, '3. Φόρος κλίμακας', '3. Scale tax'), $(s.scaleAnnual, l)],
          [T(l, '4. Μείωση άρθρου 16', '4. Article 16 reduction'), `−${$(s.creditAnnual, l)}`],
          [T(l, '5. Φόρος έτους', '5. Tax for the year'), $(s.taxAnnual, l)],
        ] }; } }),
  /** Page FAQ : comparer le net du bulletin de paie au net calculé. */
  payslipcheck: (l) => ({ title: T(l, 'Σύγκριση με το εκκαθαριστικό σας', 'Check your payslip against the calculation'), cta: T(l, 'Πλήρης υπολογισμός μισθού', 'Full salary calculator'),
    inputs: [{ id: 'g', label: T(l, 'Μικτά στο εκκαθαριστικό', 'Gross on the payslip'), def: 1200, unit: '€', max: 1_000_000 }, { id: 'n', label: T(l, 'Καθαρά που πληρωθήκατε', 'Net you were paid'), def: Math.round(salary({ gross: 1200 }).net), unit: '€', max: 1_000_000 }, kids(l), { id: 'a', label: T(l, 'Ηλικία', 'Age'), def: 2, options: [{ value: '0', label: T(l, 'έως 25', 'up to 25') }, { value: '1', label: '26-30' }, { value: '2', label: '31+' }] }],
    run: ({ g, n, k, a }) => { const s = salary({ gross: g, children: k, age: AGE[a] ?? 'over30' }); const d = n - s.net;
      return { head: [T(l, 'Διαφορά από τον υπολογισμό', 'Difference from the calculation'), `${d > 0 ? '+' : d < 0 ? '−' : ''}${$(Math.abs(d), l)}`],
        rows: [[T(l, 'Αναμενόμενα καθαρά', 'Expected net'), $(s.net, l)], [T(l, 'Αναμενόμενες εισφορές ΕΦΚΑ', 'Expected EFKA'), $(s.efka, l)], [T(l, 'Αναμενόμενος ΦΜΥ', 'Expected tax withheld'), $(s.tax, l)]],
        note: Math.abs(d) <= 2 ? T(l, 'Διαφορά στρογγυλοποίησης: το εκκαθαριστικό συμφωνεί.', 'A rounding difference: the payslip matches.') : T(l, 'Ελέγξτε τέκνα, ηλικία, επιδόματα και κρατήσεις εκτός φόρου στο εκκαθαριστικό.', 'Check children, age, allowances and non-tax deductions on the payslip.') }; } }),
};
