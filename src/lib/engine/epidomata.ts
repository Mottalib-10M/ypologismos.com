/**
 * Aides sociales grecques (επιδόματα) — fonctions pures, paramètres dans `data/params-2026.json`,
 * chacun relu sur sa source officielle (OPEKA, ΔΥΠΑ, e-ΕΦΚΑ, ΑΑΔΕ via ΦΕΚ, ministère de l'Éducation).
 *
 *  - Επίδομα παιδιού Α21 (art. 214 ν. 4512/2018) et allocation de naissance (ν. 4659/2020)
 *  - Επίδομα στέγασης (art. 3 ν. 4472/2017, ΚΥΑ Δ13οικ.10747/256/2019)
 *  - Επίδομα θέρμανσης 2025-2026 (ΚΥΑ Α.1151/2025 et Α.1116/2026) : montant de référence × ΣΟ-Μ
 *  - Επίδομα ανεργίας (circulaire ΔΥΠΑ 280487/2026)
 *  - Επιστροφή ενοικίου (art. 70 ν. 5217/2025, plafonds de revenu 2026 de la circ. Ε.3029/2026)
 *  - Ειδική παροχή μητρότητας ΔΥΠΑ, φοιτητικό στεγαστικό επίδομα, σύνταξη χηρείας (art. 12 ν. 4387/2016)
 */
import { PARAMS as P } from './gr';

const pos = (x: number) => (x > 0 ? x : 0);
const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
const int = (x: unknown) => Math.max(0, Math.floor(num(x)));

/* ------------------------------------------------------------------------- *
 * Επίδομα παιδιού Α21
 * ------------------------------------------------------------------------- */
/** Échelle d'équivalence (art. 214 par. 4) : 1 + ½ pour le second parent + ¼ par enfant ;
 *  famille monoparentale : ½ pour le premier enfant. */
export function equivalenceScale(parents: number, children: number): number {
  const W = P.child_benefit.weights;
  const c = int(children);
  if (parents >= 2) return W.parent1 + W.parent2 + c * W.child;
  return W.parent1 + (c > 0 ? W.single_first_child + (c - 1) * W.child : 0);
}
export interface ChildBenefitResult { scale: number; equivalent: number; category: number; perChild: number[]; monthly: number; installment: number; annual: number; nextLimit: number | null }
/** Catégorie 0 = Α (≤ 6 000 €), 1 = Β, 2 = Γ ; −1 = pas de droit (au-delà de 15 000 €). */
export function childBenefit(input: { income: number; parents?: number; children: number }): ChildBenefitResult {
  const C = P.child_benefit;
  const parents = num(input.parents, 2) >= 2 ? 2 : 1;
  const c = int(input.children);
  const scale = equivalenceScale(parents, c);
  const equivalent = pos(num(input.income)) / scale;
  const category = c === 0 ? -1 : C.categories.findIndex((k) => equivalent <= k.upTo);
  const k = category >= 0 ? C.categories[category] : null;
  const perChild = Array.from({ length: c }, (_, i) => (k ? (i < 2 ? k.first_two : k.third_plus) : 0));
  const monthly = perChild.reduce((s, x) => s + x, 0);
  const nextLimit = k ? k.upTo * scale : null;
  return { scale, equivalent, category, perChild, monthly, installment: monthly * 12 / C.installments_per_year, annual: monthly * 12, nextLimit };
}
/** Revenu familial maximal qui garde une catégorie, pour une famille donnée. */
export function childBenefitLimits(parents: number, children: number): number[] {
  const s = equivalenceScale(parents, children);
  return P.child_benefit.categories.map((k) => k.upTo * s);
}

/** Allocation de naissance (ν. 4659/2020 art. 1, 2, 5) selon le rang de l'enfant. */
export function birthAllowance(rank: number) {
  const B = P.birth_allowance;
  const r = Math.max(1, int(rank));
  const amount = B.amounts[Math.min(r, B.amounts.length) - 1];
  return { amount, installment: amount / B.installments, limit: B.equivalent_income_limit };
}

/* ------------------------------------------------------------------------- *
 * Επίδομα στέγασης
 * ------------------------------------------------------------------------- */
export interface HousingInput { members: number; singleParent?: boolean; unprotected?: number; rent: number; income?: number; property?: number; deposits?: number }
export function housingBenefit(input: HousingInput) {
  const H = P.housing_benefit;
  const n = Math.max(1, int(input.members));
  const extra = (input.singleParent && n > 1 ? 1 : 0) + int(input.unprotected);
  const gross = Math.min(H.max, H.base + H.per_member * (n - 1) + H.single_parent_extra * extra);
  const amount = Math.min(gross, pos(num(input.rent)));
  const incomeLimit = Math.min(H.income_max, H.income_base + H.income_per_member * (n - 1 + extra));
  const propertyLimit = Math.min(H.property_max, H.property_base + H.property_per_member * (n - 1));
  const depositsLimit = Math.min(H.deposits_max, H.deposits_base + H.deposits_per_member * (n - 1));
  const incomeOk = pos(num(input.income)) <= incomeLimit;
  const propertyOk = pos(num(input.property)) <= propertyLimit;
  const depositsOk = pos(num(input.deposits)) <= depositsLimit;
  const eligible = incomeOk && propertyOk && depositsOk;
  return { gross, amount: eligible ? amount : 0, cappedByRent: amount < gross, incomeLimit, propertyLimit, depositsLimit, incomeOk, propertyOk, depositsOk, eligible, annual: (eligible ? amount : 0) * 12 };
}

