import { EditorConstants, MenuItem } from './editor';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '../utils/editor';
import {
  setDialogType,
  setEditorLetterActOfWriting,
  setReloadLetterContent,
  setSelectedIdentifier,
  setXmlLetterContent,
} from '../redux/slices/editor.letter.slice';
import { MiscUtils } from '../utils/misc';
import { setEditorDialogAndReferenceThunk } from '../redux/thunks/editor.letter.thunk';

export const getMenuItemsNoMarking = (
  dispatch: any,
  stateEditorLetter: any,
  xmlDocRef: React.MutableRefObject<XMLDocument | null>,
): MenuItem[] => [
  {
    identifier: EditorConstants.menuItemTypes.MANAGE_RISM_ENTRY,
    label: 'RISM Eintrag Bearbeiten',
    action: async ({ node }: { node?: Node }) => {
      if (!node) {
        enqueueSnackbar('The given node is undefined', { variant: 'error' });
        return;
      }

      const msIdentifierNode = node.parentNode as Element | null;

      if (!msIdentifierNode || msIdentifierNode.tagName.toUpperCase() !== 'MSIDENTIFIER') {
        enqueueSnackbar('Parent is not an <msIdentifier> node', { variant: 'error' });
        return;
      }

      const msDescNode = msIdentifierNode.parentNode as Element | null;
      if (!msDescNode || msDescNode.tagName.toUpperCase() !== 'MSDESC') {
        enqueueSnackbar('Parent is not an <msDesc> node', { variant: 'error' });
        return;
      }

      const children = Array.from(msDescNode.childNodes).filter(
        (n): n is Element =>
          n.nodeType === 1 && (n as Element).tagName.toUpperCase() === 'MSIDENTIFIER',
      );

      const index = children.indexOf(msIdentifierNode);

      if (index === -1 || index >= children.length) {
        enqueueSnackbar('Children is not an <msIdentifier> node', { variant: 'error' });
        return;
      }

      dispatch(setSelectedIdentifier({ selectedIdentifier: index }));
      dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_RISM_ENTRY }));
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.MANAGE_PROVENANCE_ENTRY,
    label: 'Provenienz Eintrag Bearbeiten',
    action: async ({ node }: { node?: Node }) => {
      if (!node) {
        enqueueSnackbar('The given node is undefined', { variant: 'error' });
        return;
      }

      console.log('clicked node tag name: ', (node as Element).tagName);

      // 1. Walk up until we find <history>
      let current: Node | null = node;
      let historyNode: Element | null = null;

      while (current) {
        if (current instanceof Element && current.tagName.toUpperCase() === 'HISTORY') {
          historyNode = current;
          break;
        }
        current = current.parentNode;
      }

      if (!historyNode) {
        enqueueSnackbar('Could not locate <history> node', { variant: 'error' });
        return;
      }

      // 2. Get all <provenance> children
      const provenanceNodes = Array.from(historyNode.children).filter(
        (child): child is Element => child.tagName.toUpperCase() === 'PROVENANCE',
      );

      if (provenanceNodes.length === 0) {
        enqueueSnackbar('No <provenance> entries found', { variant: 'error' });
        return;
      }

      // Normalize comparison text
      const target = (node.textContent || '').trim();

      // 3. Find first provenance node with matching textContent
      const index = provenanceNodes.findIndex((prov) => (prov.textContent || '').trim() === target);

      if (index === -1) {
        enqueueSnackbar('No matching provenance entry found', { variant: 'error' });
        return;
      }

      // 4. Done
      dispatch(setSelectedIdentifier({ selectedIdentifier: index }));
      dispatch(
        setDialogType({
          dialogType: EditorConstants.dialogTypes.MANAGE_PROVENANCE_ENTRY,
        }),
      );
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.REMOVE_ANNOTATION,
    label: 'Auszeichnung Entfernen',
    action: async ({ node }: { node?: Node }) => {
      try {
        const currentDoc = xmlDocRef.current;
        if (!currentDoc) {
          enqueueSnackbar('No xml document found', { variant: 'error' });
          return;
        }
        if (!node) throw new Error('No node given as value');

        const refNode = EditorUtils.xmlCheck.getNodeByPath(
          currentDoc,
          EditorUtils.xmlCheck.getNodePath(node),
        );
        EditorUtils.textMarking.unwrapNode(refNode as Element);

        if (!refNode) throw new Error('No refNode found in current XML document');

        await EditorUtils.backendOrchestrator.patchWithDispatch(
          dispatch,
          [
            new XMLSerializer().serializeToString(currentDoc),
            stateEditorLetter.id,
            EditorConstants.changeTypes.misc.BODY_ANNOTATION_REMOVED,
            null,
          ],
          {
            actionsOnSuccess: [setReloadLetterContent({ reloadLetterContent: true })],
            successMessage: 'Die Auszeichnung wurde entfernt',
            errorMessage: 'Data could not be updated on backend side',
          },
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.LABEL_MOVE_DOWN,
    label: 'Verschieben Unten',
    type: 'inactive',
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.LABEL_MOVE_UP,
    label: 'Verschieben Oben',
    type: 'inactive',
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.MOVE_DOWN,
    label: 'Verschieben Unten',
    action: async ({ node }: { node?: Node }) => {
      try {
        const currentDoc = xmlDocRef.current;
        if (!currentDoc) {
          enqueueSnackbar('No xml document found', { variant: 'error' });
          return;
        }
        EditorUtils.writingActContent.moveActDown(currentDoc, node as Element);
        EditorUtils.contentFlow.reorderExistingPageBreaks(currentDoc);

        await EditorUtils.backendOrchestrator.patchWithDispatch(
          dispatch,
          [
            new XMLSerializer().serializeToString(currentDoc),
            stateEditorLetter.id,
            EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
            null,
          ],
          {
            actionsOnSuccess: [setReloadLetterContent({ reloadLetterContent: true })],
            successMessage: 'Schreibakt wurde verschoben',
            errorMessage: 'Data could not be updated on backend side',
          },
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.MOVE_UP,
    label: 'Verschieben Oben',
    action: async ({ node }: { node?: Node }) => {
      try {
        const currentDoc = xmlDocRef.current;
        if (!currentDoc) {
          enqueueSnackbar('No xml document found', { variant: 'error' });
          return;
        }
        EditorUtils.writingActContent.moveActUp(currentDoc, node as Element);
        EditorUtils.contentFlow.reorderExistingPageBreaks(currentDoc);

        await EditorUtils.backendOrchestrator.patchWithDispatch(
          dispatch,
          [
            new XMLSerializer().serializeToString(currentDoc),
            stateEditorLetter.id,
            EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
            null,
          ],
          {
            actionsOnSuccess: [setReloadLetterContent({ reloadLetterContent: true })],
            successMessage: 'Schreibakt wurde verschoben',
            errorMessage: 'Data could not be updated on backend side',
          },
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_AUTHOR_WRITER,
    label: 'Schreiber/Autoren Verwalten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        const numberOfAct = (node as Element).getAttribute('n');

        if (!numberOfAct) throw new Error('No act number found on node');

        dispatch(
          setEditorLetterActOfWriting({ letter: { actOfWriting: { orderNumber: numberOfAct } } }),
        );
        dispatch(
          setDialogType({
            dialogType: EditorConstants.dialogTypes.MANAGE_WRITING_ACT_AUTHOR_WRITER,
          }),
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.MANAGE_TEXT_ADDRESS,
    label: 'Adresse Bearbeiten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        const ancestorNodeNames = EditorUtils.xmlCheck.getAncestorsNodes(node);

        const addressNode = ancestorNodeNames.filter((node: Node) => {
          // console.log("node", node, node.nodeName.toLowerCase(), (node as Element).getAttribute('type'))
          if (node.nodeName.toLowerCase() === 'div' && (node as Element).getAttribute('type')) {
            return node as Element;
          }
          return null;
        })[0];

        if (!addressNode) throw new Error('No address node found with given path');

        const addressType = (addressNode as Element).getAttribute('type')?.toLowerCase();

        if (!addressType) throw new Error('No address type found on node');

        if (addressType === 'sender_address') {
          dispatch(
            setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_ADDRESS_SENDER }),
          );
        } else if (addressType === 'address') {
          dispatch(
            setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_ADDRESS_RECIPIENT }),
          );
        } else {
          enqueueSnackbar('Address type is not valid', { variant: 'error' });
        }
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.DELETE_NODE,
    label: 'Eintrag Entfernen',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) {
          enqueueSnackbar('menuItems: No node given as value', { variant: 'error' });
          return;
        }

        const ancNode = EditorUtils.rightClickPathHandles.findAncestorPathNode(node);

        if (!ancNode) {
          enqueueSnackbar('menuItems "Eintrag Entfernen" No anchNode found with given path', {
            variant: 'error',
          });
          return;
        }

        const xmlContent = EditorUtils.rightClickPathHandles.removeNode(
          node,
          ancNode.afterActionCallback,
          ancNode.deleteNodeCallback,
        );

        if (!xmlContent) {
          enqueueSnackbar('menuItems removeNode: No xml content found', { variant: 'error' });
          return;
        }

        await EditorUtils.backendOrchestrator.patchWithDispatch(
          dispatch,
          [xmlContent, stateEditorLetter.id, EditorConstants.changeTypes.NODE_REMOVED, null],
          {
            actionsOnSuccess: [setReloadLetterContent({ reloadLetterContent: true })],
            successMessage: `${ancNode.nodeType.name} wurde entfernt`,
            errorMessage: 'Data could not be updated on backend side',
          },
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.MANAGE_WRITER_AUTHOR_HEADER,
    label: 'Autoren/Schreiber Verwalten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        dispatch(
          setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_HEADER_AUTHOR_WRITER }),
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.MANAGE_RECEIVER,
    label: 'Empfänger Verwalten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER }));
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.MANAGE_HEADER_LANGUAGES,
    label: 'Sprachen Verwalten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.EDIT_LANGUAGES }));
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.ADD_GREETINGS_FORMULA,
    label: 'Begrüßungsformel Hinzufügen',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        const xmlDoc = xmlDocRef.current;
        if (!xmlDoc) throw new Error('XML document not loaded');
        EditorUtils.textMarking.addTmpIdToNode(
          xmlDoc,
          node as Element,
          EditorConstants.dialogTypes.ADD_GREETINGS_FORMULA,
        );

        const serializer = new XMLSerializer();
        dispatch(
          setXmlLetterContent({ content: { xmlContent: serializer.serializeToString(xmlDoc) } }),
        );

        dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.ADD_GREETINGS_FORMULA }));
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_GREETINGS_FORMULA,
    label: 'Begrüßungsformel Bearbeiten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        const xmlDoc = xmlDocRef.current;
        if (!xmlDoc) throw new Error('XML document not loaded');
        EditorUtils.textMarking.addTmpIdToNode(xmlDoc, node as Element, 'MANAGE_GREETINGS_FORMULA');

        const serializer = new XMLSerializer();
        dispatch(
          setXmlLetterContent({ content: { xmlContent: serializer.serializeToString(xmlDoc) } }),
        );

        dispatch(
          setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_GREETINGS_FORMULA }),
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
  {
    identifier: EditorConstants.menuItemTypes.WRITING_ACT.EDIT_NOTE,
    label: 'Kommentar Bearbeiten',
    action: async ({ node }: { node?: Node }) => {
      try {
        if (!node) throw new Error('No node given as value');

        const xmlId = (node as Element).getAttribute('xml:id');

        if (!xmlId) throw new Error('No xml:id found on node');

        dispatch(
          setEditorDialogAndReferenceThunk({
            dialogType: EditorConstants.dialogTypes.EDIT_NOTE,
            elementType: 'note',
            elementXmlId: xmlId,
            elementKey: null,
          }),
        );
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      }
    },
  },
];
