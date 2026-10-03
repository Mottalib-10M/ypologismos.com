/**
 * Moteur de calcul grec 2026 — fonctions pures, aucun appel réseau.
 * Tous les taux, seuils et montants viennent de `data/params-2026.json` (RECETTE §4, §17.4) :
 * aucune valeur légale n'est écrite ici en dur.
 *
 * Salaire : la paie grecque annualise (14 versements par défaut : 12 mois, Noël, Pâques,
 * allocation de congés), retient la cotisation e-ΕΦΚΑ du salarié (ΚΠΚ 101) plafonnée au
 * plafond mensuel, applique l'échelle de l'art. 15 ΚΦΕ (ν. 5246/2025) selon l'âge et le
 * nombre d'enfants, puis la réduction de l'art. 16 ΚΦΕ, et répartit l'impôt sur les versements
 * (art. 60 ΚΦΕ : « αναγωγή σε ετήσιο »). Validé contre les douze exemples officiels du
 * ministère du Travail (salaire minimum 2026, avec et sans triennies, 0 à 2 enfants).
 */
import P from '../../data/params-2026.json';

export const PARAMS = P;
const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
const pos = (x: number) => (x > 0 ? x : 0);
const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);

export type Age = 'u25' | '26_30' | 'over30';
export const AGES: Age[] = ['u25', '26_30', 'over30'];

/* ------------------------------------------------------------------------- *
 * Impôt sur le revenu salarial (art. 15 et 16 ΚΦΕ)
 * ------------------------------------------------------------------------- */

/** Taux de chaque tranche pour un contribuable donné (enfants à charge, âge). */
export function bracketRates(children = 0, age: Age = 'over30'): number[] {
  const T = P.tax;
  const c = Math.max(0, Math.floor(num(children)));
  const rates = T.brackets.map((b) => b.rate);
  // 2e tranche selon les enfants (art. 15 par. 1 β), 1re et 2e à 0 dès 4 enfants (γ).
  if (c >= 4) { rates[0] = T.four_children_first_two_brackets; rates[1] = T.four_children_first_two_brackets; }
  else rates[1] = T.second_bracket_by_children[c];
  // 3e tranche selon les enfants (δ), −2 points par enfant au-delà de 4 (δε).
  rates[2] = c <= 4 ? T.third_bracket_by_children[c] : pos(T.third_bracket_by_children[4] - T.third_bracket_step_after_4 * (c - 4));
  // Jeunes (ε) : les deux premières tranches à 0 % jusqu'à 25 ans, à 9 % de 26 à 30 ans ;
  // la règle la plus favorable l'emporte quand l'enfant donne déjà moins (γ pour 26-30).
  if (age === 'u25') { rates[0] = Math.min(rates[0], T.youth_rate_u25); rates[1] = Math.min(rates[1], T.youth_rate_u25); }
  if (age === '26_30') { rates[0] = Math.min(rates[0], T.youth_rate_26_30); rates[1] = Math.min(rates[1], T.youth_rate_26_30); }
  return rates;
}

/** Impôt de l'échelle, avant réduction, sur un revenu imposable annuel. */
export function scaleTax(taxable: number, children = 0, age: Age = 'over30'): number {
  const rates = bracketRates(children, age);
  let tax = 0, lower = 0;
  P.tax.brackets.forEach((b, i) => {
    const upper = b.upTo ?? Infinity;
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rates[i];
    lower = upper;
  });
  return tax;
}

/** Réduction d'impôt de l'art. 16 ΚΦΕ avant plafonnement à l'impôt dû. */
export function taxCredit(taxable: number, children = 0): number {
  const T = P.tax;
  const c = Math.max(0, Math.floor(num(children)));
  const base = c < T.credit_by_children.length ? T.credit_by_children[c] : T.credit_by_children[T.credit_by_children.length - 1] + T.credit_step_after_5 * (c - (T.credit_by_children.length - 1));
  if (c >= T.credit_no_taper_from_children) return base;
  const taper = pos(taxable - T.credit_taper_threshold) * T.credit_taper_per_1000 / 1000;
  return pos(base - taper);
}

