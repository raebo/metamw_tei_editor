import {xmlCheck} from "./xmlCheck";
import {markupGeneration} from "./markupGeneration";
import {NodeType, nodeTypes, NodeTypes} from "./nodeTypes";

interface NodeAnchestorPath {
  parentPath: string,
  nodeType: NodeType,
  afterDeleteCallback: (xmlDoc: Document, node: Node) => string
}

export const removeNodeHandles = {
  nodeAnchestorPaths(): NodeAnchestorPath[] {
    return [
      {
        parentPath: 'tei teiheader filedesc sourcedesc msDesc physDesc accMat listBibl bibl',
        nodeType: nodeTypes.get(NodeTypes.ATTACHMENT),
        afterDeleteCallback: (xmlDoc: Document, node: Node) => handleBiblNode(xmlDoc, node),
      },
    ]
  },
  getNodeAnchestorPath(node: Node): String[]{
    return [node.nodeName, ...xmlCheck.getAncestorNodeNames(node)]
  },
  findAnchestorPathNode(node: Node): NodeAnchestorPath{
    return this.findAnchestorPathEntry(
      this.getNodeAnchestorPath(node).reverse().join(" "))
  },
  findAnchestorPathEntry(path: string): NodeAnchestorPath {
    const anchestor = this.nodeAnchestorPaths().find((entry: NodeAnchestorPath) => {
      return entry.parentPath.toLowerCase() === path.toLowerCase()
    })
    
    if (!anchestor) throw new Error("No anchestor enty found for " +  path)
    
    return anchestor;
  },
  removeNode: (
    node: Node,
    callbackSuccess: (xmlDoc: Document, node: Node) => string
  ): string => {
    
    const parentNode = node.parentNode;
    
    if (!parentNode) throw new Error("No parent node found")
    
    parentNode.removeChild(node);
    
    return callbackSuccess(
      xmlCheck.createDocumentFromNodeToTeiRoot(parentNode),
      parentNode
    )
  },
}

const handleBiblNode = (xmlDoc: Document, node: Node): string => {
  if (node.childNodes.length > 0) return xmlCheck.serializeDocument(xmlDoc)
  
  const attachmentMarkup = markupGeneration.addAttachmentMarkup(
    xmlCheck.serializeDocument(xmlDoc),
    "none",
    ""
  )
  
  return attachmentMarkup.xmlString
};
