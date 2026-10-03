/** Angles des pages « €X gross to net » en anglais (RECETTE §6.2) : un seuil propre par montant, écrit pour un
 *  anglophone qui vit ou travaille en Grèce et compare une offre en brut. Toutes les valeurs viennent du moteur (§6.4). */
import type { AngleFn } from './amount-types';
import { salary, minimumWage, severance, severanceMonths, christmasBonus, bonusNet, PARAMS as P } from './engine/gr';
import { pct, formatMoney } from './format';
import { route } from '../i18n/routes';
import { grossAt, LIM, creditZeroGross, taperGross, per100, firstTaxGross } from './amount-angles-el';

const T = P.tax;
const S = (gross: number, children = 0, age: 'u25' | '26_30' | 'over30' = 'over30') => salary({ gross, children, age });
const share = (x: number) => pct(Math.round(x * 100) / 100, 'en');

/* ------------------------------------------------------------------ 1000 */
const a1000: AngleFn = (c) => {
  const { F, $ } = c;
  const M = P.minimum_wage.monthly;
  const minNet = S(M).net, gapNet = c.raw.net - minNet, gapGross = c.amount - M;
  const s = S(c.amount);
  const t1 = minimumWage(1);
  const step = per100(c.amount);
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net} a Month After Tax`,
    description: `${c.gross} gross in Greece pays ${c.net} net per payment in ${F.year}, fourteen times a year. What the gap over the minimum wage is worth and where the tax credit tapers.`,
    h1: `${c.gross} gross to net in Greece (${F.year})`,
    intro: `On a private-sector contract paid fourteen times a year, ${c.gross} gross leaves a single employee over 30 with ${c.net} per payment.`,
    resume: `A monthly salary of ${c.gross} gross pays ${c.net} net in ${F.year} for an employee over 30 with no dependent children. Greek payroll deducts ${c.efka} of social insurance for e-EFKA (${F.efkaEe}) and ${c.tax} of income tax from every payment, and because private-sector staff receive fourteen payments a year, the twelve monthly salaries plus the Christmas bonus (doro Christougennon), the Easter bonus and the leave allowance, the annual take-home comes to ${c.netAnnual}. Spread over twelve months, that is ${c.netPer12}. The salary sits ${c.vsMin} above the national minimum wage of ${F.minWage}, yet only ${$(gapNet)} of the ${$(gapGross)} difference reaches your account. It is also the first figure in our series where the annual taxable income passes ${F.creditThreshold}, the point from roughly ${$(taperGross)} gross a month at which the employee tax credit (meiosi forou) begins to shrink. Workers aged 25 or under pay no income tax at all and keep ${c.netU25}.`,
    sections: [
      {
        h2: `What ${$(gapGross)} above the minimum wage is really worth`,
        html: `<p>If you are weighing a ${c.gross} offer against a minimum-wage job, compare take-home pay, not headline figures. The minimum wage of ${F.minWage} nets ${F.minNet}; ${c.gross} nets ${c.net}. Of the extra gross, e-EFKA takes ${F.efkaEe} and the second tax band takes ${c.marginal} of what remains, so you keep roughly ${share(gapNet / gapGross)}.</p>
<p>Your employer sees a larger difference: on top of your gross pay it adds its own ${F.efkaEr} contribution, so this position costs ${c.cost} a month, ${c.costAnnual} a year. The <a href="${route('employer', 'en')}">employer cost calculator</a> breaks that figure down line by line.</p>`,
      },
      {
        h2: `The ${F.creditThreshold} line where the tax credit starts to taper`,
        html: `<p>Every employee gets a tax credit under article 16 of the Greek income tax code: ${F.credit[0]} a year without children. Once taxable salary income exceeds ${F.creditThreshold}, the credit loses ${F.creditTaper} for each ${$(1000)} above that line. Taxable income here means gross pay times fourteen minus your e-EFKA contributions, which puts the line at about ${$(taperGross)} gross a month.</p>
<p>At ${c.gross} the effect is tiny: the credit applied is ${$(s.creditAnnual)} instead of ${F.credit[0]}. What matters is the direction. From here on, each raise is taxed at the band rate plus an extra two points from the shrinking credit, until the credit runs out far higher up the scale. The <a href="${route('credit', 'en')}">employee tax credit guide</a> has the figures for each family size.</p>`,
      },
      {
        h2: 'Check your seniority before accepting a round number',
        html: `<p>Staff paid on the statutory minimum earn ${F.triennium} more for each three-year block of experience (<em>trietia</em>), up to ${F.trienniumMax}. With just one, the legal floor is ${F.minWithT(1)}, which is ${$(t1 - c.amount)} more than ${c.gross}. A tidy four-figure offer can therefore be below what your experience already entitles you to. See the <a href="${route('trienniums', 'en')}">seniority increments</a> page, or run any other figure through the <a href="${route('home', 'en')}">salary calculator</a>.</p>`,
      },
    ],
    faqs: [
      { q: `How much of a ${$(100)} raise would I actually see on ${c.gross} gross?`, a: `About ${$(step)} per payment, or ${$(step * 14)} over a year of fourteen payments. e-EFKA keeps ${F.efkaEe} of the raise, the rest is taxed at ${c.marginal}, and because your taxable income is above ${F.creditThreshold}, the tax credit also shrinks by ${F.creditTaper} for every ${$(1000)} of extra taxable income.` },
      { q: `I have three years' experience and was offered ${c.gross} gross. Is that legal?`, a: `If your pay is tied to the statutory minimum wage, no. One three-year seniority step adds ${F.triennium}, which sets the floor at ${F.minWithT(1)}, ${$(t1 - c.amount)} above the offer. The increment also feeds into the holiday bonuses and the leave allowance. Ask payroll to correct it; the Labour Inspectorate handles complaints if they refuse.` },
      { q: `Do I pay income tax on ${c.gross} gross if I am 24?`, a: `No. Since ${F.year}, taxpayers aged up to 25 pay ${F.youthU25} on the first two tax bands, which cover the first ${F.youthLimit} of taxable income. Your taxable income of ${c.taxable} sits entirely inside that range, so only e-EFKA contributions of ${c.efka} come off and you keep ${c.netU25} per payment.` },
    ],
  };
};