export interface TaxResult { scale: number; credit: number; tax: number; rates: number[]; marginal: number; average: number }
export function incomeTax(taxable: number, children = 0, age: Age = 'over30'): TaxResult {
  const t = pos(num(taxable));
  const scale = scaleTax(t, children, age);
  const credit = Math.min(scale, taxCredit(t, children));
  const tax = pos(scale - credit);
  const rates = bracketRates(children, age);
  let marginal = rates[rates.length - 1];
  for (let i = 0, lower = 0; i < P.tax.brackets.length; i++) { const u = P.tax.brackets[i].upTo ?? Infinity; if (t <= u) { marginal = rates[i]; break; } lower = u; void lower; }
  return { scale, credit, tax, rates, marginal, average: t > 0 ? tax / t : 0 };
}

/* ------------------------------------------------------------------------- *
 * Salaire brut → net
 * ------------------------------------------------------------------------- */
export interface SalaryInput {
  /** Brut de chaque versement (mensuel). */
  gross: number;
  /** Nombre de versements dans l'année : 14 (12 + δώρα + επίδομα αδείας) ou 12. */
  payments?: number;
  children?: number;
  age?: Age;
}
export interface SalaryResult {
  gross: number; payments: number; annualGross: number;
  efka: number; efkaAnnual: number; taxable: number; taxableAnnual: number;
  tax: number; taxAnnual: number; scaleAnnual: number; creditAnnual: number;
  net: number; netAnnual: number; netPer12: number;
  employer: number; employerAnnual: number; cost: number; costAnnual: number;
  marginal: number; averageTax: number; capped: boolean; rates: number[];
}

export function salary(input: SalaryInput): SalaryResult {
  const gross = pos(num(input.gross));
  const payments = num(input.payments, 14) === 12 ? 12 : 14;
  const E = P.efka;
  const insurable = Math.min(gross, E.ceiling_monthly);
  const efka = insurable * E.employee_rate;
  const annualGross = gross * payments;
  const efkaAnnual = efka * payments;
  const taxableAnnual = annualGross - efkaAnnual;
  const t = incomeTax(taxableAnnual, input.children ?? 0, input.age ?? 'over30');
  const employer = insurable * E.employer_rate;
  return {
    gross, payments, annualGross,
    efka: r2(efka), efkaAnnual: r2(efkaAnnual),
    taxable: (gross - efka), taxableAnnual,
    tax: t.tax / payments, taxAnnual: t.tax, scaleAnnual: t.scale, creditAnnual: t.credit,
    net: (annualGross - efkaAnnual - t.tax) / payments,
    netAnnual: annualGross - efkaAnnual - t.tax,
    netPer12: (annualGross - efkaAnnual - t.tax) / 12,
    employer, employerAnnual: employer * payments, cost: gross + employer, costAnnual: (gross + employer) * payments,
    marginal: t.marginal, averageTax: t.average, capped: gross > E.ceiling_monthly, rates: t.rates,
  };
}

/** Brut nécessaire pour obtenir un net par versement donné (recherche par dichotomie). */
export function grossForNet(net: number, opts: Omit<SalaryInput, 'gross'> = {}): number {
  const target = pos(num(net));
  if (target === 0) return 0;
  let lo = target, hi = target * 3 + 1000;
  while (salary({ ...opts, gross: hi }).net < target) hi *= 2;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (salary({ ...opts, gross: mid }).net < target) lo = mid; else hi = mid; }
  return r2(hi);
}

/** Net d'un montant versé une fois (prime, δώρο) au taux moyen de l'année du salarié. */
export function bonusNet(bonus: number, base: SalaryInput) {
  const b = pos(num(bonus));
  const s = salary(base);
  const efka = Math.min(b, P.efka.ceiling_monthly) * P.efka.employee_rate;
  const tax = (b - efka) * s.averageTax;
  return { bonus: b, efka, tax, net: b - efka - tax, averageTax: s.averageTax };
}

/** Salaire minimum avec triennies (+10 % par triennie, trois au plus pour le minimum légal). */
export function minimumWage(trienniums = 0): number {
  const n = Math.min(P.minimum_wage.triennium_max, Math.max(0, Math.floor(num(trienniums))));
  return r2(P.minimum_wage.monthly * (1 + P.minimum_wage.triennium_rate * n));
}

