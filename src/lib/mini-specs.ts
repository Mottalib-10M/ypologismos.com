/** Mini-simulateurs des pages (RECETTE §9.3), en grec et en anglais, calculés par `engine/gr.ts`. */
import {
  salary, grossForNet, incomeTax, taxCredit, minimumWage, bonusNet, christmasBonus, easterBonus, leaveAllowance,
  severance, extra2012Months, noticeMonths, roadTax, roadCategoryFor, co2Band, enfia, nationalPension, pension, replacementRate,
  parentalBenefit, PARAMS as P, type Age,
} from './engine/gr';
import { formatMoney, formatNumber, pct } from './format';
import type { MiniSpec } from './mini-types';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
const gross = (l: L, def = 1500) => ({ id: 'g', label: T(l, 'Μικτός μηνιαίος μισθός', 'Monthly gross salary'), def, unit: '€', max: 1_000_000 });
const kids = (l: L, def = 0) => ({ id: 'k', label: T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), def, options: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: String(k) })) });
const ageSel = (l: L, def = 2) => ({ id: 'a', label: T(l, 'Ηλικία', 'Age'), def, options: [{ value: '0', label: T(l, 'έως 25', 'up to 25') }, { value: '1', label: '26-30' }, { value: '2', label: T(l, '31+', '31+') }] });
const AGE: Age[] = ['u25', '26_30', 'over30'];
const yes = (l: L, id: string, label: string, def = 0) => ({ id, label, def, options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] });
const full = (l: L) => T(l, 'Πλήρης υπολογισμός μισθού', 'Full salary calculator');
const years = (l: L, def = 8) => ({ id: 'y', label: T(l, 'Συμπληρωμένα έτη στον εργοδότη', 'Full years with the employer'), def, max: 60 });