/* ------------------------------------------------------------------ 1200 */
const a1200: AngleFn = (c) => {
  const { F, $ } = c;
  const k2 = S(c.amount, 2), k3 = S(c.amount, 3);
  const zero2 = firstTaxGross({ children: 2 }), zero3 = firstTaxGross({ children: 3 });
  const t3 = minimumWage(3);
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net}, Kids and Seniority`,
    description: `${c.gross} gross is ${c.net} net in Greece in ${F.year}. Why parents of two still pay ${$(k2.tax)} tax a month, when three children wipe it out, and the ${F.minWithT(3)} seniority floor.`,
    h1: `${c.gross} gross in Greece: what families and long-serving staff take home`,
    intro: `${c.gross} gross works out at ${c.net} net per payment for a childless employee over 30, with fourteen payments a year.`,
    resume: `At ${c.gross} gross a month a single employee over 30 takes home ${c.net} per payment in ${F.year}, after ${c.efka} of e-EFKA contributions and ${c.tax} of income tax, or ${c.netAnnual} over the year's fourteen payments. This is the salary at which family status changes the payslip most visibly, though not always as parents expect. With two dependent children income tax does not disappear: ${$(k2.tax)} is still withheld each month, because the zero-tax zone for a two-child family ends at roughly ${$(zero2)} gross. With three children the withholding falls to ${$(k3.tax)}, a rounding error, and vanishes completely below about ${$(zero3)}. The figure also matters to long-serving staff on the statutory wage: three seniority steps take the minimum to ${F.minWithT(3)}, only ${$(c.amount - t3)} short of ${c.gross}, so a new job at this level may pay little more than the floor you have already reached.`,
    sections: [
      {
        h2: 'Why a two-child family still pays tax here',
        html: `<p>Children cut Greek income tax in two ways: a lower rate on the second band (${F.second[1]}, ${F.second[2]}, ${F.second[3]} for one, two and three children instead of ${F.r[1]}) and a bigger tax credit (${F.credit[1]}, ${F.credit[2]}, ${F.credit[3]}). For two children at ${c.gross}, the scale produces ${$(k2.scaleAnnual)} of tax on taxable income of ${c.taxable}, while the credit, already trimmed because income passed ${F.creditThreshold}, is ${$(k2.creditAnnual)}. The gap of ${$(k2.taxAnnual)} a year is what gets withheld.</p>
<p>A third child changes the arithmetic: the second band drops to ${F.second[3]} and the credit almost covers the scale, leaving ${$(k3.taxAnnual)} a year. From four children the first two bands are taxed at ${pct(T.four_children_first_two_brackets, 'en')}. The <a href="${route('children', 'en')}">tax reduction for children</a> page sets out every case.</p>`,
      },
      {
        h2: `Three seniority steps: the floor reaches ${F.minWithT(3)}`,
        html: `<p>On the statutory minimum, each three-year block of service adds ${F.triennium}, capped at ${F.trienniumMax} blocks. After nine years the legal floor is ${F.minWithT(3)} and stops rising with experience. Someone in that position who moves to a ${c.gross} job gains just ${$(c.raw.net - S(t3).net)} net per payment.</p>
<p>There is a second, less obvious trade-off. Pay linked to the minimum wage follows each official increase automatically, while a freely negotiated ${c.gross} only rises when your employer agrees. Before switching, ask how pay reviews work. Background on the floor itself is on the <a href="${route('minimum', 'en')}">minimum wage</a> page and the <a href="${route('trienniums', 'en')}">seniority increments</a> guide.</p>`,
      },
    ],
    faqs: [
      { q: `I have two children and earn ${c.gross} gross. Why is tax still deducted?`, a: `Because the two-child tax credit no longer covers the whole scale tax. On taxable income of ${c.taxable}, the scale gives ${$(k2.scaleAnnual)} and the credit, reduced by ${F.creditTaper} per ${$(1000)} above ${F.creditThreshold}, gives ${$(k2.creditAnnual)}. The remaining ${$(k2.taxAnnual)} a year is split across fourteen payments, ${$(k2.tax)} each. Withholding is zero for two children only up to about ${$(zero2)} gross.` },
      { q: `Up to what gross salary does a parent of three pay no income tax?`, a: `Roughly ${$(zero3)} gross a month, assuming fourteen payments. Up to that point the three-child credit of ${F.credit[3]}, before tapering, exceeds the scale tax, where the second band is charged at only ${F.second[3]}. At ${c.gross} the monthly withholding is ${$(k3.tax)}, which most people never notice on the payslip.` },
      { q: `After nine years on the minimum wage, is a ${c.gross} offer a real step up?`, a: `Barely. With three seniority steps the minimum is already ${F.minWithT(3)}, just ${$(c.amount - t3)} below the offer, and the net difference is ${$(c.raw.net - S(t3).net)} per payment. Judge the offer on prospects for raises and on whether it keeps tracking the minimum wage, not on today's number.` },
    ],
  };
};

