type AutoAnnoLetterStatus = 'open' | 'ready_to_check' | 'checked_with_success' | 'error';

type EntityStatus = {
  AutoAnnoLetter: AutoAnnoLetterStatus;
};

const Statuses = {
  AutoAnnoLetter: {
    OPEN: 'open',
    READY_TO_CHECK: 'ready_to_check',
    CHECKED_WITH_SUCCESS: 'checked_with_success',
    ERROR: 'error',
  },
};

type StatusesType = typeof Statuses; // Create a type from the Statuses object for additional type safety.

const DISPLAY_NAME_MAP: { [key: string]: string } = {
  background: 'Hintergr.',
  baptism: 'Taufe ',
  baptism_date: 'Taufe (Datum)',
  birth: 'Geburt ',
  birth_alt: 'Geburt (Alt)',
  birth_name: 'Geburtsname',
  birth_date: 'Datum (Geb)',
  country_name: 'Name (Land)',
  data: 'Daten',
  death_alt: 'Tot (Alt)',
  death_date: 'Datum (Tod)',
  death: 'Tod ',
  gender: 'Geschlecht',
  display_name: 'Name (Display ',
  full_name: 'Name Komplett',
  gnd: 'GND',
  id: 'ID',
  index_name: 'Name (Index)',
  info: 'Info',
  key: 'Key',
  kind: 'Art',
  married_to: 'Verheiratet mit',
  misc_settlement_name: 'Name (Ort)',
  msb_supplement: 'MSB',
  notes: 'Notizen',
  name: 'Name',
  place_of_birth: 'Geburtsort',
  place_of_death: 'Todesort',
  protag_creation_category: 'Kategorie',
  protag_creation_category_list: 'Kategorie (Hierarchie)',
  relation: 'Beziehung',
  settlement: 'Ortschaft',
  volumes: 'Volumes',
};

export { Statuses, DISPLAY_NAME_MAP };