const SPECS: Record<string, (l: L) => MiniSpec> = {
  minimum: (l) => ({ title: T(l, 'Καθαρά στον κατώτατο μισθό, με τριετίες', 'Net minimum wage, with seniority increments'), cta: full(l),
    inputs: [{ id: 't', label: T(l, 'Τριετίες', 'Increments (3-year periods)'), def: 0, max: 3 }, kids(l)],
    run: ({ t, k }) => { const g = minimumWage(t); const s = salary({ gross: g, children: k });
      return { head: [T(l, 'Καθαρά ανά καταβολή', 'Net per payment'), $(s.net, l)], rows: [[T(l, 'Μικτά', 'Gross'), $(g, l)], [T(l, 'ΕΦΚΑ', 'EFKA'), $(s.efka, l)], [T(l, 'Φόρος', 'Tax'), $(s.tax, l)], [T(l, 'Καθαρά σε 12μηνη βάση', 'Net on a 12-month basis'), $(s.netPer12, l)]] }; } }),
  brackets: (l) => ({ title: T(l, 'Ο φόρος σας στη νέα κλίμακα 2026', 'Your tax on the 2026 scale'), cta: full(l),
    inputs: [{ id: 'i', label: T(l, 'Φορολογητέο εισόδημα τον χρόνο', 'Annual taxable income'), def: 22000, unit: '€', max: 10_000_000 }, kids(l)],
    run: ({ i, k }) => { const t = incomeTax(i, k);
      return { head: [T(l, 'Φόρος μετά τη μείωση', 'Tax after the reduction'), $(t.tax, l)], rows: [[T(l, 'Φόρος κλίμακας', 'Scale tax'), $(t.scale, l)], [T(l, 'Μείωση φόρου', 'Tax reduction'), $(t.credit, l)], [T(l, 'Οριακός / μέσος συντελεστής', 'Marginal / average rate'), `${pct(t.marginal, l)} / ${pct(t.average, l)}`]] }; } }),
  youth: (l) => ({ title: T(l, 'Πόσα κερδίζετε με τη μείωση για νέους', 'What the youth rates save you'), cta: full(l),
    inputs: [gross(l, 1300), ageSel(l, 0)],
    run: ({ g, a }) => { const y = salary({ gross: g, age: AGE[a] }), o = salary({ gross: g });
      return { head: [T(l, 'Λιγότερος φόρος τον χρόνο', 'Less tax per year'), $(o.taxAnnual - y.taxAnnual, l)], rows: [[T(l, 'Καθαρά με τη μείωση', 'Net with the youth rate'), $(y.net, l)], [T(l, 'Καθαρά άνω των 30', 'Net if over 30'), $(o.net, l)], [T(l, 'Φόρος τον χρόνο', 'Tax per year'), $(y.taxAnnual, l)]] }; } }),
  children: (l) => ({ title: T(l, 'Τι αλλάζει κάθε παιδί στον φόρο σας', 'What each child changes in your tax'), cta: full(l),
    inputs: [gross(l, 1800), kids(l, 2)],
    run: ({ g, k }) => { const a = salary({ gross: g, children: k }), b = salary({ gross: g });
      return { head: [T(l, 'Λιγότερος φόρος τον χρόνο', 'Less tax per year'), $(b.taxAnnual - a.taxAnnual, l)], rows: [[T(l, 'Καθαρά με τα τέκνα', 'Net with the children'), $(a.net, l)], [T(l, 'Καθαρά χωρίς τέκνα', 'Net without children'), $(b.net, l)], [T(l, 'Συντελεστές 2ου / 3ου κλιμακίου', '2nd / 3rd bracket rates'), `${pct(a.rates[1], l)} / ${pct(a.rates[2], l)}`]] }; } }),
  credit: (l) => ({ title: T(l, 'Πόση μείωση φόρου σας μένει', 'How much tax reduction you keep'), cta: full(l),
    inputs: [{ id: 'i', label: T(l, 'Φορολογητέο εισόδημα τον χρόνο', 'Annual taxable income'), def: 18000, unit: '€', max: 10_000_000 }, kids(l)],
    run: ({ i, k }) => { const c = taxCredit(i, k), t = incomeTax(i, k);
      return { head: [T(l, 'Μείωση φόρου άρθρου 16', 'Article 16 reduction'), $(c, l)], rows: [[T(l, 'Μείωση που χρησιμοποιείται', 'Reduction actually used'), $(t.credit, l)], [T(l, 'Φόρος κλίμακας', 'Scale tax'), $(t.scale, l)], [T(l, 'Φόρος που μένει', 'Tax left'), $(t.tax, l)]] }; } }),
  efka: (l) => ({ title: T(l, 'Οι εισφορές σας στον e-ΕΦΚΑ', 'Your e-EFKA contributions'), cta: T(l, 'Κόστος εργοδότη', 'Employer cost'),
    inputs: [gross(l, 1500)],
    run: ({ g }) => { const s = salary({ gross: g });
      return { head: [T(l, 'Εισφορές εργαζομένου τον μήνα', 'Employee contributions per month'), $(s.efka, l)], rows: [[T(l, 'Εισφορές εργοδότη', 'Employer contributions'), $(s.employer, l)], [T(l, 'Σύνολο προς τον e-ΕΦΚΑ', 'Total paid to e-EFKA'), $(s.efka + s.employer, l)], [T(l, 'Εισφορές εργαζομένου τον χρόνο (14)', 'Employee per year (14)'), $(s.efkaAnnual, l)]] }; } }),
  ceiling: (l) => ({ title: T(l, 'Πόσο σας επηρεάζει το πλαφόν', 'How the ceiling affects you'), cta: full(l),
    inputs: [gross(l, 9000)],
    run: ({ g }) => { const s = salary({ gross: g }); const noCap = g * P.efka.employee_rate;
      return { head: [T(l, 'Εισφορές που δεν πληρώνετε τον μήνα', 'Contributions you do not pay per month'), $(Math.max(0, noCap - s.efka), l)], rows: [[T(l, 'Εισφορές με το πλαφόν', 'Contributions with the ceiling'), $(s.efka, l)], [T(l, 'Μέγιστη εισφορά εργαζομένου', 'Maximum employee contribution'), $(P.efka.ceiling_monthly * P.efka.employee_rate, l)], [T(l, 'Καθαρά', 'Net'), $(s.net, l)]] }; } }),
  fourteen: (l) => ({ title: T(l, '14 ή 12 καταβολές: το ίδιο ετήσιο;', '14 or 12 payments: the same year?'), cta: full(l),
    inputs: [{ id: 'y', label: T(l, 'Μικτές ετήσιες αποδοχές', 'Annual gross pay'), def: 21000, unit: '€', max: 10_000_000 }],
    run: ({ y }) => { const a = salary({ gross: y / 14, payments: 14 }), b = salary({ gross: y / 12, payments: 12 });
      return { head: [T(l, 'Καθαρά τον χρόνο', 'Net per year'), $(a.netAnnual, l)], rows: [[T(l, 'Καθαρό ανά καταβολή σε 14', 'Net per payment over 14'), $(a.net, l)], [T(l, 'Καθαρό ανά καταβολή σε 12', 'Net per payment over 12'), $(b.net, l)], [T(l, 'Μικτό ανά καταβολή σε 14', 'Gross per payment over 14'), $(y / 14, l)]] }; } }),
  trienniums: (l) => ({ title: T(l, 'Η αύξηση των τριετιών στον μισθό σας', 'What seniority increments add to your pay'), cta: full(l),
    inputs: [{ id: 'b', label: T(l, 'Βασικός μισθός', 'Base salary'), def: P.minimum_wage.monthly, unit: '€', max: 100000 }, { id: 't', label: T(l, 'Τριετίες', 'Increments'), def: 2, max: 3 }],
    run: ({ b, t }) => { const g = b * (1 + P.minimum_wage.triennium_rate * Math.min(t, P.minimum_wage.triennium_max)); const a = salary({ gross: g }), z = salary({ gross: b });
      return { head: [T(l, 'Μικτά με τις τριετίες', 'Gross with the increments'), $(g, l)], rows: [[T(l, 'Καθαρά με τις τριετίες', 'Net with the increments'), $(a.net, l)], [T(l, 'Καθαρά χωρίς τριετίες', 'Net without increments'), $(z.net, l)], [T(l, 'Καθαρή διαφορά τον χρόνο', 'Net difference per year'), $(a.netAnnual - z.netAnnual, l)]] }; } }),
  withholding: (l) => ({ title: T(l, 'Ο ΦΜΥ της μισθοδοσίας σας', 'The tax withheld from your pay'), cta: full(l),
    inputs: [gross(l, 1600), kids(l)],
    run: ({ g, k }) => { const s = salary({ gross: g, children: k });
      return { head: [T(l, 'ΦΜΥ ανά καταβολή', 'Tax withheld per payment'), $(s.tax, l)], rows: [[T(l, 'Ετήσιο φορολογητέο (× 14)', 'Annual taxable (× 14)'), $(s.taxableAnnual, l)], [T(l, 'Ετήσιος φόρος', 'Annual tax'), $(s.taxAnnual, l)], [T(l, 'Μέσος συντελεστής', 'Average rate'), pct(s.averageTax, l)]] }; } }),
  parttime: (l) => ({ title: T(l, 'Καθαρά σε μερική απασχόληση', 'Net pay part-time'), cta: full(l),
    inputs: [{ id: 'h', label: T(l, 'Ώρες την εβδομάδα', 'Hours per week'), def: 20, unit: 'h', max: 40 }, { id: 'f', label: T(l, 'Μικτά πλήρους απασχόλησης (40 ώρες)', 'Full-time gross (40 hours)'), def: P.minimum_wage.monthly, unit: '€', max: 100000 }],
    run: ({ h, f }) => { const g = f * Math.min(h, 40) / 40; const s = salary({ gross: g });
      return { head: [T(l, 'Καθαρά ανά καταβολή', 'Net per payment'), $(s.net, l)], rows: [[T(l, 'Μικτά αναλογικά', 'Pro-rata gross'), $(g, l)], [T(l, 'ΕΦΚΑ', 'EFKA'), $(s.efka, l)], [T(l, 'Φόρος', 'Tax'), $(s.tax, l)]] }; } }),
  daily: (l) => ({ title: T(l, 'Από ημερομίσθιο σε μηνιαία καθαρά', 'From a daily wage to monthly net'), cta: full(l),
    inputs: [{ id: 'd', label: T(l, 'Ημερομίσθιο', 'Daily wage'), def: P.minimum_wage.daily, unit: '€', max: 10000, decimals: 2 }, { id: 'n', label: T(l, 'Ημέρες τον μήνα', 'Days per month'), def: 25, max: 31 }],
    run: ({ d, n }) => { const g = d * n; const s = salary({ gross: g });
      return { head: [T(l, 'Καθαρά τον μήνα', 'Net per month'), $(s.net, l)], rows: [[T(l, 'Μικτά τον μήνα', 'Gross per month'), $(g, l)], [T(l, 'Καθαρά την ημέρα', 'Net per day'), $2(n > 0 ? s.net / n : 0, l)], [T(l, 'Κατώτατο ημερομίσθιο', 'Minimum daily wage'), $2(P.minimum_wage.daily, l)]] }; } }),
  parental: (l) => ({ title: T(l, 'Το επίδομα γονικής άδειας της ΔΥΠΑ', 'The DYPA parental leave benefit'), cta: full(l),
    inputs: [yes(l, 's', T(l, 'Μόνος γονέας;', 'Single parent?')), yes(l, 'm', T(l, 'Δίδυμα ή πολύδυμα;', 'Twins or more?'))],
    run: ({ s, m }) => { const b = parentalBenefit({ single: s === 1, multiple: m === 1 });
      return { head: [T(l, 'Σύνολο επιδόματος', 'Total benefit'), $(b.total, l)], rows: [[T(l, 'Μήνες με επίδομα', 'Months paid'), String(b.months)], [T(l, 'Ανά μήνα (κατώτατος + αναλογία δώρων)', 'Per month (minimum wage + bonus share)'), $(b.perMonth, l)]] }; } }),
  nettogross: (l) => ({ title: T(l, 'Πόσα μικτά για τα καθαρά που θέλετε', 'What gross gives you the net you want'), cta: T(l, 'Πλήρης υπολογιστής καθαρά σε μικτά', 'Full net-to-gross calculator'),
    inputs: [{ id: 'n', label: T(l, 'Καθαρά ανά καταβολή', 'Net per payment'), def: 1300, unit: '€', max: 500000 }, kids(l)],
    run: ({ n, k }) => { const g = grossForNet(n, { children: k }); const s = salary({ gross: g, children: k });
      return { head: [T(l, 'Μικτά που χρειάζονται', 'Gross needed'), $(g, l)], rows: [[T(l, 'ΕΦΚΑ', 'EFKA'), $(s.efka, l)], [T(l, 'Φόρος', 'Tax'), $(s.tax, l)], [T(l, 'Κόστος εργοδότη', 'Employer cost'), $(s.cost, l)]] }; } }),
  employer: (l) => ({ title: T(l, 'Πόσο κοστίζει ένας μισθός στον εργοδότη', 'What a salary costs the employer'), cta: T(l, 'Πλήρης υπολογιστής κόστους', 'Full employer cost calculator'),
    inputs: [gross(l, 1500)],
    run: ({ g }) => { const s = salary({ gross: g });
      return { head: [T(l, 'Κόστος τον χρόνο (14)', 'Cost per year (14)'), $(s.costAnnual, l)], rows: [[T(l, 'Εργοδοτικές εισφορές ανά καταβολή', 'Employer contributions per payment'), $(s.employer, l)], [T(l, 'Καθαρά εργαζομένου', 'Employee net'), $(s.net, l)], [T(l, 'Κόστος ανά 1 € καθαρό', 'Cost per €1 of net pay'), $2(s.net > 0 ? s.cost / s.net : 0, l)]] }; } }),
  christmas: (l) => ({ title: T(l, 'Το δώρο Χριστουγέννων σας', 'Your Christmas bonus'), cta: T(l, 'Πλήρης υπολογιστής δώρου', 'Full bonus calculator'),
    inputs: [gross(l, 1300), { id: 'd', label: T(l, 'Ημέρες εργασίας 1/5-31/12', 'Days employed 1 May-31 Dec'), def: P.bonuses.christmas_period_days, max: P.bonuses.christmas_period_days }],
    run: ({ g, d }) => { const b = christmasBonus({ pay: g, days: d }); const n = bonusNet(b.amount, { gross: g });
      return { head: [T(l, 'Δώρο μικτό', 'Gross bonus'), $(b.amount, l)], rows: [[T(l, 'Καθαρό δώρο', 'Net bonus'), $(n.net, l)], [T(l, 'Αναλογία επιδόματος αδείας', 'Leave allowance share'), $(b.leaveShare, l)]] }; } }),
  easter: (l) => ({ title: T(l, 'Το δώρο Πάσχα σας', 'Your Easter bonus'), cta: T(l, 'Πλήρης υπολογιστής δώρου', 'Full bonus calculator'),
    inputs: [gross(l, 1300), { id: 'd', label: T(l, 'Ημέρες εργασίας 1/1-30/4', 'Days employed 1 Jan-30 Apr'), def: P.bonuses.easter_period_days, max: P.bonuses.easter_period_days }],
    run: ({ g, d }) => { const b = easterBonus({ pay: g, days: d }); const n = bonusNet(b.amount, { gross: g });
      return { head: [T(l, 'Δώρο μικτό', 'Gross bonus'), $(b.amount, l)], rows: [[T(l, 'Καθαρό δώρο', 'Net bonus'), $(n.net, l)], [T(l, 'Αναλογία επιδόματος αδείας', 'Leave allowance share'), $(b.leaveShare, l)]] }; } }),
  leave: (l) => ({ title: T(l, 'Το επίδομα αδείας σας', 'Your leave allowance'), cta: T(l, 'Πλήρης υπολογιστής', 'Full calculator'),
    inputs: [gross(l, 1300), { id: 'm', label: T(l, 'Μήνες εργασίας στο έτος', 'Months worked this year'), def: 12, max: 12 }],
    run: ({ g, m }) => { const a = leaveAllowance({ pay: g, months: m }); const n = bonusNet(a.amount, { gross: g });
      return { head: [T(l, 'Επίδομα αδείας μικτό', 'Gross leave allowance'), $(a.amount, l)], rows: [[T(l, 'Καθαρό', 'Net'), $(n.net, l)], [T(l, 'Ανώτατο (μισός μισθός)', 'Maximum (half a month)'), $(a.cap, l)]] }; } }),
  severance: (l) => ({ title: T(l, 'Η αποζημίωση απόλυσης σε δύο κλικ', 'Severance in two clicks'), cta: T(l, 'Πλήρης υπολογιστής αποζημίωσης', 'Full severance calculator'),
    inputs: [gross(l, 1400), years(l)],
    run: ({ g, y }) => { const a = severance({ pay: g, years: y }), b = severance({ pay: g, years: y, notice: true });
      return { head: [T(l, 'Χωρίς προειδοποίηση', 'Without notice'), $(a.total, l)], rows: [[T(l, 'Με έγγραφη προειδοποίηση', 'With written notice'), $(b.total, l)], [T(l, 'Μισθοί αποζημίωσης', 'Months of pay'), String(a.months)], [T(l, 'Προειδοποίηση', 'Notice'), T(l, `${a.noticeMonths} μήνες`, `${a.noticeMonths} months`)]] }; } }),
  sevtable: (l) => ({ title: T(l, 'Σε ποια γραμμή του πίνακα είστε', 'Where you sit in the table'), cta: T(l, 'Πλήρης υπολογιστής αποζημίωσης', 'Full severance calculator'),
    inputs: [years(l, 5), gross(l, 1300)],
    run: ({ y, g }) => { const a = severance({ pay: g, years: y }); const next = severance({ pay: g, years: y + 1 });
      return { head: [T(l, 'Μισθοί αποζημίωσης', 'Months of pay'), String(a.months)], rows: [[T(l, 'Αποζημίωση με 1/6', 'Severance with 1/6'), $(a.total, l)], [T(l, 'Με ένα έτος ακόμη', 'With one more year'), $(next.total, l)]] }; } }),
  sevold: (l) => ({ title: T(l, 'Η επιπλέον αποζημίωση των 17+ ετών', 'The extra severance for 17+ years'), cta: T(l, 'Πλήρης υπολογιστής αποζημίωσης', 'Full severance calculator'),
    inputs: [{ id: 'z', label: T(l, 'Έτη στις 12.11.2012', 'Years on 12.11.2012'), def: 20, max: 60 }, gross(l, 2400)],
    run: ({ z, g }) => { const x = extra2012Months(z); const s = severance({ pay: g, years: Math.max(16, z), yearsAt2012: z });
      return { head: [T(l, 'Επιπλέον μισθοί', 'Extra months'), String(x)], rows: [[T(l, 'Επιπλέον ποσό (μισθός έως 2.000 €)', 'Extra amount (pay capped at €2,000)'), $(s.extra * (1 + P.severance.holiday_uplift), l)], [T(l, 'Σύνολο αποζημίωσης', 'Total severance'), $(s.total, l)]] }; } }),
  notice: (l) => ({ title: T(l, 'Προειδοποίηση ή πλήρης αποζημίωση;', 'Notice or full severance?'), cta: T(l, 'Πλήρης υπολογιστής αποζημίωσης', 'Full severance calculator'),
    inputs: [years(l, 6), gross(l, 1500)],
    run: ({ y, g }) => { const a = severance({ pay: g, years: y }), b = severance({ pay: g, years: y, notice: true });
      return { head: [T(l, 'Μήνες προειδοποίησης', 'Months of notice'), String(noticeMonths(y))], rows: [[T(l, 'Αποζημίωση χωρίς προειδοποίηση', 'Severance without notice'), $(a.total, l)], [T(l, 'Αποζημίωση με προειδοποίηση', 'Severance with notice'), $(b.total, l)], [T(l, 'Μισθός της περιόδου προειδοποίησης', 'Pay during the notice period'), $(g * noticeMonths(y), l)]] }; } }),
  sevworkers: (l) => ({ title: T(l, 'Αποζημίωση με ημερομίσθιο', 'Severance on a daily wage'), cta: T(l, 'Πλήρης υπολογιστής αποζημίωσης', 'Full severance calculator'),
    inputs: [{ id: 'd', label: T(l, 'Ημερομίσθιο', 'Daily wage'), def: 50, unit: '€', max: 10000, decimals: 2 }, years(l, 10)],
    run: ({ d, y }) => { const s = severance({ pay: d, daily: true, years: y });
      return { head: [T(l, 'Αποζημίωση χωρίς προειδοποίηση', 'Severance without notice'), $(s.total, l)], rows: [[T(l, 'Μηνιαίος μισθός (× 22)', 'Monthly pay (× 22)'), $(s.monthly, l)], [T(l, 'Μισθοί αποζημίωσης', 'Months of pay'), String(s.months)]] }; } }),
  road: (l) => ({ title: T(l, 'Τα τέλη κυκλοφορίας του αυτοκινήτου σας', 'Your car’s road tax'), cta: T(l, 'Πλήρης υπολογιστής τελών', 'Full road tax calculator'),
    inputs: [{ id: 'y', label: T(l, 'Έτος ταξινόμησης', 'Year registered'), def: 2019, max: 2026 }, { id: 'c', label: T(l, 'CO₂ (από 11/2010) ή κυβικά', 'CO₂ (from 11/2010) or cc'), def: 120, max: 20000 }],
    run: ({ y, c }) => { const cat = roadCategoryFor(y); const r = roadTax({ category: cat, cc: c, co2: c });
      return { head: [T(l, 'Τέλη κυκλοφορίας', 'Road tax'), $2(r.amount, l)], rows: [[T(l, 'Μέθοδος', 'Method'), r.method === 'co2' ? 'CO₂' : T(l, 'κυβισμός', 'engine size')], [T(l, 'Ανά μήνα', 'Per month'), $2(r.amount / 12, l)]] }; } }),
  roadmonth: (l) => ({ title: T(l, 'Τα τέλη σας ανά μήνα', 'Your road tax per month'), cta: T(l, 'Πλήρης υπολογιστής τελών', 'Full road tax calculator'),
    inputs: [{ id: 'c', label: T(l, 'CO₂ WLTP', 'WLTP CO₂'), def: 140, unit: 'g/km', max: 999 }, { id: 'm', label: T(l, 'Μήνες κυκλοφορίας', 'Months on the road'), def: 6, max: 12 }],
    run: ({ c, m }) => { const r = roadTax({ category: 'co2_wltp', co2: c });
      return { head: [T(l, 'Ετήσια τέλη (αδιαίρετα)', 'Annual road tax (not split)'), $2(r.amount, l)], rows: [[T(l, 'Ένα δωδέκατο', 'One twelfth'), $2(r.amount / 12, l)], [T(l, 'Δωδέκατα για τους μήνες', 'Twelfths for those months'), $2(r.amount / 12 * m, l)]] }; } }),
  roadco2: (l) => ({ title: T(l, 'Σε ποιο κλιμάκιο CO₂ ανήκετε', 'Which CO₂ band you are in'), cta: T(l, 'Πλήρης υπολογιστής τελών', 'Full road tax calculator'),
    inputs: [{ id: 'c', label: 'CO₂', def: 135, unit: 'g/km', max: 999 }, { id: 'w', label: T(l, 'Μέτρηση', 'Test cycle'), def: 1, options: [{ value: '1', label: T(l, 'WLTP (από 2021)', 'WLTP (from 2021)') }, { value: '0', label: T(l, 'NEDC (11/2010-2020)', 'NEDC (11/2010-2020)') }] }],
    run: ({ c, w }) => { const t = w === 1 ? 'co2_wltp' : 'co2_nedc'; const b = co2Band(c, t); const r = roadTax({ category: t, co2: c }); const lower = roadTax({ category: t, co2: b.from - 1 });
      return { head: [T(l, 'Τέλη κυκλοφορίας', 'Road tax'), $2(r.amount, l)], rows: [[T(l, 'Κλιμάκιο', 'Band'), `${b.from}-${b.to ?? '+'} g/km`], [T(l, 'Ευρώ ανά γραμμάριο', 'Euros per gram'), $2(b.rate, l)], [T(l, 'Στο κλιμάκιο από κάτω', 'In the band below'), b.from > 0 ? $2(lower.amount, l) : '—']] }; } }),
  roadcc: (l) => ({ title: T(l, 'Τέλη με βάση τα κυβικά', 'Road tax by engine size'), cta: T(l, 'Πλήρης υπολογιστής τελών', 'Full road tax calculator'),
    inputs: [{ id: 'c', label: T(l, 'Κυβισμός', 'Engine size'), def: 1600, unit: 'cc', max: 20000 }],
    run: ({ c }) => ({ head: [T(l, 'Ταξινόμηση 2006-10/2010', 'Registered 2006-10/2010'), $(roadTax({ category: 'cc_from_2006', cc: c }).amount, l)], rows: [[T(l, 'Ταξινόμηση 2001-2005', 'Registered 2001-2005'), $(roadTax({ category: 'cc_2001_2005', cc: c }).amount, l)], [T(l, 'Ταξινόμηση έως 2000', 'Registered up to 2000'), $(roadTax({ category: 'cc_until_2000', cc: c }).amount, l)]] }) }),
  roadev: (l) => ({ title: T(l, 'Πόσα γλιτώνετε με ηλεκτρικό', 'What an electric car saves you'), cta: T(l, 'Πλήρης υπολογιστής τελών', 'Full road tax calculator'),
    inputs: [{ id: 'c', label: T(l, 'CO₂ του θερμικού που θα αγοράζατε', 'CO₂ of the petrol car you would buy'), def: 150, unit: 'g/km', max: 999 }, { id: 'y', label: T(l, 'Χρόνια κατοχής', 'Years of ownership'), def: 8, max: 30 }],
    run: ({ c, y }) => { const r = roadTax({ category: 'co2_wltp', co2: c });
      return { head: [T(l, 'Τέλη που γλιτώνετε συνολικά', 'Road tax saved in total'), $(r.amount * y, l)], rows: [[T(l, 'Τέλη θερμικού τον χρόνο', 'Petrol car per year'), $2(r.amount, l)], [T(l, 'Ηλεκτρικό τον χρόνο', 'Electric per year'), $(0, l)]] }; } }),
  enfia: (l) => ({ title: T(l, 'Γρήγορη εκτίμηση ΕΝΦΙΑ', 'Quick ENFIA estimate'), cta: T(l, 'Πλήρης υπολογιστής ΕΝΦΙΑ', 'Full ENFIA calculator'),
    inputs: [{ id: 's', label: T(l, 'Τετραγωνικά', 'Square metres'), def: 90, unit: 'm²', max: 100000 }, { id: 'z', label: T(l, 'Τιμή ζώνης', 'Zone price'), def: 1500, unit: '€/m²', max: 50000 }],
    run: ({ s, z }) => { const r = enfia({ sqm: s, zonePrice: z, buildYear: 1995, floor: 'f2_3', facades: 1 });
      return { head: [T(l, 'ΕΝΦΙΑ τον χρόνο', 'ENFIA per year'), $(r.total, l)], rows: [[T(l, 'Βασικός φόρος ζώνης', 'Zone basic tax'), `${$2(r.basicRate, l)}/m²`], [T(l, 'Μείωση λόγω αξίας', 'Value reduction'), pct(r.valueReductionRate, l)]], note: T(l, 'Υπόθεση: 2ος-3ος όροφος, μία πρόσοψη, άδεια του 1995.', 'Assumes 2nd-3rd floor, one frontage, 1995 permit.') }; } }),
  enfiadisc: (l) => ({ title: T(l, 'Ποια έκπτωση ΕΝΦΙΑ σας αναλογεί', 'Which ENFIA reduction applies to you'), cta: T(l, 'Πλήρης υπολογιστής ΕΝΦΙΑ', 'Full ENFIA calculator'),
    inputs: [{ id: 'v', label: T(l, 'Συνολική αξία ακινήτων', 'Total property value'), def: 140000, unit: '€', max: 100_000_000 }, yes(l, 'i', T(l, 'Ασφαλισμένη κατοικία;', 'Insured home?'))],
    run: ({ v, i }) => { const r = enfia({ sqm: 100, zonePrice: v / 100, buildYear: 1990, totalValue: v, insured: i === 1 });
      return { head: [T(l, 'Μείωση λόγω αξίας', 'Value reduction'), pct(r.valueReductionRate, l)], rows: [[T(l, 'Μείωση ασφάλισης', 'Insurance reduction'), pct(r.insuranceRate, l)], [T(l, 'Προσαύξηση (άνω των 500.000 €)', 'Surcharge (above €500,000)'), pct(r.surchargeRate, l)], [T(l, 'ΕΝΦΙΑ για 100 m² στην αξία αυτή', 'ENFIA for 100 m² at this value'), $(r.total, l)]] }; } }),
  enfiavillage: (l) => ({ title: T(l, 'Η μείωση 50 % στους μικρούς οικισμούς', 'The 50% cut in small settlements'), cta: T(l, 'Πλήρης υπολογιστής ΕΝΦΙΑ', 'Full ENFIA calculator'),
    inputs: [{ id: 's', label: T(l, 'Τετραγωνικά κατοικίας', 'Home size'), def: 110, unit: 'm²', max: 100000 }, { id: 'z', label: T(l, 'Τιμή ζώνης', 'Zone price'), def: 650, unit: '€/m²', max: 50000 }],
    run: ({ s, z }) => { const a = enfia({ sqm: s, zonePrice: z, buildYear: 1985, detached: true, facades: 2 }), b = enfia({ sqm: s, zonePrice: z, buildYear: 1985, detached: true, facades: 2, smallSettlement: true });
      return { head: [T(l, `ΕΝΦΙΑ ${P.year} με τη μείωση`, `ENFIA ${P.year} with the cut`), $(b.total, l)], rows: [[T(l, 'Χωρίς τη μείωση', 'Without the cut'), $(a.total, l)], [T(l, 'Όφελος', 'Saving'), $(a.total - b.total, l)]], note: T(l, 'Μονοκατοικία, άδεια του 1985, δύο προσόψεις.', 'Detached house, 1985 permit, two frontages.') }; } }),
  enfiains: (l) => ({ title: T(l, 'Πόσο μειώνει τον ΕΝΦΙΑ η ασφάλιση', 'How much insurance cuts ENFIA'), cta: T(l, 'Πλήρης υπολογιστής ΕΝΦΙΑ', 'Full ENFIA calculator'),
    inputs: [{ id: 'e', label: T(l, 'ΕΝΦΙΑ κατοικίας χωρίς έκπτωση', 'Home ENFIA without the reduction'), def: 320, unit: '€', max: 1_000_000 }, { id: 'v', label: T(l, 'Αξία κατοικίας', 'Home value'), def: 180000, unit: '€', max: 100_000_000 }, { id: 'm', label: T(l, 'Μήνες ασφάλισης πέρυσι', 'Months insured last year'), def: 12, max: 12 }],
    run: ({ e, v, m }) => { const rate = m < 3 ? 0 : (v <= P.enfia.insurance_value_limit ? P.enfia.insurance_reduction : P.enfia.insurance_reduction_high) * Math.min(12, m) / 12;
      return { head: [T(l, 'Έκπτωση', 'Reduction'), $(e * rate, l)], rows: [[T(l, 'Ποσοστό', 'Rate'), pct(rate, l)], [T(l, 'ΕΝΦΙΑ μετά την έκπτωση', 'ENFIA after the reduction'), $(e * (1 - rate), l)]], note: T(l, 'Κάτω από 3 μήνες ασφάλισης δεν δίνεται έκπτωση· κάτω από 12 μήνες είναι αναλογική.', 'Under 3 months of cover there is no reduction; under 12 months it is pro rata.') }; } }),
  zone: (l) => ({ title: T(l, 'Τι σημαίνει η τιμή ζώνης για τον ΕΝΦΙΑ', 'What your zone price means for ENFIA'), cta: T(l, 'Πλήρης υπολογιστής ΕΝΦΙΑ', 'Full ENFIA calculator'),
    inputs: [{ id: 'z', label: T(l, 'Τιμή ζώνης', 'Zone price'), def: 2400, unit: '€/m²', max: 50000 }, { id: 's', label: T(l, 'Τετραγωνικά', 'Square metres'), def: 80, unit: 'm²', max: 100000 }],
    run: ({ z, s }) => { const r = enfia({ sqm: s, zonePrice: z, buildYear: 2000, floor: 'f2_3', facades: 1 });
      return { head: [T(l, 'Βασικός φόρος ανά m²', 'Basic tax per m²'), $2(r.basicRate, l)], rows: [[T(l, 'Φορολογική ζώνη', 'Tax zone'), String(r.zoneBand + 1)], [T(l, 'Εκτιμώμενη αξία (εμβαδόν × τιμή ζώνης)', 'Estimated value (area × zone price)'), $(r.estimatedValue, l)], [T(l, 'ΕΝΦΙΑ (άδεια 2000, 2ος όροφος)', 'ENFIA (2000 permit, 2nd floor)'), $(r.total, l)]] }; } }),
  pension: (l) => ({ title: T(l, 'Γρήγορη εκτίμηση σύνταξης', 'Quick pension estimate'), cta: T(l, 'Πλήρης υπολογιστής σύνταξης', 'Full pension calculator'),
    inputs: [{ id: 'y', label: T(l, 'Έτη ασφάλισης', 'Years of insurance'), def: 35, max: 60 }, { id: 'a', label: T(l, 'Μέσος μισθός σταδιοδρομίας', 'Career average pay'), def: 1300, unit: '€', max: 100000 }],
    run: ({ y, a }) => { const p = pension({ years: y, avgEarnings: a });
      return { head: [T(l, 'Μικτή σύνταξη', 'Gross pension'), $(p.total, l)], rows: [[T(l, 'Ανταποδοτική', 'Contributory'), $(p.contributory, l)], [T(l, 'Εθνική', 'National'), $(p.national, l)]] }; } }),
  national: (l) => ({ title: T(l, 'Πόση εθνική σύνταξη δικαιούστε', 'How much national pension you get'), cta: T(l, 'Πλήρης υπολογιστής σύνταξης', 'Full pension calculator'),
    inputs: [{ id: 'y', label: T(l, 'Έτη ασφάλισης', 'Years of insurance'), def: 18, max: 60 }, { id: 'r', label: T(l, 'Έτη διαμονής στην Ελλάδα (15-67)', 'Years living in Greece (15-67)'), def: 40, max: 52 }],
    run: ({ y, r }) => ({ head: [T(l, 'Εθνική σύνταξη τον μήνα', 'National pension per month'), $2(nationalPension(y, r), l)], rows: [[T(l, 'Πλήρες ποσό (20 έτη, 40 έτη διαμονής)', 'Full amount (20 years, 40 years’ residence)'), $2(P.pension.national_full, l)], [T(l, 'Ποσοστό του πλήρους', 'Share of the full amount'), pct(P.pension.national_full > 0 ? nationalPension(y, r) / P.pension.national_full : 0, l)]] }) }),
  uniformed: (l) => ({ title: T(l, 'Ανταποδοτική σύνταξη με τα ποσοστά του ν. 4387/2016', 'Contributory pension with the Law 4387/2016 rates'), cta: T(l, 'Πλήρης υπολογιστής σύνταξης', 'Full pension calculator'),
    inputs: [{ id: 'y', label: T(l, 'Συντάξιμα έτη', 'Pensionable years'), def: 30, max: 60 }, { id: 'a', label: T(l, 'Μέσες συντάξιμες αποδοχές', 'Average pensionable earnings'), def: 1600, unit: '€', max: 100000 }],
    run: ({ y, a }) => { const p = pension({ years: y, avgEarnings: a });
      return { head: [T(l, 'Ανταποδοτικό μέρος', 'Contributory part'), $(p.contributory, l)], rows: [[T(l, 'Ποσοστό αναπλήρωσης', 'Accrual rate'), pct(p.rate, l)], [T(l, 'Με 3 έτη ακόμη', 'With 3 more years'), $(a * replacementRate(y + 3), l)], [T(l, 'Εθνική σύνταξη', 'National pension'), $(p.national, l)]] }; } }),
  retireage: (l) => ({ title: T(l, 'Πόσο αλλάζει η σύνταξη με κάθε χρόνο ασφάλισης', 'How each extra year changes the pension'), cta: T(l, 'Πλήρης υπολογιστής σύνταξης', 'Full pension calculator'),
    inputs: [{ id: 'y', label: T(l, 'Έτη ασφάλισης σήμερα', 'Years of insurance today'), def: 33, max: 60 }, { id: 'a', label: T(l, 'Μέσος μισθός σταδιοδρομίας', 'Career average pay'), def: 1400, unit: '€', max: 100000 }],
    run: ({ y, a }) => { const now = pension({ years: y, avgEarnings: a }), later = pension({ years: y + 1, avgEarnings: a });
      return { head: [T(l, 'Επιπλέον τον μήνα με ένα έτος ακόμη', 'Extra per month with one more year'), $(later.total - now.total, l)], rows: [[T(l, 'Σύνταξη σήμερα', 'Pension today'), $(now.total, l)], [T(l, 'Με ένα έτος ακόμη', 'With one more year'), $(later.total, l)]] }; } }),
  amount: (l) => ({ title: T(l, 'Πόσα καθαρά από ένα δώρο ή αύξηση', 'Net from a bonus or a raise'), cta: full(l),
    inputs: [gross(l, 1500), { id: 'r', label: T(l, 'Αύξηση μικτού τον μήνα', 'Monthly gross raise'), def: 100, unit: '€', max: 100000 }],
    run: ({ g, r }) => { const a = salary({ gross: g }), b = salary({ gross: g + r });
      return { head: [T(l, 'Καθαρή αύξηση ανά καταβολή', 'Net raise per payment'), $(b.net - a.net, l)], rows: [[T(l, 'Μένει από κάθε 100 € αύξηση', 'Kept from each €100 of raise'), $(r > 0 ? (b.net - a.net) / r * 100 : 0, l)], [T(l, 'Καθαρή αύξηση τον χρόνο', 'Net raise per year'), $(b.netAnnual - a.netAnnual, l)]] }; } }),
};

export function getSpec(kind: string, lang = 'el'): MiniSpec {
  const f = SPECS[kind]; if (!f) throw new Error(`mini-spec inconnu : ${kind}`); return f(lang);
}
export const MINI_KINDS = Object.keys(SPECS);
export { formatNumber };
