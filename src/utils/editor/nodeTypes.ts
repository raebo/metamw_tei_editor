export enum NodeTypes {
  ATTACHMENT = 'ATTACHMENT',
  WRITER = 'WRITER',
  AUTHOR = 'AUTHOR',
	PERSON = 'PERSON',
	WRITING_ACT= 'WRITING_ACT',
}

export interface NodeType {
  key: NodeTypes,
  name: string,
}

export const nodeTypesMap: Record<NodeTypes, NodeType> = {
  [NodeTypes.ATTACHMENT]: { key: NodeTypes.ATTACHMENT, name: "Beilage" },
  [NodeTypes.WRITER]: { key: NodeTypes.WRITER, name: "Schreiber" },
  [NodeTypes.AUTHOR]: { key: NodeTypes.AUTHOR, name: "Autor" },
	[NodeTypes.PERSON]: { key: NodeTypes.PERSON, name: "Person" },
	[NodeTypes.WRITING_ACT]: { key: NodeTypes.WRITING_ACT, name: "Schreibakt" },
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
