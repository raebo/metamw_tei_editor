interface NodeAnchestorPath {
  parentPath: string,
  afterDeleteCallback: (node: Element) => void,
}


export const removeNodeHandles = {
  nodeAnchestorPaths: () : NodeAnchestorPath[] => {
    return [
      { parentPath: 'tei teiheader filedesc sourcedesc msDesc physDesc accMat listBibl bibl', afterDeleteCallback: (node: Element) => handleBiblNode(node) },
      ] as NodeAnchestorPath[]
  },
  removeNode: (node: Element) => {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  },
  removeAllNodes: (parentNode: Element) => {
    while (parentNode.firstChild) {
      parentNode.removeChild(parentNode.firstChild);
    }
  },
}

const handleBiblNode = (node: Element) => {
  console.log("handleBiblNode", node);
};
