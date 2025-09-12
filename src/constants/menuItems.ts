import { EditorConstants, MenuItem } from './editor';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '../utils/editor';
import {
  setDialogType,
  setEditorLetterActOfWriting,
  setReloadLetterContent,
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

        const result = await EditorUtils.backendService.patchContent(
          new XMLSerializer().serializeToString(currentDoc),
          stateEditorLetter.id,
          EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
          null,
        );

        if (result) {
          dispatch(setReloadLetterContent({ reloadLetterContent: true }));
          enqueueSnackbar('Schreibakt wurde verschoben', { variant: 'success' });
        } else {
          enqueueSnackbar('Data could not be updated on backend side', { variant: 'error' });
        }
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

        const result = await EditorUtils.backendService.patchContent(
          new XMLSerializer().serializeToString(currentDoc),
          stateEditorLetter.id,
          EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
          null,
        );

        if (result) {
          dispatch(setReloadLetterContent({ reloadLetterContent: true }));
          enqueueSnackbar('Schreibakt wurde verschoben', { variant: 'success' });
        } else {
          enqueueSnackbar('Data could not be updated on backend side', { variant: 'error' });
        }
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
        if (!node) throw new Error('No node given as value');

        const anchNode = EditorUtils.rightClickPathHandles.findAncestorPathNode(node);

        if (!anchNode) throw new Error('No anchNode found with given path');

        const xmlContent = EditorUtils.rightClickPathHandles.removeNode(
          node,
          anchNode.afterActionCallback,
        );

        if (!xmlContent) throw new Error('No xml content found');

        const result = await EditorUtils.backendService.patchContent(
          xmlContent,
          stateEditorLetter.id,
          EditorConstants.changeTypes.NODE_REMOVED,
          null,
        );
        if (result) {
          dispatch(setReloadLetterContent({ reloadLetterContent: true }));
          enqueueSnackbar(`${anchNode.nodeType.name} wurde entfernt`, { variant: 'success' });
        } else {
          enqueueSnackbar('Data could not be updated on backend side', { variant: 'error' });
        }
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
