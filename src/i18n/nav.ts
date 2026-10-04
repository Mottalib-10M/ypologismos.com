import { route, AMOUNTS, type Locale } from './routes';
import { formatNumber } from '../lib/format';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const L: Record<Locale, Record<string, string>> = {
  el: { home: 'Υπολογισμός μισθού', nettogross: 'Από καθαρά σε μικτά', employer: 'Κόστος εργοδότη', road: 'Τέλη κυκλοφορίας', enfia: 'ΕΝΦΙΑ', severance: 'Αποζημίωση απόλυσης', christmas: 'Δώρο Χριστουγέννων', easter: 'Δώρο Πάσχα', leave: 'Επίδομα αδείας', pension: 'Υπολογισμός σύνταξης',
    minimum: 'Κατώτατος μισθός 2026', brackets: 'Φορολογική κλίμακα 2026', youth: 'Φόρος νέων έως 30 ετών', children: 'Μείωση φόρου για παιδιά', credit: 'Μείωση φόρου μισθωτών', efka: 'Εισφορές ΕΦΚΑ', ceiling: 'Πλαφόν εισφορών', fourteen: '14 μισθοί τον χρόνο', trienniums: 'Τριετίες', withholding: 'Παρακράτηση φόρου ΦΜΥ', parttime: 'Μερική απασχόληση', daily: 'Ημερομίσθιο', parental: 'Επίδομα γονικής άδειας', taxreturn: 'Φορολογική δήλωση', childben: 'Επίδομα παιδιού', childpay: 'Πληρωμή επιδόματος παιδιού', heating: 'Επίδομα θέρμανσης', housing: 'Επίδομα στέγασης', unemployment: 'Επίδομα ανεργίας', rentrefund: 'Επιστροφή ενοικίου', maternity: 'Επίδομα μητρότητας', student: 'Φοιτητικό στεγαστικό επίδομα', widow: 'Σύνταξη χηρείας', incometax: 'Φόρος εισοδήματος', transfer: 'Φόρος μεταβίβασης',
    roadmonth: 'Τέλη κυκλοφορίας με το μήνα', roadco2: 'Τέλη κυκλοφορίας CO₂', roadcc: 'Τέλη κυκλοφορίας με κυβικά', roadev: 'Ηλεκτρικά αυτοκίνητα', enfiadisc: 'Έκπτωση ΕΝΦΙΑ', enfiavillage: 'ΕΝΦΙΑ μικρών οικισμών', enfiains: 'ΕΝΦΙΑ και ασφάλιση κατοικίας', zone: 'Τιμή ζώνης',
    sevtable: 'Πίνακας αποζημίωσης', sevold: 'Αποζημίωση παλαιών υπαλλήλων', notice: 'Προειδοποίηση απόλυσης', sevworkers: 'Αποζημίωση εργατοτεχνιτών', national: 'Εθνική σύνταξη', uniformed: 'Σύνταξη ενστόλων', retireage: 'Όρια ηλικίας σύνταξης',
    method: 'Μεθοδολογία', faq: 'Συχνές ερωτήσεις', glossary: 'Γλωσσάρι', widget: 'Ο υπολογιστής στη σελίδα σας', about: 'Ποιοι είμαστε', contact: 'Επικοινωνία', editorial: 'Συντακτική πολιτική', privacy: 'Απόρρητο', terms: 'Όροι χρήσης', cookies: 'Cookies' },
  en: { home: 'Greek salary calculator', nettogross: 'Net to gross', employer: 'Employer cost', road: 'Road tax (teli kykloforias)', enfia: 'ENFIA property tax', severance: 'Severance pay', christmas: 'Christmas bonus', easter: 'Easter bonus', leave: 'Leave allowance', pension: 'Pension calculator',
    minimum: 'Minimum wage 2026', brackets: 'Income tax brackets 2026', youth: 'Tax for workers under 30', children: 'Tax reduction for children', credit: 'Employee tax credit', efka: 'EFKA contributions', ceiling: 'Contribution ceiling', fourteen: 'Fourteen salaries a year', trienniums: 'Seniority increments', withholding: 'Payroll tax withholding', parttime: 'Part-time pay', daily: 'Daily wage', parental: 'Parental leave benefit', taxreturn: 'Tax return', childben: 'Child benefit', childpay: 'Child benefit payment dates', heating: 'Heating allowance', housing: 'Housing benefit', unemployment: 'Unemployment benefit', rentrefund: 'Rent refund', maternity: 'Maternity benefit', student: 'Student housing allowance', widow: 'Survivors’ pension', incometax: 'Income tax calculator', transfer: 'Property transfer tax',
    roadmonth: 'Road tax per month', roadco2: 'Road tax CO₂ bands', roadcc: 'Road tax by engine size', roadev: 'Electric cars and road tax', enfiadisc: 'ENFIA reductions', enfiavillage: 'ENFIA in small settlements', enfiains: 'ENFIA and home insurance', zone: 'Zone price',
    sevtable: 'Severance table', sevold: 'Severance for long service', notice: 'Dismissal notice', sevworkers: 'Severance for manual workers', national: 'National pension', uniformed: 'Uniformed services pension', retireage: 'Retirement age',
    method: 'Methodology', faq: 'FAQ', glossary: 'Glossary', widget: 'Embed the calculator', about: 'About', contact: 'Contact', editorial: 'Editorial policy', privacy: 'Privacy', terms: 'Terms', cookies: 'Cookies' },
};
export const label = (id: string, lang: Locale) => L[lang][id] ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
export const amountLabel = (a: number, lang: Locale) => lang === 'el' ? `${formatNumber(a, 0, 'el')} € μικτά` : `€${formatNumber(a, 0, 'en')} gross`;
export function navCategories(lang: Locale): NavCategory[] {
  const el = lang === 'el';
  return [
    { label: el ? 'Υπολογιστές' : 'Calculators', links: ['home', 'nettogross', 'employer', 'christmas', 'easter', 'leave', 'severance', 'road', 'enfia', 'pension'].map((i) => link(i, lang)) },
    { label: el ? 'Επιδόματα' : 'Benefits', links: ['childben', 'childpay', 'heating', 'housing', 'unemployment', 'rentrefund', 'maternity', 'parental', 'student', 'widow'].map((i) => link(i, lang)) },
    { label: el ? 'Μισθός και φόρος' : 'Pay and tax', links: ['minimum', 'brackets', 'youth', 'children', 'credit', 'efka', 'ceiling', 'fourteen', 'trienniums', 'withholding', 'parttime', 'daily', 'taxreturn', 'incometax', 'transfer'].map((i) => link(i, lang)) },
    { label: el ? 'ΕΝΦΙΑ, τέλη, σύνταξη' : 'Cars, property, pension', links: ['roadmonth', 'roadco2', 'roadcc', 'roadev', 'enfiadisc', 'enfiavillage', 'enfiains', 'zone', 'sevtable', 'sevold', 'notice', 'sevworkers', 'national', 'uniformed', 'retireage'].map((i) => link(i, lang)) },
    { label: el ? 'Πόσα καθαρά;' : 'By salary', links: AMOUNTS.map((a) => ({ href: route(`amount-${a}`, lang), label: amountLabel(a, lang) })) },
  ];
}
export const navDirect = (lang: Locale): NavLink[] => [link('faq', lang), link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [...navCategories(lang).slice(0, 4), { label: lang === 'el' ? 'Ιστότοπος' : 'Site', links: ['about', 'contact', 'editorial', 'method', 'faq', 'glossary', 'widget', 'privacy', 'terms', 'cookies'].map((i) => link(i, lang)) }];
export const popularLinks = (lang: Locale): NavLink[] => AMOUNTS.map((a) => ({ href: route(`amount-${a}`, lang), label: amountLabel(a, lang) }));
