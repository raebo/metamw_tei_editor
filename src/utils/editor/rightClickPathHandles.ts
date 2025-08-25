import {xmlCheck} from "./xmlCheck";
import {markupGeneration} from "./markupGeneration";
import {NodeType, nodeTypes, NodeTypes} from "./nodeTypes";

export interface NodeAnchestorPath {
	parentPath: string;
	nodeType: NodeType;
	checkElementDetails: (node: Element) => boolean;
	afterActionCallback: (xmlDoc: Document, node: Node) => string;
	checkAttributes?: (node: Element) => boolean;
}

export namespace rightClickPathHandles {
	export const deletableAnchestorPaths = (): NodeAnchestorPath[] => [
		{
			parentPath: "tei teiheader filedesc sourcedesc msDesc physDesc accMat listBibl bibl",
			nodeType: nodeTypes.get(NodeTypes.ATTACHMENT),
			checkElementDetails: (nodeElement: Element): boolean => {
				const typeValue = nodeElement.getAttribute("type");
				return !!(typeValue && typeValue !== "none");
			},
			afterActionCallback: (xmlDoc: Document, node: Node) =>
				handleBiblNode(xmlDoc, node),
		},
		{
			parentPath: "tei teiheader profiledesc correspdesc correspaction persname",
			nodeType: nodeTypes.get(NodeTypes.PERSON),
			checkElementDetails: () => true,
			afterActionCallback: (xmlDoc: Document) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
	];

	export const manageAuthorWriterAnchestorPaths = (): NodeAnchestorPath[] => [
		{
			parentPath: "tei teiheader profiledesc correspdesc correspaction persname",
			nodeType: nodeTypes.get(NodeTypes.PERSON),
			checkElementDetails: () => true,
			checkAttributes: (nodeElement: Element) :boolean => {
				const parentNode = nodeElement.parentNode as Element;
				return parentNode.getAttribute("type") === "sent"
			},
			afterActionCallback: () => "",
		},
		{
			parentPath: "tei teiheader filedesc titlestmt author",
			nodeType: nodeTypes.get(NodeTypes.AUTHOR),
			checkElementDetails: () => true,
			afterActionCallback: () => "",
		},
		{
			parentPath: "tei teiheader filedesc titlestmt respstmt persname",
			nodeType: nodeTypes.get(NodeTypes.PERSON),
			checkElementDetails: () => true,
			afterActionCallback: () => "",
		},
	];

	export const manageReceiverAnchestorPaths = (): NodeAnchestorPath[] => [
		{
			parentPath: "tei teiheader profiledesc correspdesc correspaction persname",
			nodeType: nodeTypes.get(NodeTypes.PERSON),
			checkElementDetails: () => true,
			checkAttributes: (nodeElement: Element) :boolean => {
				const parentNode = nodeElement.parentNode as Element;
				return parentNode.getAttribute("type") === "received"
			},
			afterActionCallback: () => "",
		},
	];

	export const getNodeAnchestorPath = (node: Node): string[] => [
		node.nodeName,
		...xmlCheck.getAncestorNodeNames(node),
	];

	export const findAnchestorPathNode = (node: Node): NodeAnchestorPath => {
		const path = getNodeAnchestorPath(node).reverse().join(" ");
		return findAnchestorPathEntry(path);
	};

	export const findAnchestorPathEntry = (path: string): NodeAnchestorPath => {
		const anchestor = deletableAnchestorPaths().find(
			(entry) => entry.parentPath.toLowerCase() === path.toLowerCase()
		);

		if (!anchestor)
			throw new Error("No anchestor entry found for " + path);

		return anchestor;
	};

	export const removeNode = (
		node: Node,
		callbackSuccess: (xmlDoc: Document, node: Node) => string
	): string => {
		const parentNode = node.parentNode;
		if (!parentNode) throw new Error("No parent node found");

		parentNode.removeChild(node);

		return callbackSuccess(
			xmlCheck.createDocumentFromNodeToTeiRoot(parentNode),
			parentNode
		);
	};
}

// --- helper for attachments
const handleBiblNode = (xmlDoc: Document, node: Node): string => {
	if (node.childNodes.length > 0)
		return xmlCheck.serializeDocument(xmlDoc);

	const attachmentMarkup = markupGeneration.addAttachmentMarkup(
		xmlCheck.serializeDocument(xmlDoc),
		"none",
		""
	);

	return attachmentMarkup.xmlString;
};