/* ------------------------------------------------------------------ 1500 */
const a1500: AngleFn = (c) => {
  const { F, $ } = c;
  const avg = P.minimum_wage.average_wage_2025, sa = S(avg);
  const u25Limit = firstTaxGross({ age: 'u25' });
  const top2 = grossAt(LIM[1]);
  const annual = c.amount * 14, gross12 = annual / 12;
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net}, the Average Wage`,
    description: `${c.gross} gross pays ${c.net} net in Greece in ${F.year}, close to the ${F.avgWage} average wage. Converting a ${$(annual)} annual offer, 14 payments and the under-25 relief.`,
    h1: `${c.gross} gross to net: an average Greek salary in ${F.year}`,
    intro: `Paid fourteen times a year, ${c.gross} gross gives a childless employee over 30 ${c.net} net each time.`,
    resume: `${c.gross} gross a month is ${c.net} net per payment in ${F.year} for an employee over 30 without children: ${c.efka} goes to e-EFKA and ${c.tax} to income tax, leaving ${c.netAnnual} over the year. That puts you almost exactly on the average salary recorded in the ERGANI employment register for 2025, which the Ministry of Labour put at ${F.avgWage} gross, so ${c.gross} is ${c.vsAvg} of it. International employers may quote this level as an annual package of ${$(annual)}, which is the same salary expressed across fourteen payments, a common source of confusion for people arriving from countries paid monthly. All of the income still falls in the two lowest tax bands: taxable income of ${c.taxable} is below the ${F.limits[1]} line, reached at about ${$(top2)} gross. That is why workers aged 25 or under pay no income tax at all here and keep ${c.netU25}, while those aged 26 to 30 keep ${c.net2630}.`,
    sections: [
      {
        h2: `Turning a ${$(annual)} annual offer into monthly pay`,
        html: `<p>Greek contracts state a monthly gross, but international employers and recruiters sometimes quote a yearly figure. Divide by fourteen, not twelve: the year contains twelve salaries, a full extra month at Christmas (<em>doro Christougennon</em>), half a month at Easter (<em>doro Pascha</em>) and half a month of leave allowance (<em>epidoma adeias</em>). ${$(annual)} a year therefore means ${c.gross} gross per payment and ${c.net} net.</p>
