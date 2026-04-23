export enum NodeTypes {
  ATTACHMENT = 'ATTACHMENT',
  ANNOTATION = 'ANNOTATION',
  AUTHOR = 'AUTHOR',
  BODY_ADDRESS = 'BODY_ADDRESS',
  BODY_GREETINGS_FORMULA = 'BODY_GREETINGS_FORMULA',
  BODY_NOTE = 'BODY_NOTE',
  LANGUAGE = 'LANGUAGE',
  PERSON = 'PERSON',
  WRITER = 'WRITER',
  WRITING_ACT = 'WRITING_ACT',
  RISM_ENTRY = 'RISM_ENTRY',
  PROVENANCE_ENTRY = 'PROVENANCE_ENTRY',
  TITLE_ENTRY = 'TITLE_ENTRY',
}

export interface NodeType {
  key: NodeTypes;
  name: string;
  tagName: string;
}

export const nodeTypesMap: Record<NodeTypes, NodeType> = {
  [NodeTypes.ATTACHMENT]: { key: NodeTypes.ATTACHMENT, name: 'Beilage', tagName: 'bibl' },
  [NodeTypes.ANNOTATION]: { key: NodeTypes.ANNOTATION, name: 'Auszeichnung', tagName: '' },
  [NodeTypes.AUTHOR]: { key: NodeTypes.AUTHOR, name: 'Autor', tagName: '' },
  [NodeTypes.BODY_ADDRESS]: { key: NodeTypes.BODY_ADDRESS, name: 'Adresse (Brief)', tagName: '' },
  [NodeTypes.BODY_GREETINGS_FORMULA]: {
    key: NodeTypes.BODY_GREETINGS_FORMULA,
    name: 'Begrüßungsformel',
    tagName: '',
  },
  [NodeTypes.BODY_NOTE]: { key: NodeTypes.BODY_NOTE, name: 'Kommentar (Brief)', tagName: '' },
  [NodeTypes.PERSON]: { key: NodeTypes.PERSON, name: 'Person', tagName: '' },
  [NodeTypes.WRITING_ACT]: { key: NodeTypes.WRITING_ACT, name: 'Schreibakt', tagName: '' },
  [NodeTypes.WRITER]: { key: NodeTypes.WRITER, name: 'Schreiber', tagName: '' },
  [NodeTypes.LANGUAGE]: { key: NodeTypes.LANGUAGE, name: 'Sprache', tagName: '' },
  [NodeTypes.RISM_ENTRY]: { key: NodeTypes.RISM_ENTRY, name: 'Standort', tagName: '' },
  [NodeTypes.PROVENANCE_ENTRY]: {
    key: NodeTypes.PROVENANCE_ENTRY,
    name: 'Provenance',
    tagName: '',
  },
  [NodeTypes.TITLE_ENTRY]: { key: NodeTypes.TITLE_ENTRY, name: 'Brief', tagName: 'title' },
};

export const nodeTypes = {
  ...nodeTypesMap,

  get: (name: string): NodeType => {
    const nodeType = Object.values(nodeTypesMap).find((type) => type.key === name);
    if (!nodeType) {
      throw new Error(`Node type ${name} not found`);
    }
    return nodeType;
  },
};
