import type { Locale } from './routes';
const en = {
  updatedOn: 'Updated on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Checked by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Frequently asked questions', relatedCalculators: 'Related calculators and guides', sourcesTitle: 'Sources', writtenBy: 'Written by',
  asOf: 'Rates', lastUpdated: 'last updated', footerValidated: 'Official Greek rates (law, e-EFKA, Ministry of Labour)', footerBrowser: '100 % in your browser · no data sent · free',
  footerDisclaimer: 'Estimates only. Your payslip, e-EFKA and AADE are authoritative; this is not tax or legal advice.', footerPopular: 'Popular calculations', notFound: 'This page does not exist.',
};
const el: typeof en = {
  updatedOn: 'Ενημέρωση:', editorialPolicy: 'Συντακτική πολιτική', contactLabel: 'Επικοινωνία', reviewedBy: 'Έλεγχος από',
  skipToContent: 'Μετάβαση στο περιεχόμενο', mainNav: 'Κύρια πλοήγηση', breadcrumbLabel: 'Διαδρομή', breadcrumbHome: 'Αρχική', menuOpen: 'Άνοιγμα μενού',
  faqTitle: 'Συχνές ερωτήσεις', relatedCalculators: 'Σχετικοί υπολογιστές και οδηγοί', sourcesTitle: 'Πηγές', writtenBy: 'Συντάκτης:',
  asOf: 'Συντελεστές', lastUpdated: 'τελευταία ενημέρωση', footerValidated: 'Επίσημοι συντελεστές (νόμος, e-ΕΦΚΑ, Υπουργείο Εργασίας)', footerBrowser: '100 % στον browser σας · κανένα δεδομένο δεν αποστέλλεται · δωρεάν',
  footerDisclaimer: 'Ενδεικτικοί υπολογισμοί. Δεσμευτικά είναι η μισθοδοσία, ο e-ΕΦΚΑ και η ΑΑΔΕ· δεν αποτελούν φορολογική ή νομική συμβουλή.', footerPopular: 'Δημοφιλείς υπολογισμοί', notFound: 'Η σελίδα δεν υπάρχει.',
};
export function t(lang: Locale) { return lang === 'en' ? en : el; }