/* ------------------------------------------------------------------------- *
 * Δώρα εορτών et επίδομα αδείας (Inspection du travail, ΚΥΑ 19040/1981, α.ν. 539/1945)
 * ------------------------------------------------------------------------- */
export interface BonusInput {
  /** Salaire mensuel, ou salaire journalier si `daily`. */
  pay: number;
  daily?: boolean;
  /** Jours calendaires de relation de travail dans la période (défaut : période entière). */
  days?: number;
}
export interface BonusResult { amount: number; base: number; share: number; leaveShare: number; full: boolean; days: number; periodDays: number }

const leaveUplift = () => P.bonuses.leave_share_in_holiday_bonus;

export function christmasBonus(input: BonusInput): BonusResult {
  const B = P.bonuses;
  const periodDays = B.christmas_period_days;
  const days = Math.min(periodDays, pos(num(input.days, periodDays)));
  const pay = pos(num(input.pay));
  const fullBase = input.daily ? pay * B.christmas_daily_wages : pay * B.christmas_months;
  const perStep = input.daily ? pay * 2 : pay * B.christmas_prorata_numerator / B.christmas_prorata_denominator;
  const base = days >= periodDays ? fullBase : Math.min(fullBase, perStep * days / B.christmas_prorata_days);
  const leaveShare = base * leaveUplift();
  return { amount: base + leaveShare, base, share: fullBase > 0 ? base / fullBase : 0, leaveShare, full: days >= periodDays, days, periodDays };
}

export function easterBonus(input: BonusInput): BonusResult {
  const B = P.bonuses;
  const periodDays = B.easter_period_days;
  const days = Math.min(periodDays, pos(num(input.days, periodDays)));
  const pay = pos(num(input.pay));
  const fullBase = input.daily ? pay * B.easter_daily_wages : pay * B.easter_months;
  const perStep = input.daily ? pay : fullBase / 15;
  const base = days >= periodDays ? fullBase : Math.min(fullBase, perStep * days / B.easter_prorata_days);
  const leaveShare = base * leaveUplift();
  return { amount: base + leaveShare, base, share: fullBase > 0 ? base / fullBase : 0, leaveShare, full: days >= periodDays, days, periodDays };
}

/** Allocation de congés : plafonnée à ½ salaire mensuel (13 salaires journaliers) ;
 *  au prorata des mois travaillés dans l'année quand le droit au congé est partiel. */
export function leaveAllowance(input: { pay: number; daily?: boolean; months?: number }) {
  const B = P.bonuses;
  const pay = pos(num(input.pay));
  const months = Math.min(12, pos(num(input.months, 12)));
  const cap = input.daily ? pay * B.leave_allowance_daily_wages : pay * B.leave_allowance_months;
  return { amount: cap * months / 12, cap, months };
}

/* ------------------------------------------------------------------------- *
 * Indemnité de licenciement (ν. 4093/2012, ν. 3198/1955 art. 5, ν. 4808/2021 art. 64)
 * ------------------------------------------------------------------------- */
export interface SeveranceInput {
  /** Salaire mensuel régulier (ou journalier si `daily`). */
  pay: number;
  daily?: boolean;
  /** Années complètes chez le même employeur. */
  years: number;
  /** Préavis écrit donné : l'indemnité est réduite de moitié. */
  notice?: boolean;
  /** Années complètes au 12-11-2012 (supplément des anciens employés, ≥ 17 ans). */
  yearsAt2012?: number;
  /** Ajouter 1/6 pour la part des δώρα et de l'allocation de congés (défaut : oui). */
  uplift?: boolean;
}
export interface SeveranceResult {
  months: number; extraMonths: number; monthly: number; monthlyCapped: number; cap: number; capped: boolean;
  base: number; extra: number; uplift: number; total: number; noticeMonths: number; eligible: boolean; withNotice: boolean;
}

