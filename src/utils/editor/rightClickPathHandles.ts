import { xmlCheck } from './xmlCheck';
import { markupGeneration } from './markupGeneration';
import { NodeType, nodeTypes, NodeTypes } from './nodeTypes';
import { MenuItemType } from '@src/components/editor/letter/Util/ContextMenuLetterItems';
import { EditorUtils } from './index';
import { EditorConstants } from '@src/constants/editor';

export interface NodeAncestorPath {
  parentPath: string | string[];
  nodeType: NodeType;
  checkElementDetails: (node: Element) => boolean;
  deleteNodeCallback?: (node: Element) => Node;
  afterActionCallback: (xmlDoc: Document, node: Node) => string;
  checkAttributes?: (node: Element) => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace rightClickPathHandles {
  export const deletableAncestorPaths = (): NodeAncestorPath[] => [
    {
      parentPath: [
        'tei teiheader filedesc sourcedesc msDesc msIdentifier country',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier settlement',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier institution',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier repository',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier collection',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier idno',
      ],
      nodeType: nodeTypes.get(NodeTypes.RISM_ENTRY),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      deleteNodeCallback: (node: Element): Node => {
        const nodeToDelete = node.parentNode;
        const baseNode = nodeToDelete?.parentNode;

        if (!nodeToDelete || !baseNode)
          throw new Error('rightClickPathHandles nodeToDelete or baseNode cannot be null');

        baseNode.removeChild(nodeToDelete);

        return baseNode;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => {
        return xmlCheck.serializeDocument(xmlDoc);
      },
    },
    {
      parentPath: ['tei teiheader filedesc sourcedesc msDesc history provenance p'],
      nodeType: nodeTypes.get(NodeTypes.PROVENANCE_ENTRY),
      checkElementDetails: (nodeElement: Element): boolean => {
        return true;
      },
      deleteNodeCallback: (node: Element): Node => {
        let baseParentNode: Node | undefined | null = null;
        let nodeToDelete: Node | undefined | null = null;

        if (node.tagName.toLowerCase() === 'p') {
          baseParentNode = node.parentNode?.parentNode;
          nodeToDelete = node.parentNode;
        } else if (node.tagName.toLowerCase() === 'provenance') {
          baseParentNode = node.parentNode;
          nodeToDelete = node;
        }

        if (!baseParentNode)
          throw new Error('rightClickPathHandles deleteNodeCallback No parent node found');
        if (!nodeToDelete)
          throw new Error('rightClickPathHandles deleteNodeCallback No node to delete found');

        baseParentNode.removeChild(nodeToDelete);

        return baseParentNode;
      },
      afterActionCallback: (xmlDoc: Document, node: Node) => {
        return xmlCheck.serializeDocument(xmlDoc);
      },
    },
    {
      parentPath: 'tei teiheader filedesc sourcedesc msDesc physDesc accMat listBibl bibl',
      nodeType: nodeTypes.get(NodeTypes.ATTACHMENT),
      checkElementDetails: (nodeElement: Element): boolean => {
        const typeValue = nodeElement.getAttribute('type');
        return !!(typeValue && typeValue !== 'none');
      },
      afterActionCallback: (xmlDoc: Document, node: Node) => {
        handleBiblNode(xmlDoc, node);
        return xmlCheck.serializeDocument(xmlDoc);
      },
    },
    {
      parentPath: 'tei teiheader profiledesc correspdesc correspaction persname',
      nodeType: nodeTypes.get(NodeTypes.PERSON),
      checkElementDetails: () => true,
      afterActionCallback: (xmlDoc: Document) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div p note',
      nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: ['tei text body div p seg', 'tei text body div seg', 'tei text body div seg seg'],
      nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        const pageBreak = _nodeElement.getAttribute('type');

        if (!pageBreak) return false;
        return pageBreak.toLowerCase() === 'pagebreak';
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => {
        EditorUtils.contentFlow.reorderExistingPageBreaks(xmlDoc);

        return xmlCheck.serializeDocument(xmlDoc);
      },
    },
    {
      parentPath: 'tei text body div note',
      nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageWritingActPaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei text body div',
      nodeType: nodeTypes.get(NodeTypes.WRITING_ACT),
      checkElementDetails: (nodeElement: Element): boolean => {
        // console.log("Checking writing act for", nodeElement.nodeName.toLowerCase() === 'div' && nodeElement.getAttribute("type") === "act_of_writing");
        return (
          nodeElement.nodeName.toLowerCase() === 'div' &&
          nodeElement.getAttribute('type') === 'act_of_writing'
        );
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageRismEntryPaths = (): NodeAncestorPath[] => [
    {
      parentPath: [
        'tei teiheader filedesc sourcedesc msDesc msIdentifier country',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier settlement',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier institution',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier repository',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier collection',
        'tei teiheader filedesc sourcedesc msDesc msIdentifier idno',
      ],
      nodeType: nodeTypes.get(NodeTypes.LANGUAGE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageProvenanceEntryPaths = (): NodeAncestorPath[] => [
    {
      parentPath: [
        'tei teiheader filedesc sourcedesc msDesc history provenance',
        'tei teiheader filedesc sourcedesc msDesc history provenance p',
      ],
      nodeType: nodeTypes.get(NodeTypes.PROVENANCE_ENTRY),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageHeaderLanguagesPaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei teiheader profiledesc langusage language',
      nodeType: nodeTypes.get(NodeTypes.LANGUAGE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei teiheader profiledesc langusage',
      nodeType: nodeTypes.get(NodeTypes.LANGUAGE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageBodyNotePaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei text body div note',
      nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div p note',
      nodeType: nodeTypes.get(NodeTypes.BODY_NOTE),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const removeAnnotationFromNOde = (): NodeAncestorPath[] => [
    {
      parentPath: [
        'tei text body div p persName',
        'tei text body div p placeName',
        'tei text body div p title',
        'tei text body div p date',
      ],
      nodeType: nodeTypes.get(NodeTypes.ANNOTATION),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageGreetingsFormulaPaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei text body div p',
      nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div salute',
      nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div dateline date',
      nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div signed',
      nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div seg',
      nodeType: nodeTypes.get(NodeTypes.BODY_GREETINGS_FORMULA),
      checkElementDetails: (nodeElement: Element): boolean => {
        const typeAttr = nodeElement.getAttribute('type');

        if (!typeAttr) return false;
        return typeAttr.toLowerCase() === 'closer';
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageTextLetterAddressPaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei text body div head address addrline hi',
      nodeType: nodeTypes.get(NodeTypes.BODY_ADDRESS),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
        // return nodeElement.nodeName.toLowerCase() === "div" && (nodeElement.getAttribute("type") === "address" || nodeElement.getAttribute("type") === "sender_address");
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div p address addrline',
      nodeType: nodeTypes.get(NodeTypes.BODY_ADDRESS),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
        // return nodeElement.nodeName.toLowerCase() === "div" && (nodeElement.getAttribute("type") === "address" || nodeElement.getAttribute("type") === "sender_address");
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
    {
      parentPath: 'tei text body div head p address addrline',
      nodeType: nodeTypes.get(NodeTypes.BODY_ADDRESS),
      checkElementDetails: (_nodeElement: Element): boolean => {
        return true;
        // return nodeElement.nodeName.toLowerCase() === "div" && (nodeElement.getAttribute("type") === "address" || nodeElement.getAttribute("type") === "sender_address");
      },
      afterActionCallback: (xmlDoc: Document, _node: Node) => xmlCheck.serializeDocument(xmlDoc),
    },
  ];

  export const manageAuthorWriterAncestorPaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei teiheader profiledesc correspdesc correspaction persname',
      nodeType: nodeTypes.get(NodeTypes.PERSON),
      checkElementDetails: () => true,
      checkAttributes: (nodeElement: Element): boolean => {
        const parentNode = nodeElement.parentNode as Element;
        return parentNode.getAttribute('type') === 'sent';
      },
      afterActionCallback: () => '',
    },
    {
      parentPath: 'tei teiheader filedesc titlestmt author',
      nodeType: nodeTypes.get(NodeTypes.AUTHOR),
      checkElementDetails: () => true,
      afterActionCallback: () => '',
    },
    {
      parentPath: 'tei teiheader filedesc titlestmt respstmt persname',
      nodeType: nodeTypes.get(NodeTypes.PERSON),
      checkElementDetails: () => true,
      afterActionCallback: () => '',
    },
  ];

  export const manageReceiverAncestorPaths = (): NodeAncestorPath[] => [
    {
      parentPath: 'tei teiheader profiledesc correspdesc correspaction persname',
      nodeType: nodeTypes.get(NodeTypes.PERSON),
      checkElementDetails: () => true,
      checkAttributes: (nodeElement: Element): boolean => {
        const parentNode = nodeElement.parentNode as Element;
        return parentNode.getAttribute('type') === 'received';
      },
      afterActionCallback: () => '',
    },
  ];

  export const getNodeAncestorPath = (node: Node): string[] => [
    node.nodeName,
    ...xmlCheck.getAncestorNodeNames(node),
  ];

  export const findAncestorPathNode = (node: Node): NodeAncestorPath => {
    const path = getNodeAncestorPath(node).reverse().join(' ');
    return findAncestorPathEntry(path);
  };

  export const findAncestorPathEntry = (path: string): NodeAncestorPath => {
    const ancestor = deletableAncestorPaths().find((entry) => {
      if (Array.isArray(entry.parentPath)) {
        return entry.parentPath.some((p) => p.toLowerCase() === path.toLowerCase());
      }
      return entry.parentPath.toLowerCase() === path.toLowerCase();
    });

    if (!ancestor) throw new Error('No ancestor entry found for ' + path);

    return ancestor;
  };

  export const removeNode = (
    node: Node,
    onSuccess: (xmlDoc: Document, node: Node) => string,
    deleteStrategy: (node: Element) => Node = (n) => {
      const parent = n.parentNode;
      if (!parent) throw new Error('No parent node found');
      parent.removeChild(n);
      return parent;
    },
  ): string => {
    const baseNode = deleteStrategy(node as Element);

    return onSuccess(xmlCheck.createDocumentFromNodeToTeiRoot(baseNode), baseNode);
  };

  export const pathHandlerFactory = (menuItemsNoMarking: MenuItemType[]) => [
    {
      paths: EditorUtils.rightClickPathHandles.removeAnnotationFromNOde(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.REMOVE_ANNOTATION,
        );
        return item ? [item] : [];
      },
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageRismEntryPaths(),
      getMenuItems: (_node: Node) => [
        menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.MANAGE_RISM_ENTRY,
        ),
      ],
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageProvenanceEntryPaths(),
      getMenuItems: (_node: Node) => [
        menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.MANAGE_PROVENANCE_ENTRY,
        ),
      ],
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageWritingActPaths(),
      getMenuItems: (node: Node) =>
        [
          menuItemsNoMarking.find(
            (i) => i.identifier === EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_AUTHOR_WRITER,
          )!,
          menuItemsNoMarking.find(
            (i) =>
              i.identifier === EditorUtils.miscContentCheck.nodeRightClickMenu(node, 'MOVE_UP'),
          )!,
          menuItemsNoMarking.find(
            (i) =>
              i.identifier === EditorUtils.miscContentCheck.nodeRightClickMenu(node, 'MOVE_DOWN'),
          )!,
        ].filter(Boolean) as MenuItemType[],
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageGreetingsFormulaPaths(),
      getMenuItems: (node: Node) =>
        [
          menuItemsNoMarking.find(
            (i) => i.identifier === EditorConstants.menuItemTypes.WRITING_ACT.ADD_GREETINGS_FORMULA,
          )!,
          menuItemsNoMarking.find(
            (i) => i.identifier === EditorUtils.miscContentCheck.nodeRightClickMenu(node, 'SALUTE'),
          )!,
        ].filter(Boolean) as MenuItemType[],
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageBodyNotePaths(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.WRITING_ACT.EDIT_NOTE,
        );
        return item ? [item] : [];
      },
    },
    {
      paths: EditorUtils.rightClickPathHandles.deletableAncestorPaths(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.DELETE_NODE,
        );
        return item ? [item] : [];
      },
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageAuthorWriterAncestorPaths(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.MANAGE_WRITER_AUTHOR_HEADER,
        );
        return item ? [item] : [];
      },
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageTextLetterAddressPaths(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.MANAGE_TEXT_ADDRESS,
        );
        return item ? [item] : [];
      },
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageHeaderLanguagesPaths(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.MANAGE_HEADER_LANGUAGES,
        );
        return item ? [item] : [];
      },
    },
    {
      paths: EditorUtils.rightClickPathHandles.manageReceiverAncestorPaths(),
      getMenuItems: (_node: Node) => {
        const item = menuItemsNoMarking.find(
          (i) => i.identifier === EditorConstants.menuItemTypes.MANAGE_RECEIVER,
        );
        return item ? [item] : [];
      },
    },
  ];
}

// --- helper for attachments
const handleBiblNode = (xmlDoc: Document, node: Node) => {
  if (node.childNodes.length > 0) return xmlCheck.serializeDocument(xmlDoc);

  markupGeneration.addAttachmentMarkup(xmlDoc, 'none', '');
};
