/**
 * Valeurs citables dans les textes, toujours tirées des paramètres ou du moteur et formatées dans la
 * langue de la page (RECETTE §4, §17.4) : une page n'écrit jamais « 920 € » en dur, elle écrit
 * {F.minWage}. `facts(lang)` rend des chaînes prêtes à insérer.
 */
import { PARAMS as P, salary, minimumWage, severance, parentalBenefit, nationalPension } from './engine/gr';
import { formatMoney, formatDecimal, formatNumber, pct } from './format';

export function facts(lang: 'el' | 'en') {
  const m = (x: number, d = 0) => formatMoney(x, d, lang);
  const p = (x: number) => pct(x, lang);
  const T = P.tax;
  const minNet = salary({ gross: P.minimum_wage.monthly }).net;
  const sevCap = severance({ pay: 1, years: 1 }).cap;
  const par = parentalBenefit();
  const maxDev = Math.max(...P.minimum_wage.official_examples.map((e) => Math.abs(salary({ gross: e.gross, children: e.children }).net - e.net)));
  return {
    year: P.year,
    retrieved: P.retrieved_at,
    // ΕΦΚΑ
    efkaEe: p(P.efka.employee_rate), efkaEr: p(P.efka.employer_rate), efkaTotal: p(P.efka.employee_rate + P.efka.employer_rate),
    efkaHealthEe: p(P.efka.employee_health), efkaHealthEr: p(P.efka.employer_health), ceiling: m(P.efka.ceiling_monthly, 2), kpk: String(P.efka.kpk),
    // Κατώτατος μισθός
    minWage: m(P.minimum_wage.monthly), minWage2025: m(P.minimum_wage.monthly_2025), minDaily: m(P.minimum_wage.daily, 2),
    minNet: m(minNet), minIncrease: p(P.minimum_wage.monthly / P.minimum_wage.monthly_2025 - 1), minFrom: P.minimum_wage.valid_from,
    triennium: p(P.minimum_wage.triennium_rate), trienniumMax: String(P.minimum_wage.triennium_max), minWithT: (n: number) => m(minimumWage(n)),
    avgWage: m(P.minimum_wage.average_wage_2025),
    /** Écart maximal du moteur face aux 12 exemples officiels du ministère du Travail. */
    maxDev: m(maxDev, 2),
    // Κλίμακα
    r: T.brackets.map((b) => p(b.rate)), limits: T.brackets.map((b) => (b.upTo === null ? '' : m(b.upTo))),
    second: T.second_bracket_by_children.map(p), third: T.third_bracket_by_children.map(p), thirdStep: p(T.third_bracket_step_after_4),
    youthLimit: m(T.youth_income_limit), youthU25: p(T.youth_rate_u25), youth2630: p(T.youth_rate_26_30),
    credit: T.credit_by_children.map((c) => m(c)), creditStep: m(T.credit_step_after_5), creditThreshold: m(T.credit_taper_threshold), creditTaper: m(T.credit_taper_per_1000),
    // Δώρα
    leaveShare: p(P.bonuses.leave_share_in_holiday_bonus), xmasDays: String(P.bonuses.christmas_period_days), easterDays: String(P.bonuses.easter_period_days),
    xmasDaily: String(P.bonuses.christmas_daily_wages), easterDaily: String(P.bonuses.easter_daily_wages), leaveDaily: String(P.bonuses.leave_allowance_daily_wages),
    // Απόλυση
    sevCap: m(sevCap, 2), sevExtraCap: m(P.severance.extra_2012_salary_cap), sevDailyMonth: String(P.severance.daily_wages_per_month),
    // Γονική άδεια
    parentalMonthly: m(par.perMonth), parentalTotal: m(par.total), parentalMonths: String(P.parental.paid_months), parentalLeave: String(P.parental.leave_months),
    // Σύνταξη
    nationalFull: m(P.pension.national_full, 2), national15: m(nationalPension(15), 2), fullAge: String(P.pension.full_age), reducedAge: String(P.pension.reduced_age), minYears: String(P.pension.min_years),
    // ΕΝΦΙΑ
    insurance: p(P.enfia.insurance_reduction), insuranceHigh: p(P.enfia.insurance_reduction_high), village: p(P.enfia.small_settlement_reduction_2026),
    villagePop: formatNumber(P.enfia.small_settlement_population, 0, lang), villagePopBorder: formatNumber(P.enfia.small_settlement_population_border, 0, lang), villageValue: m(P.enfia.small_settlement_value_limit),
    // Outils
    dec: (x: number, d = 2) => formatDecimal(x, d, lang),
    num: (x: number) => formatNumber(x, 0, lang),
    pct: p,
    money: m,
  };
}
export type Facts = ReturnType<typeof facts>;
/** Source officielle du fichier de paramètres, prête pour la liste « Πηγές / Sources ». */
export function src(key: keyof typeof P.sources, lang: 'el' | 'en') { const s = P.sources[key]; return { name: s.label[lang], url: s.url }; }