export function severanceMonths(years: number): number {
  const y = Math.floor(pos(num(years)));
  let m = 0;
  for (const row of P.severance.table_months) if (y >= row.fromYears) m = row.months;
  return m;
}
export function noticeMonths(years: number): number {
  const y = Math.floor(pos(num(years)));
  let m = 0;
  for (const row of P.severance.notice_months) if (y >= row.fromYears) m = row.months;
  return m;
}
export function extra2012Months(yearsAt2012: number): number {
  const S = P.severance;
  const y = Math.floor(pos(num(yearsAt2012)));
  return y >= S.extra_2012_from_years ? Math.min(S.extra_2012_max_months, y - S.extra_2012_from_years + 1) : 0;
}

export function severance(input: SeveranceInput): SeveranceResult {
  const S = P.severance;
  const pay = pos(num(input.pay));
  const monthly = input.daily ? pay * S.daily_wages_per_month : pay;
  const cap = S.cap_daily_multiple * P.minimum_wage.daily * S.cap_days;
  const monthlyCapped = Math.min(monthly, cap);
  const months = severanceMonths(input.years);
  const extraMonths = extra2012Months(input.yearsAt2012 ?? 0);
  const factor = input.notice ? S.with_notice_factor : 1;
  const base = monthlyCapped * months * factor;
  const extra = Math.min(monthlyCapped, S.extra_2012_salary_cap) * extraMonths * factor;
  const upliftRate = input.uplift === false ? 0 : S.holiday_uplift;
  const uplift = (base + extra) * upliftRate;
  return {
    months, extraMonths, monthly, monthlyCapped, cap, capped: monthly > cap,
    base, extra, uplift, total: base + extra + uplift, noticeMonths: noticeMonths(input.years),
    eligible: months > 0, withNotice: !!input.notice,
  };
}

/* ------------------------------------------------------------------------- *
 * Τέλη κυκλοφορίας (ν. 2948/2001 art. 20)
 * ------------------------------------------------------------------------- */
export type RoadCategory = 'cc_until_2000' | 'cc_2001_2005' | 'cc_from_2006' | 'co2_nedc' | 'co2_wltp' | 'electric';
export const ROAD_CATEGORIES: RoadCategory[] = ['cc_until_2000', 'cc_2001_2005', 'cc_from_2006', 'co2_nedc', 'co2_wltp', 'electric'];

export interface RoadTaxResult { amount: number; method: 'cc' | 'co2' | 'exempt'; rate: number; band: number; bandLabel: string }

export function ccBandIndex(cc: number): number {
  const c = pos(num(cc));
  const i = P.road_tax.cc_bands.findIndex((u) => c <= u);
  return i === -1 ? P.road_tax.cc_bands.length : i;
}
export function co2Band(co2: number, table: 'co2_nedc' | 'co2_wltp') {
  const g = Math.round(pos(num(co2)));
  const rows = P.road_tax[table];
  const i = rows.findIndex((r) => r.upTo === null || g <= r.upTo);
  return { index: i, rate: rows[i].rate, from: i === 0 ? 0 : (rows[i - 1].upTo as number) + 1, to: rows[i].upTo };
}

export function roadTax(input: { category: RoadCategory; cc?: number; co2?: number }): RoadTaxResult {
  const R = P.road_tax;
  if (input.category === 'electric') return { amount: 0, method: 'exempt', rate: 0, band: 0, bandLabel: '' };
  if (input.category === 'co2_nedc' || input.category === 'co2_wltp') {
    const g = Math.round(pos(num(input.co2)));
    const b = co2Band(g, input.category);
    return { amount: r2(g * b.rate), method: 'co2', rate: b.rate, band: b.index, bandLabel: `${b.from}–${b.to ?? '+'}` };
  }
  const i = ccBandIndex(input.cc ?? 0);
  const table = R[input.category] as number[];
  const lower = i === 0 ? 0 : R.cc_bands[i - 1] + 1;
  const upper = i < R.cc_bands.length ? R.cc_bands[i] : null;
  return { amount: table[i], method: 'cc', rate: 0, band: i, bandLabel: `${lower}–${upper ?? '+'}` };
}

/** Catégorie à partir de la date de première immatriculation dans l'UE/EEE. */
export function roadCategoryFor(year: number, month = 12, electric = false): RoadCategory {
  if (electric) return 'electric';
  if (year <= 2000) return 'cc_until_2000';
  if (year <= 2005) return 'cc_2001_2005';
  if (year < 2010 || (year === 2010 && month <= 10)) return 'cc_from_2006';
  if (year <= 2020) return 'co2_nedc';
  return 'co2_wltp';
}

