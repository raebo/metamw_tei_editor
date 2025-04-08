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
    NODE_REMOVED: "NODE_REMOVED",
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
  },
  camelCaseTags: [
    "accMat", "addName", "addrLine", "addSpan", "adminInfo",
    "altGrp", "altIdent", "altIdentifier", "annotationBlock", "anyElement", "appInfo", "attDef", "attList", "attRef", "biblFull", "biblScope", "biblStruct", "binaryObject", "bindingDesc", "calendarDesc", "castGroup", "castItem", "castList", "catDesc", "catRef", "charDecl", "charName", "charProp", "citeData", "citedRange", "citeStructure", "classCode", "classDecl", "classRef", "classSpec", "constraintSpec", "correspAction", "correspContext", "correspDesc", "cRefPattern", "custEvent", "custodialHist", "damageSpan", "dataFacet", "dataRef", "dataSpec", "decoDesc", "decoNote", "defaultVal", "delSpan", "dictScrap", "divGen", "docAuthor", "docDate", "docEdition", "docImprint", "docTitle", "editionStmt", "editorialDecl", "egXML", "eLeaf", "elementRef", "elementSpec", "encodingDesc", "entryFree", "eTree", "fDecl", "fDescr", "figDesc", "fileDesc", "finalRubric", "fLib", "floatingText", "fsConstraints", "fsdDecl", "fsDecl", "fsDescr", "fsdLink", "fvLib", "genName", "geoDecl", "geogFeat", "geogName", "glyphName", "gramGrp", "handDesc", "handNote", "handNotes", "handShift", "headItem", "headLabel", "iNode", "interpGrp", "iType", "joinGrp", "lacunaEnd", "lacunaStart", "langKnowledge", "langKnown", "langUsage", "layoutDesc", "linkGrp", "listAnnotation", "listApp", "listBibl", "listChange", "listEvent", "listForest", "listNym", "listObject", "listOrg", "listPerson", "listPlace", "listPrefixDef", "listRef", "listRelation", "listTranspose", "listWit", "localName", "localProp", "locusGrp", "macroRef", "macroSpec", "measureGrp", "memberOf", "metDecl", "metSym", "modelGrp", "modelSequence", "moduleRef", "moduleSpec", "msContents", "msDesc", "msFrag", "msIdentifier", "msItem", "msItemStruct", "msName", "msPart", "musicNotation", "nameLink", "notatedMusic", "noteGrp", "notesStmt", "objectDesc", "objectIdentifier", "objectName", "objectType", "oRef", "orgName", "origDate", "origPlace", "outputRendition", "paramList", "paramSpec", "particDesc", "persName", "personGrp", "persPronouns", "physDesc", "placeName", "postBox", "postCode", "pRef", "prefixDef", "profileDesc", "projectDesc", "publicationStmt", "pubPlace", "rdgGrp", "recordHist", "recordingStmt", "refsDecl", "refState", "relatedItem", "respStmt", "revisionDesc", "roleDesc", "roleName", "samplingDecl", "schemaRef", "schemaSpec", "scriptDesc", "scriptNote", "scriptStmt", "sealDesc", "secFol", "seriesStmt", "settingDesc", "soCalled", "socecStatus", "sourceDesc", "sourceDoc", "spanGrp", "specDesc", "specGrp", "specGrpRef", "specList", "spGrp", "standOff", "stdVals", "styleDefDecl", "substJoin", "superEntry", "supportDesc", "surfaceGrp", "tagsDecl", "tagUsage", "teiCorpus", "teiHeader", "textClass", "textDesc", "textLang", "textNode", "titlePage", "titlePart", "titleStmt", "transcriptionDesc", "typeDesc", "typeNote", "unicodeName", "unicodeProp", "unihanProp", "unitDecl", "unitDef", "valDesc", "valItem", "valList", "vAlt", "variantEncoding", "vColl", "vDefault", "vLabel", "vMerge", "vNot", "vRange", "witDetail", "witEnd", "witStart", "xenoData"
  ]

} as const