<p>If the employer instead pays twelve equal instalments of ${$(gross12)}, each one nets ${c.net12}. The annual total is identical, because tax is assessed on the year and contributions are proportional. Ask in writing whether the holiday bonuses are included, otherwise a "${$(gross12)} a month" offer and a "${c.gross} a month" offer cannot be compared. The <a href="${route('fourteen', 'en')}">fourteen salaries</a> page explains the calendar.</p>`,
      },
      {
        h2: `How ${c.gross} compares with the ${F.avgWage} average`,
        html: `<p>At the ERGANI average of ${F.avgWage}, the ${F.year} rules give ${$(sa.net)} net, ${$(sa.net - c.raw.net)} more than ${c.gross}. An average is pulled up by high earners, so sitting just below it does not mean you are underpaid for your sector. For negotiation, know what each extra euro is worth: the <a href="${route('home', 'en')}">salary calculator</a> shows it for any figure.</p>`,
      },
      {
        h2: 'Aged 25 or under: no tax at this salary',
        html: `<p>Since ${F.year} the first ${F.youthLimit} of taxable income is taxed at ${F.youthU25} for taxpayers up to 25 and at ${F.youth2630} from 26 to 30. At ${c.gross} the whole year's taxable income fits inside that range. Above about ${$(top2)} gross the excess is taxed at ${F.r[2]}, but the tax credit absorbs it at first, so a young employee's first withholding appears only around ${$(u25Limit)}. More in the <a href="${route('youth', 'en')}">young workers tax</a> guide.</p>`,
      },
    ],
    faqs: [
      { q: `A recruiter offered me ${$(annual)} a year. What is that per month?`, a: `In Greece, divide by fourteen: ${c.gross} gross per payment, which nets ${c.net} for a childless employee over 30. You receive it twelve times as salary plus the Christmas bonus, the Easter bonus and the leave allowance, which together add two more payments. Annual take-home is ${c.netAnnual}. Dividing by twelve would overstate your monthly salary.` },
      { q: `Is ${c.gross} gross a good salary in Greece?`, a: `It is close to the national average: the ERGANI register put the 2025 average at ${F.avgWage} gross, ${$(avg - c.amount)} more. It is also ${c.vsMin} above the ${F.minWage} minimum wage. Whether it is good for you depends on your sector and city, but in national terms it is a mid-range salary, netting ${c.net} per payment.` },
      { q: `Will twelve payments of ${$(gross12)} give me more than fourteen of ${c.gross}?`, a: `No, the same: both add up to ${$(annual)} gross and ${c.netAnnual} net over the year. The twelve-payment version nets ${c.net12} each month, the fourteen-payment version ${c.net} with three extra payments at Christmas, Easter and in summer. Make sure the contract states that the bonuses are built into the monthly amount.` },
    ],
  };
};

/* ------------------------------------------------------------------ 2000 */
const a2000: AngleFn = (c) => {
  const { F, $ } = c;
  const g26 = grossAt(LIM[1]);
  const slice = c.raw.taxable - LIM[1];
  const below = per100(1500), here = per100(c.amount);
  const u25 = S(c.amount, 0, 'u25');
  const perKid = slice * T.third_bracket_step_after_4;
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net} in the ${F.r[2]} Band`,
    description: `${c.gross} gross is ${c.net} net in Greece in ${F.year}. Above ${$(g26)} gross the ${F.r[2]} band applies, children lower it, and under-25s start paying some income tax.`,
    h1: `${c.gross} gross to net: crossing into the ${F.r[2]} tax band`,
    intro: `With fourteen payments a year, ${c.gross} gross nets ${c.net} for an employee over 30 without dependent children.`,
    resume: `A salary of ${c.gross} gross gives ${c.net} net per payment in ${F.year} for an employee over 30 with no children, after ${c.efka} of social insurance and ${c.tax} of income tax; over the year's fourteen payments that is ${c.netAnnual}. The reason this figure deserves its own page is the third tax band. Annual taxable income above ${F.limits[1]}, reached at about ${$(g26)} gross a month, is taxed at ${F.r[2]} instead of ${F.r[1]}. At ${c.gross} roughly ${$(slice)} of the year's taxable income falls in that band, and the return on a raise drops: each extra ${$(100)} gross now leaves ${$(here)}, against ${$(below)} lower down. Two other things become visible at this level. Parents get a reduced third band, ${F.third[1]} with one child, ${F.third[2]} with two and ${F.third[3]} with three. And employees aged 25 or under, who pay nothing at lower salaries, now see ${$(u25.tax)} of tax withheld per payment.`,
    sections: [
      {
        h2: `The ${F.r[2]} band starts at about ${$(g26)} gross`,
        html: `<p>Greece taxes income in slices, so crossing a band only affects the euros above it. At ${c.gross} the first ${F.limits[0]} of taxable income is charged at ${F.r[0]}, the next slice up to ${F.limits[1]} at ${F.r[1]}, and only the remaining ${$(slice)} at ${F.r[2]}, which adds ${$(slice * T.brackets[2].rate)} to the annual scale tax before the credit is deducted.</p>
<p>Where you feel it is in pay talks. Below the line a ${$(100)} raise was worth ${$(below)} net; here it is worth ${$(here)}, because the higher band combines with the shrinking tax credit, which keeps losing ${F.creditTaper} per ${$(1000)}. The full scale is on the <a href="${route('brackets', 'en')}">income tax brackets</a> page.</p>`,
      },
      {
        h2: 'Parents pay less in the third band too',
        html: `<p>Since ${F.year} the third band falls by two points for each child, from ${F.r[2]} to ${F.third[4]} with four. At ${c.gross} the saving from this rule is still modest, ${$(perKid)} a year per child, because only ${$(slice)} sits in the band. Most of the relief parents see on the payslip still comes from the cheaper second band and the larger tax credit. As salaries climb towards ${$(grossAt(LIM[2]))}, the reduced third band carries more weight. See <a href="${route('children', 'en')}">tax reduction for children</a>.</p>`,
      },
      {
        h2: 'Under 25 and suddenly taxed',
        html: `<p>The youth exemption covers only the first ${F.youthLimit} of taxable income. At ${c.gross} a young employee's taxable income is ${c.taxable}, and the excess is taxed at ${F.r[2]} like everyone else's. After the credit that comes to ${$(u25.taxAnnual)} a year, leaving ${c.netU25} per payment. A first payslip after a raise can be surprising for this reason: the relief has not been lost, it simply no longer covers the whole salary.</p>`,
      },
    ],
    faqs: [
      { q: `What rate applies to the part of my salary above ${$(g26)} gross?`, a: `For a taxpayer without children, ${F.r[2]} on annual taxable income above ${F.limits[1]}. The tax credit also loses ${F.creditTaper} per ${$(1000)} of taxable income, and e-EFKA takes ${F.efkaEe}, so of every ${$(100)} gross above the line you keep about ${$(here)}. Children reduce the band to between ${F.third[1]} and ${F.third[4]}.` },
      { q: `How much does the reduced third band save a parent of two on ${c.gross}?`, a: `About ${$(perKid * 2)} a year. Two children cut the third band from ${F.r[2]} to ${F.third[2]}, but only roughly ${$(slice)} of taxable income falls in it at this salary. The larger part of a two-child family's higher take-home of ${c.net2kids} comes from the ${F.second[2]} second band and the ${F.credit[2]} credit.` },
      { q: `I am 22 on ${c.gross} gross. Why is income tax withheld?`, a: `Because the ${F.youthU25} youth rate stops at ${F.youthLimit} of taxable income. Yours is ${c.taxable}, so the rest is taxed at ${F.r[2]}, and after the credit the withholding is ${$(u25.tax)} per payment. You still take home ${c.netU25}, well above the ${c.net} of a colleague over 30 on the same contract.` },
    ],
  };
};