/* ------------------------------------------------------------------------- *
 * ΕΝΦΙΑ — impôt principal d'un bâtiment (ΚΦΠ art. 11, 13, 10, 17)
 * ------------------------------------------------------------------------- */
export type Floor = 'basement' | 'ground_1' | 'f2_3' | 'f4_5' | 'f6_up';
export const FLOORS: Floor[] = ['basement', 'ground_1', 'f2_3', 'f4_5', 'f6_up'];
export interface EnfiaInput {
  sqm: number;
  zonePrice: number;
  /** Année de la plus récente autorisation de construire (ou de construction). */
  buildYear: number;
  floor?: Floor;
  detached?: boolean;
  facades?: number;
  /** Quote-part de propriété, en fraction (1 = 100 %). */
  share?: number;
  /** Surfaces auxiliaires (parking couvert, cave, débarras), m². */
  auxSqm?: number;
  /** Valeur totale de tout le patrimoine immobilier soumis (Ε9). Défaut : m² × prix de zone × part. */
  totalValue?: number;
  /** Logement assuré contre séisme, incendie et inondation toute l'année précédente. */
  insured?: boolean;
  /** Résidence principale dans une localité ≤ 1 500 habitants (hors Attique), valeur ≤ 400 000 €. */
  smallSettlement?: boolean;
  /** Année d'imposition (défaut : année des paramètres). */
  taxYear?: number;
}
export interface EnfiaResult {
  basicRate: number; zoneBand: number; ageYears: number; ageFactor: number; positionFactor: number; facadeFactor: number;
  mainBuilding: number; auxiliary: number; rightTax: number; principal: number; estimatedValue: number; valueUsed: number;
  surchargeRate: number; valueReductionRate: number; insuranceRate: number; smallSettlementRate: number; total: number;
}

export function enfiaBasicRate(zonePrice: number) {
  const z = pos(num(zonePrice));
  const rows = P.enfia.zone_bands;
  const i = rows.findIndex((r) => r.upTo === null || z <= r.upTo);
  return { index: i, rate: rows[i].rate };
}
export function enfiaAgeFactor(buildYear: number, taxYear = P.year) {
  const E = P.enfia;
  const y = Math.floor(num(buildYear, taxYear));
  const age = pos(taxYear - y);
  if (age > 100) return { age, factor: E.age_factor_over_100 };
  if (y < 1930) return { age, factor: E.age_factor_pre_1930 };
  const row = E.age_factors.find((r) => r.maxYears === null || age <= r.maxYears)!;
  return { age, factor: row.factor };
}
const pickRate = (rows: Array<{ upTo: number | null; rate: number }>, v: number) => rows.find((r) => r.upTo === null || v <= r.upTo)?.rate ?? 0;

