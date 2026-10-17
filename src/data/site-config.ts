/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://ypologismos.com";
export const SITE_NAMES: Record<string, string> = {"el": "Υπολογισμός", "en": "Ypologismos"};
export const LANG_TAGS: Record<string, string> = {"el": "el-GR", "en": "en-GR"};
export const OG_LOCALES: Record<string, string> = {"el": "el_GR", "en": "en_GB"};
export const LOCALE_TAG = 'el-GR';
/** Formatage des nombres par langue de page (RECETTE §4) : el-GR « 1.234,5 », en-GB « 1,234.5 ». */
export const LOCALE_BY_LANG: Record<'el' | 'en', string> = { el: 'el-GR', en: 'en-GB' };
export const CURRENCY = 'EUR';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-10-04';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"el": "Εκδότης υπολογιστών μισθού, φόρων και επιδομάτων · μισθοδοσία, ΕΦΚΑ, φόρος εισοδήματος, ΕΝΦΙΑ, τέλη κυκλοφορίας και επιδόματα", "en": "Publisher of Greek salary, tax and benefit calculators · payroll, EFKA, income tax, ENFIA, road tax and benefits"};
export const AUTHOR_DESC: Record<string, string> = {"el": "Η Radif Partners εκδίδει δωρεάν υπολογιστές μισθού και φόρων με δημοσιευμένη μέθοδο. Κάθε συντελεστής του ιστότοπου προέρχεται από τον νόμο, την ΑΑΔΕ, τον e-ΕΦΚΑ και το Υπουργείο Εργασίας, με πηγή και ημερομηνία ελέγχου.", "en": "Radif Partners publishes free Greek salary and tax calculators with a published method. Every rate on this site comes from Greek law, AADE, e-EFKA and the Ministry of Labour, with source and check date shown."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"el": ["Φόρος εισοδήματος μισθωτών", "Ασφαλιστικές εισφορές e-ΕΦΚΑ", "Δώρα εορτών και επίδομα αδείας", "Αποζημίωση απόλυσης", "ΕΝΦΙΑ", "Τέλη κυκλοφορίας", "Σύνταξη ν. 4387/2016", "Επίδομα παιδιού Α21", "Επίδομα θέρμανσης", "Επίδομα στέγασης και επιστροφή ενοικίου", "Επίδομα ανεργίας ΔΥΠΑ", "Φόρος μεταβίβασης ακινήτων"], "en": ["Greek employment income tax", "e-EFKA social security contributions", "Holiday bonuses and leave allowance", "Severance pay in Greece", "ENFIA property tax", "Greek road tax", "Greek pensions (Law 4387/2016)", "Greek child benefit (A21)", "Greek heating allowance", "Greek housing benefit and rent refund", "DYPA unemployment benefit", "Greek property transfer tax"]};
export const CONTACT_EMAIL = "contact@ypologismos.com";
export const THEME_COLOR = '#0D5EAF';
export const LOGO_SYMBOL = '€';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime de consentement : 'opt-in' = rien avant l'accord (UE, Suisse) ;
 *  'notice' = mesure d'audience active avec information préalable et retrait (CA, AU). */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
export const GA4_ID = 'G-MW14TS9KW6';
/** Projet Microsoft Clarity (compte amradif). Vide = aucun traceur ni bandeau. */
export const CLARITY_ID = 'ysy29hnoeq';
export const INDEXNOW_KEY = '379d36d7e2ce25348dbb506bdd4db315';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',  // éditeur de tous les sites du portefeuille (RECETTE §8)
  legalForm: '',  // vide : publication à titre personnel, pas de société
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "VAT",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