/* ------------------------------------------------------------------------- *
 * Επίδομα θέρμανσης 2025-2026
 * ------------------------------------------------------------------------- */
export type Fuel = 'oil' | 'gas' | 'electricity' | 'pellet' | 'wood' | 'district';
export const FUELS: Fuel[] = ['oil', 'gas', 'electricity', 'pellet', 'wood', 'district'];
export interface HeatingInput { fuel: Fuel; som: number; children?: number; purchases?: number }
/**
 * Montant (ΚΥΑ Α.1151/2025 art. 3 par. 2-3) : référence × (1 + 20 % par enfant) × ΣΟ-Μ, borné à
 * [100 ; 800] ; +25 % (plafond 1 000 €) si ΣΟ-Μ ≥ 1 ; « επιπλέον 25 % » (plafond 1 200 €) si
 * ΣΟ-Μ ≥ 1,2. Le texte ne dit pas si ce second 25 % porte sur le montant initial ou sur le montant
 * déjà majoré : `amount` retient la lecture additive (× 1,5), `amountHigh` la lecture composée
 * (× 1,5625) ; les deux ne diffèrent que sous le plafond, dans les localités ΣΟ-Μ ≥ 1,2.
 * Si les achats déclarés sont inférieurs au double, l'aide vaut la moitié des achats (min. 100 €).
 */
export function heatingAllowance(input: HeatingInput) {
  const H = P.heating;
  const ref = H.reference[input.fuel] ?? H.reference.oil;
  const kids = int(input.children);
  const som = pos(num(input.som));
  const raw = ref * (1 + H.child_uplift * kids) * som;
  const base = Math.min(H.max, Math.max(H.min, raw));
  let amount = base, amountHigh = base, band = 0;
  if (som >= H.very_cold_threshold) { band = 2; amount = Math.min(H.very_cold_max, base * (1 + H.cold_uplift + H.very_cold_uplift)); amountHigh = Math.min(H.very_cold_max, Math.min(H.cold_max, base * (1 + H.cold_uplift)) * (1 + H.very_cold_uplift)); }
  else if (som >= H.cold_threshold) { band = 1; amount = amountHigh = Math.min(H.cold_max, base * (1 + H.cold_uplift)); }
  const needed = amount * H.purchase_multiple;
  const purchases = input.purchases === undefined ? needed : pos(num(input.purchases));
  const short = purchases < needed;
  const final = short ? Math.max(H.min, purchases / 2) : amount;
  const finalHigh = short ? Math.max(H.min, Math.min(amountHigh, purchases / 2)) : amountHigh;
  return { ref, raw, base, band, amount, amountHigh, needed, short, final: Math.min(final, amount), finalHigh, litres: input.fuel === 'oil' ? needed / H.oil_price_per_litre : 0 };
}
/** Acompte de décembre d'un nouveau bénéficiaire : 50 % × référence × ΣΚ, +20 % par enfant, min 80 €. */
export function heatingAdvanceNew(fuel: Fuel, sk: number, children = 0) {
  const H = P.heating;
  return Math.max(H.advance_min, H.advance_new_share * (H.reference[fuel] ?? H.reference.oil) * pos(num(sk)) * (1 + H.child_uplift * int(children)));
}
export type Household = 'single' | 'couple' | 'singleParent';
/** Plafonds de revenu et de patrimoine (ΚΥΑ art. 2). */
export function heatingLimits(household: Household, children = 0) {
  const H = P.heating;
  const c = int(children);
  const income = household === 'single' ? H.income_single + H.income_per_child * c
    : household === 'couple' ? H.income_couple + H.income_per_child * c
    : H.income_single_parent + H.income_per_child * Math.max(0, c - 1);
  const property = (household === 'single' ? H.property_single : H.property_couple) + H.property_per_child * c;
  return { income, property };
}

/* ------------------------------------------------------------------------- *
 * Επίδομα ανεργίας
 * ------------------------------------------------------------------------- */
/** Durée en mois selon les jours travaillés dans les 14 mois (hors 2 derniers). */
export function unemploymentMonths(days: number, age = 30, careerDays = 0): number {
  const U = P.unemployment;
  const d = int(days);
  if (d < U.duration[0].minDays) return 0;
  if ((d >= U.age49_days && age >= U.age49_age) || careerDays >= U.career_days) return 12;
  let m = 0;
  for (const s of U.duration) if (d >= s.minDays) m = s.months;
  return m;
}
export interface UnemploymentInput { days: number; avgPay?: number; dependants?: number; age?: number; careerDays?: number }
export function unemploymentBenefit(input: UnemploymentInput) {
  const U = P.unemployment;
  const daily = U.daily_min_wage * U.rate;
  const pay = input.avgPay === undefined ? Infinity : pos(num(input.avgPay));
  let share = 1;
  for (const b of U.low_pay_bands) if (pay <= U.daily_min_wage * b.maxDailyMultiple) { share = b.share; break; }
  const base = Math.round(daily * 100) / 100 * U.days_per_month * share;
  const dep = int(input.dependants);
  const monthly = base * (1 + U.dependant_uplift * dep);
  const months = unemploymentMonths(input.days, num(input.age, 30), num(input.careerDays));
  return { dailyBase: Math.round(daily * 100) / 100, share, base, monthly, months, total: months > 0 ? monthly * months : 0, eligible: months > 0 };
}

