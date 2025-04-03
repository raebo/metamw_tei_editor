export const EditorConstants = {
  ALLOWED_PARENT_TAG: "div[type='act_of_writing']",
  FORBIDDEN_PARENT_TAG: "teiHeader",
  RESTRICTED_TAGS: ["persname", "placename", "date", "hi"],

  compMappingLeft: {
    SEARCH: "SEARCH",
    FAVOURITES: "FAVOURITES",
  },
  compMappingRight: {
    USER_ACTIONS: "USER_ACTIONS",
    ASSIGNED: "ASSIGNED",
    SET_FAVOURITE: "SET_FAVOURITE",
    PUBLISH_LETTER: "PUBLISH_LETTER",
    ENT_PERSON: "ENT_PERSON",
    ENT_PLACE: "ENT_PLACE",
    ENT_LETTER: "ENT_LETTER",
    ENT_CREATION: "ENT_CREATION",
    ENT_FMBC_CREATION: "ENT_FMBC_CREATION",
    ADD_SPECIAL_ANNOTATION: "ADD_SPECIAL_ANNOTATION",
  },
  dialogTypes: {
    RESET_LETTER: "RESET_LETTER",
    ADD_NOTE: "ADD_NOTE",
    EDIT_NOTE: "EDIT_NOTE",
    DATE_WHEN_ADD: "DATE_WHEN_ADD",
    ATTACHMENT_ADD: "ATTACHMENT_ADD",
    ADD_FOOTNOTE_AUTHOR: "ADD_FOOTNOTE_AUTHOR",
    SOURCE_DESC_HANDWRITING: "SOURCE_DESC_HANDWRITING",
  },

  changeTypes: {
    note: {
      ADDED: "NOTE_ADDED",
      CONTENT_CHANGED: "NOTE_CONTENT_CHANGED",
      REMOVED: "NOTE_REMOVED",
      TYPE_CHANGED: "NOTE_TYPE_CHANGED",
    },
    date : {
      WHEN_ADDED: "DATE_WHEN_ADDED",
      WHEN_MODIFIED: "DATE_WHEN_MODIFIED",
    },
    misc: {
      ATTACHMENT_ADDED: "ATTACHMENT_ADDED",
    }
  },
  attachmentTypeItems: [
    { value: "certificate", label: "Zeugnis" },
    { value: "letter", label: "Brief" },
    { value: "letter_of_recommentadion", label: "Empfehlungsschreiben" },
    { value: "notatedMusic", label: "Noten" },
    { value: "textTemplate", label: "Textvorlage" },
    { value: "drawing", label: "Zeichnung" },
    { value: "bill", label: "Rechnung" },
    { value: "print", label: "Druckerzeugnis" },
    { value: "diploma", label: "Diplom" },
    { value: "medal", label: "Orden" },
    { value: "other", label: "Sonstiges" },
  ],
  noteTypeItems: [
    { value: "these_comment", label: "Themenkommentar" },
    { value: "single_place_comment", label: "Einzelstellenkommentar" },
    { value: "text_constitution", label: "Kommentar Textkonstitution" },
    { value: "word_description", label: "Worterklärung" },
  ],
  noteTypeLanguages: [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "Englisch" },
    { value: "fr", label: "Französisch" },
    { value: "it", label: "Italienisch" },
    { value: "span", label: "Spanisch" },
    { value: "la", label: "Latein" },
    { value: "grc", label: "Altgriechisch" },
    { value: "yi", label: "Jiddisch" },
  ],
  styles: {
    panel: {
      buttonSize: "small",
    }
  }
} as const


