import { makeRouter, type RouteDef } from './routes-core';
export const LOCALES = ['el', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'el';
/** Montants des pages « par montant » : chacun porte un seuil propre (RECETTE §6.2, lib/amount-angles-*.ts). */
export const AMOUNTS = [1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000] as const;
const R = (id: string, el: string, en: string, noindex = false): RouteDef<Locale> => ({ id, paths: { el: `/el/${el}`, en: `/en/${en}` }, ...(noindex ? { noindex: true } : {}) });
export const ROUTES: RouteDef<Locale>[] = [
  R('home', '', ''),
  // Υπολογιστές (σελίδες εργαλεία)
  R('nettogross', 'kathara-se-mikta/', 'net-to-gross/'),
  R('employer', 'kostos-ergodoti/', 'employer-cost/'),
  R('road', 'teli-kykloforias/', 'road-tax/'),
  R('enfia', 'enfia/', 'enfia/'),
  R('severance', 'apozimiosi-apolysis/', 'severance-pay/'),
  R('christmas', 'doro-xristougennon/', 'christmas-bonus/'),
  R('easter', 'doro-pasxa/', 'easter-bonus/'),
  R('leave', 'epidoma-adeias/', 'leave-allowance/'),
  R('pension', 'ypologismos-syntaxis/', 'pension-calculator/'),
  // Οδηγοί: μισθός και φόρος
  R('minimum', 'katotatos-misthos/', 'minimum-wage/'),
  R('brackets', 'forologiki-klimaka/', 'income-tax-brackets/'),
  R('youth', 'foros-neon/', 'young-workers-tax/'),
  R('children', 'meiosi-forou-paidia/', 'tax-reduction-children/'),
  R('credit', 'meiosi-forou-misthoton/', 'employee-tax-credit/'),
  R('efka', 'eisfores-efka/', 'efka-contributions/'),
  R('ceiling', 'plafon-eisforon/', 'contribution-ceiling/'),
  R('fourteen', 'dekatessereis-misthoi/', 'fourteen-salaries/'),
  R('trienniums', 'trieties/', 'seniority-increments/'),
  R('withholding', 'parakratisi-forou/', 'payroll-tax-withholding/'),
  R('parttime', 'merikh-apasxolisi/', 'part-time-pay/'),
  R('daily', 'imeromisthio/', 'daily-wage/'),
  R('parental', 'epidoma-gonikis-adeias/', 'parental-leave-benefit/'),
  // Οδηγοί: τέλη κυκλοφορίας και ΕΝΦΙΑ
  R('roadmonth', 'teli-kykloforias-me-to-mina/', 'road-tax-per-month/'),
  R('roadco2', 'teli-kykloforias-co2/', 'road-tax-co2-bands/'),
  R('roadcc', 'teli-kykloforias-kybika/', 'road-tax-engine-size/'),
  R('roadev', 'teli-kykloforias-ilektrika/', 'road-tax-electric-cars/'),
  R('enfiadisc', 'ekptosi-enfia/', 'enfia-reductions/'),
  R('enfiavillage', 'enfia-mikroi-oikismoi/', 'enfia-small-settlements/'),
  R('enfiains', 'enfia-asfalisi-katoikias/', 'enfia-home-insurance/'),
  R('zone', 'timi-zonis/', 'zone-price/'),
  // Οδηγοί: απόλυση και σύνταξη
  R('sevtable', 'pinakas-apozimiosis/', 'severance-table/'),
  R('sevold', 'apozimiosi-palaion-ypallilon/', 'severance-long-service/'),
  R('notice', 'proeidopoiisi-apolysis/', 'dismissal-notice/'),
  R('sevworkers', 'apozimiosi-ergatotexniton/', 'severance-manual-workers/'),
  R('national', 'ethniki-syntaxi/', 'national-pension/'),
  R('uniformed', 'syntaxi-enstolon/', 'uniformed-services-pension/'),
  R('retireage', 'oria-ilikias-syntaxis/', 'retirement-age/'),
  // Σελίδες «πόσα καθαρά από Χ μικτά»
  ...AMOUNTS.map((a) => R(`amount-${a}`, `${a}-mikta-se-kathara/`, `${a}-euro-gross-to-net/`)),
  // Σελίδες υπηρεσίας
  R('method', 'methodologia/', 'methodology/'),
  R('faq', 'faq/', 'faq/'),
  R('glossary', 'glossary/', 'glossary/', true),
  R('widget', 'widget/', 'widget/', true),
  R('about', 'about/', 'about/', true),
  R('contact', 'contact/', 'contact/', true),
  R('editorial', 'editorial-policy/', 'editorial-policy/', true),
  R('privacy', 'privacy/', 'privacy/', true),
  R('terms', 'terms/', 'terms/', true),
  R('cookies', 'cookies/', 'cookies/', true),
];
export const { NOINDEX_PATHS, route, altPaths } = makeRouter(LOCALES, ROUTES);
