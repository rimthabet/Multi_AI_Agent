import packageJson from '../../package.json';

export const environment = {
  production: true,
  version: packageJson.version,

  apiUrl: '/fmsApi',
  lmsApiUrl: '/lmsApi',

  finStatementUrl: '/finStatementApi',
  keycloakConfigUrl: '/keycloakConfApi/keycloakConfApi',

  company_short_name: 'MAXULA',
  company_long_name: 'MAXULA GESTION',
  second_regulatory_funds_ratio_name: 'ratio_reglementaire_souscripteur',
  nomType: 'souscripteur',

  responsable_information: `-`,

  sgweb: '-',
  logoUrl: '/images/funds.png',

  documents_checklist_email_signature: 'Service clients',
};
