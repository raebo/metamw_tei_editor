export enum NodeTypes {
  ATTACHMENT = 'ATTACHMENT',
	AUTHOR = 'AUTHOR',
	BODY_ADDRESS = 'BODY_ADDRESS',
	BODY_GREETINGS_FORMULA = 'BODY_GREETINGS_FORMULA',
	BODY_NOTE = 'BODY_NOTE',
	LANGUAGE = 'LANGUAGE',
	PERSON = 'PERSON',
	WRITER = 'WRITER',
	WRITING_ACT= 'WRITING_ACT',
}

export interface NodeType {
  key: NodeTypes,
  name: string,
}

export const nodeTypesMap: Record<NodeTypes, NodeType> = {
  [NodeTypes.ATTACHMENT]: { key: NodeTypes.ATTACHMENT, name: "Beilage" },
	[NodeTypes.AUTHOR]: { key: NodeTypes.AUTHOR, name: "Autor" },
	[NodeTypes.BODY_ADDRESS]: { key: NodeTypes.BODY_ADDRESS, name: "Adresse (Brief)" },
	[NodeTypes.BODY_GREETINGS_FORMULA]: { key: NodeTypes.BODY_GREETINGS_FORMULA, name: "Begrüßungsformel" },
	[NodeTypes.BODY_NOTE]: { key: NodeTypes.BODY_NOTE, name: "Kommentar (Brief)" },
	[NodeTypes.PERSON]: { key: NodeTypes.PERSON, name: "Person" },
	[NodeTypes.WRITING_ACT]: { key: NodeTypes.WRITING_ACT, name: "Schreibakt" },
	[NodeTypes.WRITER]: { key: NodeTypes.WRITER, name: "Schreiber" },
	[NodeTypes.LANGUAGE]: { key: NodeTypes.LANGUAGE, name: "Sprache" },
}

export const nodeTypes = {
  ...nodeTypesMap,

  get: (name: string): NodeType => {
    const nodeType = Object.values(nodeTypesMap).find((type) => type.key === name);
    if (!nodeType) {
      throw new Error(`Node type ${name} not found`);
    }
    return nodeType;
  }
}
