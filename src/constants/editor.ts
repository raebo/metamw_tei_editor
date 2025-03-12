export const EditorConstants = {
  ALLOWED_PARENT_TAG: "div[type='act_of_writing']",
  FORBIDDEN_PARENT_TAG: "teiHeader",
  RESTRICTED_TAGS: ["persname", "placename", "date", "hi"],

  compMappingLeft: {
    SEARCH: "SEARCH",
    FAVOURITES: "FAVOURITES",
  },
  compMappingRight: {
    ASSIGNED: "ASSIGNED",
    SET_FAVOURITE: "SET_FAVOURITE",
    ENT_PERSON: "ENT_PERSON",
    ENT_PLACE: "ENT_PLACE",
    ENT_LETTER: "ENT_LETTER",
    ENT_CREATION: "ENT_CREATION",
    ENT_FMBC_CREATION: "ENT_FMBC_CREATION",
    ADD_SPECIL_ANNOTATION: "ADD_SPECIL_ANNOTATION",
  },
  dialogTypes: {
    RESET_LETTER: "RESET_LETTER",
    ADD_NOTE: "ADD_NOTE",
    EDIT_NOTE: "EDIT_NOTE",
  },

  changeTypes: {
    note: {
      ADDED: "NOTE_ADDED",
      REMOVED: "NOTE_REMOVED",
      CONTENT_CHANGED: "NOTE_CONTENT_CHANGED",
      TYPE_CHANGED: "NOTE_TYPE_CHANGED",
    }
  },
  noteTypeItems: [
    { value: "these_comment", label: "Themenkommentar" },
    { value: "single_place_comment", label: "Einzelstellenkommentar" },
    { value: "text_constitution", label: "Kommentar Textkonstitution" },
    { value: "word_description", label: "Worterklärung" },
  ],
  styles: {
    panel: {
      buttonSize: "small",
    }
  }
} as const