/* ------------------------------------------------------------------ 2500 */
const a2500: AngleFn = (c) => {
  const { F, $ } = c;
  const g34 = grossAt(LIM[2]);
  const slice = c.raw.taxable - LIM[2];
  const lo = S(c.amount - 100), hi = S(c.amount + 100);
  const k2 = S(c.amount, 2);
  const years = 5, sev = severance({ pay: c.amount, years }), sevM = severanceMonths(years);
  const half = severance({ pay: c.amount, years, notice: true });
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net} and the ${F.r[3]} Band`,
    description: `${c.gross} gross pays ${c.net} net in Greece in ${F.year} and costs the employer ${c.cost}. What the ${F.r[3]} band from ${$(g34)} changes, and what a raise really leaves you.`,
    h1: `${c.gross} gross in Greece: the ${F.r[3]} band and the real cost of the job`,
    intro: `${c.gross} gross, paid fourteen times a year, nets ${c.net} for a single employee over 30.`,
    resume: `In ${F.year}, ${c.gross} gross a month nets ${c.net} per payment for an employee over 30 without children, once ${c.efka} of e-EFKA contributions and ${c.tax} of income tax are deducted; the annual total is ${c.netAnnual}. This is where the fourth tax band begins. From ${F.limits[2]} of taxable income, about ${$(g34)} gross a month, the rate is ${F.r[3]}. At ${c.gross}, though, only ${$(slice)} of the year's taxable income lands in that band, so the idea that crossing it "costs you money" is wrong: a higher gross never lowers your net pay in Greece. The band matters for the next raise. Going from ${$(c.amount - 100)} to ${$(c.amount + 100)} adds ${$(hi.net - lo.net)} net per payment. On the employer's side, the position costs ${c.cost} a month including its ${F.efkaEr} contribution, which means about ${share(c.raw.net / c.raw.cost)} of the total outlay ends up in your pocket. Your average tax rate on taxable income is ${c.average}.`,
    sections: [
      {
        h2: `Only ${$(slice)} a year in the ${F.r[3]} band`,
        html: `<p>The ${F.limits[2]} threshold works like a ramp, not a cliff. The ${F.r[3]} rate applies to taxable income above it, while the earlier slices keep their ${F.r[0]}, ${F.r[1]} and ${F.r[2]} rates. At ${c.gross} the slice above the line is ${$(slice)} a year, taxed at ${$(slice * T.brackets[3].rate)}. Your marginal rate is now ${c.marginal}, your average rate ${c.average}.</p>
<p>One detail for parents: the fourth band does not shrink with children. Everybody pays ${F.r[3]} on it, and family relief comes only from the lower bands and the tax credit.</p>`,
      },
      {
        h2: `A raise from ${$(c.amount - 100)} to ${$(c.amount + 100)}`,
        html: `<p>A ${$(200)} gross raise around this level leaves ${$(hi.net - lo.net)} net per payment, ${$((hi.net - lo.net) * 14)} a year. The first half is taxed at ${F.r[2]}, the second at ${F.r[3]}, and the tax credit keeps tapering. If you negotiate in net terms, the <a href="${route('nettogross', 'en')}">net-to-gross calculator</a> tells you which gross figure to ask for.</p>`,
      },
      {
        h2: `From ${c.cost} of employer cost to ${c.net} in your account`,
        html: `<p>Your employer pays ${c.employer} of social insurance on top of your gross every month. Out of the resulting ${c.cost}, your own ${F.efkaEe} and the income tax are then withheld. Over a year the job costs ${c.costAnnual}. If you are pricing yourself as a contractor or comparing with a job abroad, this total cost, not your gross, is the figure your employer budgets. Details on the <a href="${route('employer', 'en')}">employer cost</a> page.</p>`,
      },
    ],
    faqs: [
      { q: `I just crossed into the ${F.r[3]} band. Am I worse off?`, a: `No. The ${F.r[3]} rate applies only to taxable income above ${F.limits[2]}, which at ${c.gross} is just ${$(slice)} a year. Moving from ${$(c.amount - 100)} to ${c.gross} still raises your net pay by about ${$(c.raw.net - lo.net)} per payment. The Greek scale is progressive by slice, so a higher gross always means a higher net.` },
      { q: `Do children lower the ${F.r[3]} rate?`, a: `No, the fourth band is the same for everyone. Children lower the second and third bands and enlarge the tax credit. At ${c.gross} a parent of two pays ${$(k2.taxAnnual)} a year instead of ${c.taxAnnual}, a saving of ${$(c.raw.taxAnnual - k2.taxAnnual)} that comes entirely from those lower bands and the credit.` },
      { q: `What severance would I get after ${years} years on ${c.gross} gross?`, a: `Without written notice, ${sevM} months' pay plus one sixth for the share of holiday bonuses and leave allowance, roughly ${$(sev.total)}. If your employer gives the statutory written notice, the payment is halved, to about ${$(half.total)}. It is based on regular pay in the last full-time month. Try other lengths of service with the <a href="${route('severance', 'en')}">severance pay calculator</a>.` },
    ],
  };
};

