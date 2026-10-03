/** Mini-simulateurs supplémentaires du lot « c » (RECETTE §9.3). Même forme que lib/mini-specs.ts. */
import { salary, christmasBonus, easterBonus, leaveAllowance, parentalBenefit, PARAMS as P } from './engine/gr';
import { formatMoney, pct } from './format';
import type { MiniSpec } from './mini-types';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
/** Majoration des heures au-delà de l'horaire convenu à temps partiel (FAQ du ministère du Travail,
 *  src('severance_faq')) : absente de params-2026.json, posée ici et réutilisée par les pages du lot. */
export const PART_TIME_EXTRA = 0.12;
/** Plafond e-ΕΦΚΑ : montant d'origine (ν. 4387/2016 art. 38 par. 2) et indexation 2026 sur l'indice
 *  des prix 2025 (circulaire 4/2026, src('efka_ceiling')). Le plafond 2026 lui-même vient de PARAMS. */
export const CEILING_BASE_2016 = 6500;
export const CEILING_INDEX_2026 = 0.025;
const full = (l: L) => T(l, 'Πλήρης υπολογισμός μισθού', 'Full salary calculator');

export const EXTRA_C: Record<string, (l: L) => MiniSpec> = {
  /** Plafond : ce que l'employeur ne paie pas au-delà du plafond, et son coût total. */
  ceilingcost: (l) => ({ title: T(l, 'Το πλαφόν από την πλευρά του εργοδότη', 'The ceiling seen from the employer’s side'), cta: T(l, 'Κόστος εργοδότη', 'Employer cost'),
    inputs: [{ id: 'g', label: T(l, 'Μικτός μηνιαίος μισθός', 'Monthly gross salary'), def: 10000, unit: '€', max: 1_000_000 }],
    run: ({ g }) => { const s = salary({ gross: g }); const noCap = g * P.efka.employer_rate;
      return { head: [T(l, 'Εργοδοτικές εισφορές που δεν οφείλονται τον χρόνο (14)', 'Employer contributions not due per year (14)'), $(Math.max(0, noCap - s.employer) * 14, l)],
        rows: [[T(l, 'Εργοδοτικές εισφορές ανά καταβολή', 'Employer contributions per payment'), $(s.employer, l)], [T(l, 'Κόστος ανά καταβολή', 'Cost per payment'), $(s.cost, l)], [T(l, 'Εισφορές ως ποσοστό του μικτού', 'Contributions as a share of gross'), pct(Math.round((g > 0 ? s.employer / g : 0) * 1000) / 1000, l)]] }; } }),
  /** 14 versements : la ventilation de l'année à partir du brut mensuel. */
  fourteensplit: (l) => ({ title: T(l, 'Οι 14 καταβολές της χρονιάς σας', 'Your fourteen payments, one by one'), cta: full(l),
    inputs: [{ id: 'g', label: T(l, 'Μικτός μηνιαίος μισθός', 'Monthly gross salary'), def: 1400, unit: '€', max: 1_000_000 }],
    run: ({ g }) => { const x = christmasBonus({ pay: g }).amount, e = easterBonus({ pay: g }).amount, a = leaveAllowance({ pay: g }).amount;
      return { head: [T(l, 'Μικτά τον χρόνο', 'Gross per year'), $(g * 12 + x + e + a, l)],
        rows: [[T(l, '12 μισθοί', '12 salaries'), $(g * 12, l)], [T(l, 'Δώρο Χριστουγέννων', 'Christmas bonus'), $(x, l)], [T(l, 'Δώρο Πάσχα', 'Easter bonus'), $(e, l)], [T(l, 'Επίδομα αδείας', 'Leave allowance'), $(a, l)]] }; } }),
  /** Temps partiel : heures au-delà de l'horaire convenu, majorées de 12 %. */
  ptextra: (l) => ({ title: T(l, 'Οι επιπλέον ώρες της μερικής απασχόλησης', 'Extra hours on a part-time contract'), cta: full(l),
    inputs: [{ id: 'r', label: T(l, 'Συμφωνημένη αμοιβή ανά ώρα', 'Agreed pay per hour'), def: 7, unit: '€', max: 1000, decimals: 2 }, { id: 'h', label: T(l, 'Επιπλέον ώρες τον μήνα', 'Extra hours in the month'), def: 10, unit: 'h', max: 200 }],
    run: ({ r, h }) => { const plus = r * (1 + PART_TIME_EXTRA);
      return { head: [T(l, 'Μικτή αμοιβή επιπλέον ωρών', 'Gross pay for the extra hours'), $2(plus * h, l)],
        rows: [[T(l, 'Ανά επιπλέον ώρα', 'Per extra hour'), $2(plus, l)], [T(l, 'Χωρίς την προσαύξηση', 'Without the premium'), $2(r * h, l)], [T(l, 'Διαφορά της προσαύξησης', 'Value of the premium'), $2((plus - r) * h, l)]] }; } }),
  /** Journalier : les δώρα et l'allocation de congés exprimés en salaires journaliers. */
  dailybonus: (l) => ({ title: T(l, 'Δώρα και επίδομα αδείας σε ημερομίσθια', 'Bonuses and leave allowance in daily wages'), cta: T(l, 'Πλήρης υπολογιστής δώρου', 'Full bonus calculator'),
    inputs: [{ id: 'd', label: T(l, 'Ημερομίσθιο', 'Daily wage'), def: P.minimum_wage.daily, unit: '€', max: 10000, decimals: 2 }],
    run: ({ d }) => { const x = christmasBonus({ pay: d, daily: true }).amount, e = easterBonus({ pay: d, daily: true }).amount, a = leaveAllowance({ pay: d, daily: true }).amount;
      return { head: [T(l, 'Σύνολο τον χρόνο', 'Total per year'), $(x + e + a, l)],
        rows: [[T(l, `Δώρο Χριστουγέννων (${P.bonuses.christmas_daily_wages} ημ.)`, `Christmas bonus (${P.bonuses.christmas_daily_wages} days)`), $(x, l)], [T(l, `Δώρο Πάσχα (${P.bonuses.easter_daily_wages} ημ.)`, `Easter bonus (${P.bonuses.easter_daily_wages} days)`), $(e, l)], [T(l, `Επίδομα αδείας (${P.bonuses.leave_allowance_daily_wages} ημ.)`, `Leave allowance (${P.bonuses.leave_allowance_daily_wages} days)`), $(a, l)]] }; } }),
  /** Congé parental : l'allocation ΔΥΠΑ face au salaire habituel. */
  parentalgap: (l) => ({ title: T(l, 'Επίδομα ΔΥΠΑ ή μισθός: η διαφορά', 'DYPA benefit or salary: the gap'), cta: full(l),
    inputs: [{ id: 'g', label: T(l, 'Ο μικτός μηνιαίος μισθός σας', 'Your monthly gross salary'), def: 1500, unit: '€', max: 1_000_000 }],
    run: ({ g }) => { const b = parentalBenefit(); const own = g * (1 + P.severance.holiday_uplift);
      return { head: [T(l, 'Διαφορά για τους 2 επιδοτούμενους μήνες', 'Gap over the 2 paid months'), $((own - b.perMonth) * b.months, l)],
        rows: [[T(l, 'Επίδομα ανά μήνα (μικτό)', 'Benefit per month (gross)'), $(b.perMonth, l)], [T(l, 'Μισθός με αναλογία δώρων ανά μήνα', 'Salary with bonus share per month'), $(own, l)], [T(l, 'Το επίδομα καλύπτει', 'The benefit covers'), pct(Math.round(own > 0 ? b.perMonth / own * 100 : 0) / 100, l)]] }; } }),
};
