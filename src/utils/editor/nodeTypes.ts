export enum NodeTypes {
  ATTACHMENT = 'ATTACHMENT',
  WRITER = 'WRITER',
  AUTHOR = 'AUTHOR'
}

export interface NodeType {
  key: NodeTypes,
  name: string,
}

export const nodeTypesMap: Record<NodeTypes, NodeType> = {
  [NodeTypes.ATTACHMENT]: { key: NodeTypes.ATTACHMENT, name: "Beilage" },
  [NodeTypes.WRITER]: { key: NodeTypes.WRITER, name: "Schreiber" },
  [NodeTypes.AUTHOR]: { key: NodeTypes.AUTHOR, name: "Autor" },
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