/* ------------------------------------------------------------------ 3000 */
const a3000: AngleFn = (c) => {
  const { F, $ } = c;
  const s = S(c.amount);
  const z0 = creditZeroGross(0), z1 = creditZeroGross(1), z2 = creditZeroGross(2);
  const gainU25 = s.taxAnnual - S(c.amount, 0, 'u25').taxAnnual;
  const gain2630 = s.taxAnnual - S(c.amount, 0, '26_30').taxAnnual;
  const g39 = grossAt(LIM[3]);
  const xmas = christmasBonus({ pay: c.amount }).amount;
  const xmasNet = bonusNet(xmas, { gross: c.amount }).net;
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net} as the Credit Fades`,
    description: `${c.gross} gross nets ${c.net} in Greece in ${F.year}. The tax credit is down to ${$(s.creditAnnual)} and ends near ${$(z0)}; the under-30 tax relief stops growing. Full breakdown.`,
    h1: `${c.gross} gross to net in Greece: a vanishing tax credit`,
    intro: `For an employee over 30 without children, ${c.gross} gross on fourteen payments leaves ${c.net} net each time.`,
    resume: `On ${c.gross} gross a month you take home ${c.net} per payment in ${F.year} if you are over 30 and have no children: e-EFKA takes ${c.efka}, income tax ${c.tax}, and the year ends with ${c.netAnnual} net. The story at this salary is the employee tax credit. It starts at ${F.credit[0]} for a single person, but taxable income of ${c.taxable} is so far above the ${F.creditThreshold} taper line that only ${$(s.creditAnnual)} is left. Without children it hits zero at about ${$(z0)} gross a month; with one child at about ${$(z1)}, with two at about ${$(z2)}. The youth relief has also reached its ceiling: up to 25 you pay ${$(gainU25)} less a year, from 26 to 30 ${$(gain2630)} less, the same as at any salary above ${F.youthLimit} of taxable income. Your marginal rate is ${c.marginal}, and the ${F.r[4]} band starts a little higher, around ${$(g39)} gross. The Christmas bonus alone comes to about ${$(xmas)} gross.`,
    sections: [
      {
        h2: `From ${F.credit[0]} to ${$(s.creditAnnual)}: how the credit melts`,
        html: `<p>The rule is mechanical: for each ${$(1000)} of taxable salary income above ${F.creditThreshold}, the credit loses ${F.creditTaper}. At ${c.gross} you are ${$(c.raw.taxable - T.credit_taper_threshold)} above the line, so ${$(T.credit_by_children[0] - s.creditAnnual)} of the ${F.credit[0]} has gone. In effect that taper adds two points to your marginal rate until the credit is used up.</p>
<p>Parents start from a higher credit, ${F.credit[1]} with one child and ${F.credit[2]} with two, so they keep some relief further up the scale, and from five children the credit is never tapered. The <a href="${route('credit', 'en')}">employee tax credit</a> guide has every amount.</p>`,
      },
      {
        h2: 'Under 30: relief that has stopped growing',
        html: `<p>The youth rates apply only to the first ${F.youthLimit} of taxable income. Past that point the benefit is fixed: ${$(gainU25)} a year up to age 25 and ${$(gain2630)} from 26 to 30, the same here as at ${$(5000)}. For a young professional comparing offers, the gap with a colleague over 30 stays at about ${$(gain2630 / 14)} per payment for the 26-30 group, however high the salary goes. See the <a href="${route('youth', 'en')}">young workers tax</a> guide.</p>`,
      },
      {
        h2: `December at ${c.gross}: the Christmas bonus`,
        html: `<p>A full Christmas bonus (<em>doro Christougennon</em>) equals one month's pay plus the leave-allowance share, about ${$(xmas)} gross here, for employment running from 1 May to 31 December. Taxed at your average rate it nets around ${$(xmasNet)}. It must be paid by 21 December. Partial years and day-rate workers are covered by the <a href="${route('christmas', 'en')}">Christmas bonus calculator</a>.</p>`,
      },
    ],
    faqs: [
      { q: `Is any tax credit left at ${c.gross} gross?`, a: `A little: ${$(s.creditAnnual)} a year without children, compared with ${F.credit[0]} on low salaries. The credit loses ${F.creditTaper} for every ${$(1000)} of taxable income above ${F.creditThreshold} and runs out at about ${$(z0)} gross a month. Payroll already deducts it from your monthly withholding, so there is nothing to claim separately.` },
      { q: `I am 28. How much less tax do I pay on ${c.gross} gross?`, a: `${$(gain2630)} a year, about ${$(gain2630 / 14)} per payment, because from 26 to 30 the first two bands are taxed at ${F.youth2630}. Your taxable income is above ${F.youthLimit}, so the benefit is already at its maximum and will not grow with future raises. Your net pay is ${c.net2630} instead of ${c.net}.` },
      { q: `At what salary does a parent of one lose the tax credit entirely?`, a: `At roughly ${$(z1)} gross a month on fourteen payments. The one-child credit is ${F.credit[1]} and shrinks by ${F.creditTaper} per ${$(1000)} of taxable income above ${F.creditThreshold}. With two children it lasts until about ${$(z2)}, and with five or more children it is never reduced.` },
      { q: `How much is the Christmas bonus net on ${c.gross} gross?`, a: `About ${$(xmasNet)}. The gross bonus is one month's pay plus the leave-allowance share, about ${$(xmas)}, for a full period from 1 May to 31 December. Contributions of ${F.efkaEe} are deducted and the rest is taxed at your average rate for the year. It is due by 21 December.` },
    ],
  };
};

