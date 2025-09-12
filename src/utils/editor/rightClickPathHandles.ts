import {xmlCheck} from "./xmlCheck";
import {markupGeneration} from "./markupGeneration";
import {NodeType, nodeTypes, NodeTypes} from "./nodeTypes";

export interface NodeAncestorPath {
	parentPath: string;
	nodeType: NodeType;
	checkElementDetails: (node: Element) => boolean;
	afterActionCallback: (xmlDoc: Document, node: Node) => string;
	checkAttributes?: (node: Element) => boolean;
}

export namespace rightClickPathHandles {
	export const deletableAncestorPaths = (): NodeAncestorPath[] => [
		{
			parentPath: "tei teiheader filedesc sourcedesc msDesc physDesc accMat listBibl bibl",
			nodeType: nodeTypes.get(NodeTypes.ATTACHMENT),
			checkElementDetails: (nodeElement: Element): boolean => {
				const typeValue = nodeElement.getAttribute("type");
				return !!(typeValue && typeValue !== "none");
			},
			afterActionCallback: (xmlDoc: Document, node: Node) => {
				handleBiblNode(xmlDoc, node)
				return xmlCheck.serializeDocument(xmlDoc)
			}
		},
		{
			parentPath: "tei teiheader profiledesc correspdesc correspaction persname",
			nodeType: nodeTypes.get(NodeTypes.PERSON),
			checkElementDetails: () => true,
			afterActionCallback: (xmlDoc: Document) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: 'tei text body div p note',
			nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: 'tei text body div note',
			nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
	];

	export const manageWritingActPaths = (): NodeAncestorPath[] => [
		{
			parentPath: "tei text body div",
			nodeType: nodeTypes.get(NodeTypes.WRITING_ACT),
			checkElementDetails: (nodeElement: Element): boolean => {
				// console.log("Checking writing act for", nodeElement.nodeName.toLowerCase() === 'div' && nodeElement.getAttribute("type") === "act_of_writing");
				return nodeElement.nodeName.toLowerCase() === "div" && nodeElement.getAttribute("type") === "act_of_writing";
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		}
	]

	export const manageHeaderLanguagesPaths = (): NodeAncestorPath[] => [
		{
			parentPath: "tei teiheader profiledesc langusage language",
			nodeType: nodeTypes.get(NodeTypes.LANGUAGE),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei teiheader profiledesc langusage",
			nodeType: nodeTypes.get(NodeTypes.LANGUAGE),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		}
	]

	export const manageBodyNotePaths = (): NodeAncestorPath[] => [
		{
			parentPath: "tei text body div note",
			nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div p note",
			nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
	]

	export const manageGreetingsFormulaPaths = (): NodeAncestorPath[] => [
		{
			parentPath: "tei text body div p",
			nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div salute",
			nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div dateline date",
			nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div signed",
			nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div seg",
			nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
			checkElementDetails: (nodeElement: Element): boolean => {
				const typeAttr= nodeElement.getAttribute("type");

				if (!typeAttr) return false;
				return typeAttr.toLowerCase() === "closer";
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
	]


	export const manageTextLetterAddressPaths = (): NodeAncestorPath[] => [
		{
			parentPath: "tei text body div head address addrline hi",
			nodeType: nodeTypes.get(NodeTypes.BODY_ADDRESS),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
				// return nodeElement.nodeName.toLowerCase() === "div" && (nodeElement.getAttribute("type") === "address" || nodeElement.getAttribute("type") === "sender_address");
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div p address addrline",
			nodeType: nodeTypes.get(NodeTypes.BODY_ADDRESS),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
				// return nodeElement.nodeName.toLowerCase() === "div" && (nodeElement.getAttribute("type") === "address" || nodeElement.getAttribute("type") === "sender_address");
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
		{
			parentPath: "tei text body div head p address addrline",
			nodeType: nodeTypes.get(NodeTypes.BODY_ADDRESS),
			checkElementDetails: (_nodeElement: Element): boolean => {
				return true
				// return nodeElement.nodeName.toLowerCase() === "div" && (nodeElement.getAttribute("type") === "address" || nodeElement.getAttribute("type") === "sender_address");
			},
			afterActionCallback: (xmlDoc: Document, _node: Node) =>
				xmlCheck.serializeDocument(xmlDoc),
		},
	]

	export const manageAuthorWriterAncestorPaths = (): NodeAncestorPath[] => [
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

	export const manageReceiverAncestorPaths = (): NodeAncestorPath[] => [
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

	export const getNodeAncestorPath = (node: Node): string[] => [
		node.nodeName,
		...xmlCheck.getAncestorNodeNames(node),
	];

	export const findAncestorPathNode = (node: Node): NodeAncestorPath => {
		const path = getNodeAncestorPath(node).reverse().join(" ");
		return findAncestorPathEntry(path);
	};

	export const findAncestorPathEntry = (path: string): NodeAncestorPath => {
		const ancestor = deletableAncestorPaths().find(
			(entry) => entry.parentPath.toLowerCase() === path.toLowerCase()
		);

		if (!ancestor) throw new Error("No ancestor entry found for " + path);

		return ancestor;
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
const handleBiblNode = (xmlDoc: Document, node: Node) => {
	if (node.childNodes.length > 0)
		return xmlCheck.serializeDocument(xmlDoc);

	markupGeneration.addAttachmentMarkup(
		(xmlDoc),
		"none",
		""
	);
};