/* ------------------------------------------------------------------------- *
 * Επιστροφή ενοικίου
 * ------------------------------------------------------------------------- */
export type RentHousehold = 'single' | 'couple' | 'singleParent';
export function rentRefundIncomeLimit(h: RentHousehold, children = 0, year: 2025 | 2026 = 2026) {
  const R = P.rent_refund;
  const c = int(children);
  const old = year === 2025;
  if (h === 'single') return old ? R.income_single_2025 : R.income_single;
  if (h === 'couple') return (old ? R.income_couple_2025 : R.income_couple) + (old ? R.income_per_child_2025 : R.income_per_child) * c;
  return (old ? R.income_single_parent_2025 : R.income_single_parent) + R.income_per_child * Math.max(0, c - 1);
}
export interface RentRefundInput { annualRent: number; children?: number; household?: RentHousehold; income?: number; property?: number; student?: boolean }
export function rentRefund(input: RentRefundInput) {
  const R = P.rent_refund;
  const c = int(input.children);
  const h = input.household ?? 'single';
  const cap = input.student ? R.student_cap : R.cap + R.per_child * c;
  const twelfth = pos(num(input.annualRent)) * R.share;
  const amount = Math.min(twelfth, cap);
  const incomeLimit = rentRefundIncomeLimit(h, c);
  const members = 1 + (h === 'couple' ? 1 : 0) + c;
  const propertyLimit = R.property_base + R.property_per_member * (members - 1);
  const incomeOk = input.income === undefined || pos(num(input.income)) <= incomeLimit;
  const propertyOk = input.student || input.property === undefined || pos(num(input.property)) <= propertyLimit;
  const eligible = incomeOk && propertyOk;
  return { twelfth, cap, amount: eligible ? amount : 0, capped: twelfth > cap, incomeLimit, propertyLimit, incomeOk, propertyOk, eligible, rentForMax: cap / R.share };
}

/* ------------------------------------------------------------------------- *
 * Μητρότητα : ειδική παροχή ΔΥΠΑ (9 mois au salaire minimum)
 * ------------------------------------------------------------------------- */
export type MotherStatus = 'full' | 'part' | 'self';
export function maternitySpecial(status: MotherStatus, monthsToFather = 0) {
  const M = P.maternity;
  const monthly = P.minimum_wage.monthly * (status === 'part' ? M.special_part_time_share : 1);
  const toFather = Math.min(int(monthsToFather), M.special_transferable_to_father);
  const months = M.special_months;
  return { monthly, months, total: monthly * months, mother: months - toFather, father: toFather, efkaDays: M.efka_days, efkaWeeks: M.efka_days / 7 };
}

/* ------------------------------------------------------------------------- *
 * Φοιτητικό στεγαστικό επίδομα 2025-2026
 * ------------------------------------------------------------------------- */
export function studentHousing(input: { regional: boolean; shared: boolean; income?: number; children?: number }) {
  const S = P.student_housing;
  const amount = input.regional ? (input.shared ? S.regional_shared : S.regional) : (input.shared ? S.shared : S.base);
  const limit = S.income_limit + S.income_per_child_after_first * Math.max(0, int(input.children) - 1);
  const ok = input.income === undefined || pos(num(input.income)) <= limit;
  return { amount: ok ? amount : 0, gross: amount, limit, ok };
}

/* ------------------------------------------------------------------------- *
 * Σύνταξη χηρείας (art. 12 ν. 4387/2016)
 * ------------------------------------------------------------------------- */
export interface WidowInput { pension: number; children?: number; orphans?: boolean; age?: number; works?: boolean; disabled?: boolean; childEligible?: boolean }
export function widowPension(input: WidowInput) {
  const W = P.widow;
  const pen = pos(num(input.pension));
  const c = int(input.children);
  const childShare = input.orphans ? W.orphan_share : W.child_share;
  let children = c * childShare;
  const spouseShare = input.orphans ? 0 : W.spouse_share;
  if (spouseShare + children > W.max_total) children = W.max_total - spouseShare;
  const spouse = pen * spouseShare;
  const perChild = c > 0 ? pen * children / c : 0;
  const age = num(input.age, 60);
  const lifetime = input.orphans ? false : age >= W.lifetime_age || !!input.disabled || (c > 0 && input.childEligible !== false);
  const after3 = input.works && !input.disabled ? spouse * W.reduced_share : spouse;
  return { spouse, perChild, childrenTotal: perChild * c, total: spouse + perChild * c, lifetime, after3, reduced: after3 < spouse };
}