/* ------------------------------------------------------------------ 4000 */
const a4000: AngleFn = (c) => {
  const { F, $ } = c;
  const s = S(c.amount);
  const g39 = grossAt(LIM[3]);
  const slice = c.raw.taxable - LIM[3];
  const z0 = creditZeroGross(0);
  const p = per100(c.amount);
  const after = Math.ceil(z0 / 100) * 100 + 100;
  const pAfter = per100(after);
  const ceiling = P.efka.ceiling_monthly;
  const k2 = S(c.amount, 2);
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net} at the ${F.r[4]} Rate`,
    description: `${c.gross} gross nets ${c.net} in Greece in ${F.year}. The ${F.r[4]} band starts near ${$(g39)}, the last ${$(s.creditAnnual)} of credit is tapering and a raise here is worth less than higher up.`,
    h1: `${c.gross} gross in Greece: take-home pay in the ${F.r[4]} band`,
    intro: `A single employee over 30 on ${c.gross} gross, paid fourteen times a year, receives ${c.net} net per payment.`,
    resume: `${c.gross} gross a month pays ${c.net} net per payment in ${F.year} to an employee over 30 without children, after ${c.efka} of e-EFKA contributions and ${c.tax} of income tax; across fourteen payments that is ${c.netAnnual}. Taxable income above ${F.limits[3]}, reached at about ${$(g39)} gross, is taxed at ${F.r[4]}, and at ${c.gross} already ${$(slice)} of the year's taxable income is in that band. Only ${$(s.creditAnnual)} of the employee tax credit survives, and it disappears at about ${$(z0)}. That produces a small quirk: right now each ${$(100)} raise nets ${$(p)}, but just above ${$(z0)} the same raise nets ${$(pAfter)}, because there is no credit left to taper. Social insurance is still charged on the full salary, since the contribution ceiling of ${F.ceiling} is far off. Your average tax rate is ${c.average}, and the job costs your employer ${c.cost} a month.`,
    sections: [
      {
        h2: `Above ${$(g39)} gross: the ${F.r[4]} band`,
        html: `<p>The fifth band runs from ${F.limits[3]} to ${F.limits[4]} of taxable income. At ${c.gross} your taxable income of ${c.taxable} exceeds its floor by ${$(slice)}, which carries ${$(slice * T.brackets[4].rate)} of tax. Combined with contributions, roughly half of any extra gross now reaches you, worth knowing before you trade salary for a bonus or overtime.</p>
<p>Children do not change this rate. A parent of two pays ${$(k2.taxAnnual)} a year instead of ${c.taxAnnual}; the difference comes from the three lower bands and from a credit that for two children still holds ${$(k2.creditAnnual)}.</p>`,
      },
      {
        h2: 'Why a raise here is worth slightly less than one higher up',
        html: `<p>Between about ${$(g39)} and ${$(z0)} gross two charges overlap: the ${F.r[4]} rate and the credit taper of ${F.creditTaper} per ${$(1000)}, which acts like two extra points. Hence ${$(p)} from each ${$(100)} at ${c.gross}. Once the credit is exhausted the taper has nothing left to remove, and the same ${$(100)} at ${$(after)} leaves ${$(pAfter)}, a difference of ${formatMoney(pAfter - p, 2, 'en')}. Small, but it explains why two colleagues on similar salaries can see payslips that differ by less than expected. More on how payroll spreads the tax in <a href="${route('withholding', 'en')}">payroll tax withholding</a>.</p>`,
      },
      {
        h2: 'Contributions are still below the ceiling',
        html: `<p>Employee contributions of ${F.efkaEe} apply up to monthly earnings of ${F.ceiling}. At ${c.gross} you are ${$(ceiling - c.amount)} below that, so every raise still carries proportional contributions, currently ${c.efka} a month. What happens above the cap is covered on the <a href="${route('ceiling', 'en')}">contribution ceiling</a> page.</p>`,
      },
    ],
    faqs: [
      { q: `Why does a raise at ${c.gross} gross leave less than the same raise at ${$(after)}?`, a: `Because at ${c.gross} the article 16 tax credit is still being cut by ${F.creditTaper} per ${$(1000)} of taxable income, on top of the ${F.r[4]} rate. Each ${$(100)} therefore nets ${$(p)}. Above about ${$(z0)} gross the credit is gone, the taper stops, and the same ${$(100)} nets ${$(pAfter)}.` },
      { q: `On ${c.gross} gross, how much income tax do I pay in a year?`, a: `${c.taxAnnual} if you are over 30 without children, an average rate of ${c.average} on taxable income of ${c.taxable}. Add e-EFKA contributions of ${$(s.efkaAnnual)} and total deductions come to ${share(1 - c.raw.netAnnual / (c.amount * 14))} of the ${$(c.amount * 14)} annual gross, leaving ${c.netAnnual} net. A parent of two would pay ${$(k2.taxAnnual)} of tax instead.` },
      { q: `Have I reached the social insurance ceiling on ${c.gross}?`, a: `No. The monthly ceiling on insurable earnings is ${F.ceiling} from 1 January ${F.year}, ${$(ceiling - c.amount)} above your salary. Below it you pay ${F.efkaEe} on your entire gross, ${c.efka} a month here, and your employer pays ${F.efkaEr}, or ${c.employer}. Above the cap, contributions stop rising with salary.` },
    ],
  };
};