export function enfia(input: EnfiaInput): EnfiaResult {
  const E = P.enfia;
  const sqm = pos(num(input.sqm));
  const aux = pos(num(input.auxSqm));
  const share = Math.min(1, pos(num(input.share, 1)));
  const b = enfiaBasicRate(input.zonePrice);
  const a = enfiaAgeFactor(input.buildYear, input.taxYear ?? P.year);
  const positionFactor = input.detached ? E.detached_factor : E.floor_factors[input.floor ?? 'ground_1'];
  const facadeFactor = input.detached ? E.facade_factors[Math.min(2, Math.max(0, Math.floor(num(input.facades, 1))))] : E.facade_factors[Math.min(2, Math.max(0, Math.floor(num(input.facades, 1))))];
  const mainBuilding = sqm * b.rate * a.factor * positionFactor * facadeFactor * share;
  const auxiliary = aux * b.rate * a.factor * positionFactor * E.auxiliary_factor * share;
  const estimatedValue = sqm * pos(num(input.zonePrice)) * share;
  const valueUsed = input.totalValue && input.totalValue > 0 ? input.totalValue : estimatedValue;
  // Ενότητα Γ : impôt sur la valeur totale du droit, seulement au-delà de 300 000 € de patrimoine.
  let rightTax = 0;
  if (valueUsed > E.right_tax_from_value) {
    const full = share > 0 ? valueUsed / share : 0;
    let lower = 0;
    for (const r of E.right_tax_bands) { const u = r.upTo ?? Infinity; if (full > lower) rightTax += (Math.min(full, u) - lower) * r.rate; lower = u; }
    rightTax *= share;
  }
  const principal = mainBuilding + auxiliary + rightTax;
  const surchargeRate = valueUsed > E.surcharge_from_value ? pickRate(E.value_surcharges, valueUsed) : 0;
  const reductionRow = E.value_reductions.find((r) => valueUsed <= r.upTo);
  const valueReductionRate = reductionRow ? reductionRow.rate : 0;
  // Les plafonds de l'assurance (art. 10 par. 5) et des petites localités (art. 17 par. 3) visent la valeur du
  // logement lui-même, en pleine propriété, et non le patrimoine total : estimée ici m² × prix de zone.
  const homeValue = sqm * pos(num(input.zonePrice));
  const insuranceRate = input.insured ? (homeValue <= E.insurance_value_limit ? E.insurance_reduction : E.insurance_reduction_high) : 0;
  const smallSettlementRate = input.smallSettlement && homeValue <= E.small_settlement_value_limit ? E.small_settlement_reduction_2026 : 0;
  const total = principal * (1 + surchargeRate) * (1 - valueReductionRate) * (1 - insuranceRate) * (1 - smallSettlementRate);
  return {
    basicRate: b.rate, zoneBand: b.index, ageYears: a.age, ageFactor: a.factor, positionFactor, facadeFactor,
    mainBuilding, auxiliary, rightTax, principal, estimatedValue, valueUsed,
    surchargeRate, valueReductionRate, insuranceRate, smallSettlementRate, total,
  };
}

/* ------------------------------------------------------------------------- *
 * Σύνταξη (ν. 4387/2016 art. 7 et 8, tableau 2 depuis le 1-10-2019)
 * ------------------------------------------------------------------------- */
export function replacementRate(years: number): number {
  const y = Math.floor(pos(num(years)));
  let total = 0, lower = 0;
  for (const r of P.pension.replacement_rates) {
    const u = r.upTo ?? Infinity;
    if (y > lower) total += (Math.min(y, u) - lower) * r.rate;
    lower = u;
  }
  return total;
}
export function nationalPension(years: number, residenceYears = P.pension.residence_years_full): number {
  const Q = P.pension;
  const y = Math.floor(pos(num(years)));
  if (y <= 0) return 0;
  const yy = Math.max(Q.national_min_years, Math.min(Q.national_years_full, y));
  const insuranceFactor = 1 - Q.national_reduction_per_year * (Q.national_years_full - yy);
  // Art. 7 par. 2 : au moins 15 ans de résidence entre 15 ans et l'âge de la pension, sinon aucune pension nationale.
  if (pos(num(residenceYears)) < Q.residence_min_years) return 0;
  const residenceFactor = Math.min(1, pos(num(residenceYears)) / Q.residence_years_full);
  return Q.national_full * insuranceFactor * residenceFactor;
}
export function pension(input: { years: number; avgEarnings: number; residenceYears?: number }) {
  const avg = pos(num(input.avgEarnings));
  const rate = replacementRate(input.years);
  const contributory = Math.min(avg, avg * rate);
  const national = nationalPension(input.years, input.residenceYears);
  return { rate, contributory, national, total: contributory + national, eligible: Math.floor(pos(num(input.years))) >= P.pension.min_years };
}

/* ------------------------------------------------------------------------- *
 * Επίδομα γονικής άδειας (ν. 4808/2021 art. 28)
 * ------------------------------------------------------------------------- */
export function parentalBenefit(opts: { single?: boolean; multiple?: boolean } = {}) {
  const Q = P.parental;
  const months = Q.paid_months * (opts.single ? 2 : 1) + (opts.multiple ? Q.paid_months : 0);
  const monthly = P.minimum_wage.monthly;
  const holiday = monthly * P.severance.holiday_uplift;
  return { months, monthly, holiday, perMonth: monthly + holiday, total: (monthly + holiday) * months };
}
