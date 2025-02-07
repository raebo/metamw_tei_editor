type AutoAnnoLetterStatus = "open" | "ready_to_check" | "checked_with_success" | "error";

type EntityStatus = {
  AutoAnnoLetter: AutoAnnoLetterStatus;
}

const Statuses = {
  AutoAnnoLetter: {
    OPEN: 'open',
    READY_TO_CHECK: 'ready_to_check',
    CHECKED_WITH_SUCCESS: 'checked_with_success',
    ERROR: 'error'
  }
}

type StatusesType = typeof Statuses; // Create a type from the Statuses object for additional type safety.


const DISPLAY_NAME_MAP: { [key: string]: string } = {
  id: "ID",
  key: "Key",
  full_name: "Name Komplett",
  display_name: "Name (Display ",
  birth_alt: "Geburt (Alt)",
  death_alt: "Tot (Alt)",
  birth: "Geburt ",
  baptism: "Taufe ",
  baptism_date: "Taufe (Datum)",
  place_of_birth: "Geburtsort",
  place_of_death: "Todesort",
  death: "Tod ",
  gender: "Geschlecht",
  background: "Hintergr.",
  relation: "Beziehung",
  volumes: "Volumes" ,
  msb_supplement: "MSB",
  birth_name: "Geburtsname",
  birth_date: "Datum (Geb)",
  death_date: "Datum (Tod)",
  married_to: "Verheiratet mit",
  name: "Name",
  kind: "Art",
  info: "Info",
  notes: "Notizen",
  data: "Daten",
  gnd: "GND",
  index_name: "Name (Index)",
  misc_settlement_name: "Name (Ort)",
  country_name: "Name (Land)",
}

export { Statuses, DISPLAY_NAME_MAP};