/* ------------------------------------------------------------------ 5000 */
const a5000: AngleFn = (c) => {
  const { F, $ } = c;
  const g44 = grossAt(LIM[4]);
  const slice = c.raw.taxable - LIM[4];
  const step = per100(c.amount);
  const k1 = S(c.amount, 1), k2 = S(c.amount, 2);
  const ceiling = P.efka.ceiling_monthly;
  const deductions = c.amount * 14 - c.raw.netAnnual;
  const keep = (1 - P.efka.employee_rate) * (1 - T.brackets[5].rate);
  return {
    title: `${c.gross} Gross to Net Greece ${F.year}: ${c.net} at the Top Rate`,
    description: `${c.gross} gross pays ${c.net} net in Greece in ${F.year}. The top ${F.r[5]} rate starts near ${$(g44)}, the tax credit is gone without kids and contributions are below the cap.`,
    h1: `${c.gross} gross to net in Greece: life at the top tax rate`,
    intro: `On ${c.gross} gross with fourteen payments, a childless employee over 30 takes home ${c.net} each time.`,
    resume: `${c.gross} gross a month leaves ${c.net} net per payment in ${F.year} for an employee over 30 without children, ${c.netShare} of gross: ${c.efka} goes to e-EFKA and ${c.tax} to income tax. Over the year you take home ${c.netAnnual}, while tax and contributions together come to ${$(deductions)}. This is the first salary in our series to reach the top rate of ${F.r[5]}, which applies to taxable income above ${F.limits[4]}, roughly ${$(g44)} gross a month. Only ${$(slice)} a year is taxed that way at ${c.gross}, but every further ${$(100)} raise will leave just ${$(step)}. The employee tax credit has gone completely for anyone with no children or one child; a parent of two still keeps ${$(k2.creditAnnual)}. Social insurance, on the other hand, has not yet hit its ceiling of ${F.ceiling}, so contributions still grow with every raise. Your employer spends ${c.cost} a month on the position.`,
    sections: [
      {
        h2: `The top ${F.r[5]} rate from about ${$(g44)} gross`,
        html: `<p>The sixth band has no upper limit: everything above ${F.limits[4]} of taxable income is taxed at ${F.r[5]}, whatever your age or family. At ${c.gross} that slice is ${$(slice)} a year, carrying ${$(slice * T.brackets[5].rate)} of tax. From the next euro of gross, after ${F.efkaEe} of contributions and ${F.r[5]} of tax, you keep ${formatMoney(keep, 2, 'en')}.</p>
<p>At this level the shape of your pay starts to matter. A one-off bonus is taxed through the same scale, while a raise is spread over fourteen payments. Either way, the <a href="${route('nettogross', 'en')}">net-to-gross calculator</a> tells you what gross to ask for to land a target net.</p>`,
      },
      {
        h2: 'No tax credit left, unless you have two children',
        html: `<p>For a single person the article 16 credit runs out at about ${$(creditZeroGross(0))} gross, and for a parent of one at about ${$(creditZeroGross(1))}. At ${c.gross} a parent of one therefore benefits only from the cheaper lower bands, ${$(c.raw.taxAnnual - k1.taxAnnual)} a year in total. With two children the credit survives until roughly ${$(creditZeroGross(2))}, adding another ${$(k2.creditAnnual)}.</p>`,
      },
      {
        h2: `Contributions continue up to ${F.ceiling}`,
        html: `<p>Unlike tax, social insurance is capped. You pay ${F.efkaEe} and your employer ${F.efkaEr} only on monthly earnings up to ${F.ceiling}. At ${c.gross} you are ${$(ceiling - c.amount)} short of that, so contributions still apply to your whole salary, ${c.efka} a month. Above the cap they freeze and your net share rises slightly; see the <a href="${route('ceiling', 'en')}">contribution ceiling</a> page.</p>`,
      },
    ],
    faqs: [
      { q: `Is my whole ${c.gross} salary taxed at ${F.r[5]}?`, a: `No. The top rate applies only to annual taxable income above ${F.limits[4]}, which at ${c.gross} is just ${$(slice)}. Lower slices are taxed at ${F.r[0]} to ${F.r[4]}, so your average rate is ${c.average} of taxable income and your total income tax for the year is ${c.taxAnnual}.` },
      { q: `How much of ${c.gross} gross goes to tax and social insurance over a year?`, a: `${$(deductions)} out of ${$(c.amount * 14)} gross: ${c.taxAnnual} of income tax and ${$(c.amount * 14 - c.raw.taxable)} of e-EFKA contributions. You keep ${c.netAnnual}, or ${c.netShare}. Including employer contributions, the position costs ${c.costAnnual} a year, so only ${share(c.raw.net / c.raw.cost)} of what your employer spends reaches you. Most of the gap is income tax, which keeps rising with salary while contributions eventually stop at the cap.` },
      { q: `Do two children still reduce my tax on ${c.gross} gross?`, a: `Yes. A parent of two pays ${$(k2.taxAnnual)} a year instead of ${c.taxAnnual}, thanks to the ${F.second[2]} second band, the ${F.third[2]} third band and a remaining credit of ${$(k2.creditAnnual)}. Net pay rises to ${c.net2kids} per payment. The top band stays at ${F.r[5]} for everyone.` },
    ],
  };
};

export const ANGLES_EN: Record<number, AngleFn> = {
  1000: a1000, 1200: a1200, 1500: a1500, 2000: a2000, 2500: a2500, 3000: a3000, 4000: a4000, 5000: a5000,
};
