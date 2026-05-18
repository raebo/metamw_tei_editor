import React, { useCallback, useEffect, useRef } from 'react';
import { EditorConstants, LetterState, type ValidLeftClickNodeType } from '@src/constants/editor';
import { useAppDispatch } from '@src/redux/hooks';
import { enqueueSnackbar } from 'notistack';
import {
  setClickedEntityNode,
  setEditorSelectedItem,
  setReadableLetter,
} from '@src/redux/slices/editor.letter.slice';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { fetchLetterDataByName } from '@src/services/editor/apiLettersRequest.service';

interface UserActionMenuProps {
  xmlContentRef: React.RefObject<HTMLDivElement>;
  setLetterState: (letterState: LetterState) => void;
}

const validNodeList: string[] = ['title', 'persname', 'placename'];

const LeftClickAnnotationAction = (props: UserActionMenuProps) => {
  const dispatch = useAppDispatch();
  const editorSelectedLeftItem = useSelector(
    (state: RootState) => state.editorLetter.selectedItem.left,
  );
  const editorSelectedRightItem = useSelector(
    (state: RootState) => state.editorLetter.selectedItem.right,
  );
  const selectedNodeXmlIdRef = useRef<string>('');
  const selectedNodeTypeRef = useRef<ValidLeftClickNodeType | null>(null);
  const selectedKeyValueRef = useRef<string>('');

  const xmlContentRef = props.xmlContentRef;

  const checkForProtagCreationTitle = (titleNode: Element) => {
    const worksList = titleNode.querySelector('list[type="fmb_works_directory"]');
    if (!worksList) return;

    const nameNodes = Array.from(titleNode.querySelectorAll(':scope > name'));
    const targetNameNode = nameNodes.find((node) => node.getAttribute('type') !== 'author');
    if (!targetNameNode) return null;

    selectedNodeTypeRef.current = 'protagCreation';
    const key = targetNameNode.getAttribute('data-key');
    if (!key) throw 'protagCreation key is not valid for';

    selectedKeyValueRef.current = key;
  };

  const checkForCreationTitle = (titleNode: Element) => {
    const worksList = titleNode.querySelector('list[type="fmb_works_directory"]');
    if (worksList) return;

    const nameNodes = Array.from(titleNode.querySelectorAll(':scope > name'));
    const targetNameNode = nameNodes.find((node) => node.getAttribute('type') !== 'author');
    if (!targetNameNode) return null;

    selectedNodeTypeRef.current = 'creation';
    const key = targetNameNode.getAttribute('data-key');
    if (!key) throw 'creation key is not valid for';

    selectedKeyValueRef.current = key;
  };

  const checkForLetterTitle = (node: Element): boolean | undefined => {
    if (node.tagName.toLowerCase() !== 'title' && !selectedNodeTypeRef.current) return false;

    const letterNode = node.querySelector('name[type="letter"]');
    if (letterNode) {
      const keyValue = letterNode.getAttribute('data-key');

      if (!keyValue) return false;

      const keyStart = keyValue.slice(0, 3);

      selectedNodeTypeRef.current = keyStart === 'fmb' ? 'fmbLetter' : 'gbLetter';
      selectedKeyValueRef.current = keyValue;

      return true;
    }
    return false;
  };

  const checkForPersNameNode = (node: Element): boolean | undefined => {
    if (node.tagName.toLowerCase() !== 'persname' && !selectedNodeTypeRef.current) return false;

    const nameNode = node.querySelector('name');
    if (!nameNode) return false;

    selectedNodeTypeRef.current = 'person';
    const keyValue = nameNode.getAttribute('data-key');

    if (!keyValue) return;
    selectedKeyValueRef.current = keyValue;

    return true;
  };

  const checkForPlaceNameNode = (node: Element): boolean | undefined => {
    if (node.tagName.toLowerCase() !== 'placename' && !selectedNodeTypeRef.current) return false;

    const sightNode = node.querySelector('name[type="sight"]');
    if (sightNode) {
      selectedNodeTypeRef.current = 'sight';
      const key = sightNode.getAttribute('data-key');
      if (!key) throw 'sight key is not valid for';
      selectedKeyValueRef.current = key;
      return true;
    }

    const settlementNode = node.querySelector('settlement');
    if (settlementNode) {
      selectedNodeTypeRef.current = 'settlement';
      const key = settlementNode.getAttribute('data-key');
      if (!key) throw 'settlement key is not valid for';
      selectedKeyValueRef.current = key;
      return true;
    }

    const instNode = node.querySelector('name[type="institution"]');
    if (instNode) {
      selectedNodeTypeRef.current = 'institution';
      const key = instNode.getAttribute('data-key');
      if (!key) throw 'settlement key is not valid for';
      selectedKeyValueRef.current = key;
      return true;
    }

    throw 'no valid place name node';
  };

  const isValidTitleNode = useCallback((node: Element) => {
    if (node.tagName.toLowerCase() !== 'title' && !selectedNodeTypeRef.current) return;

    checkForLetterTitle(node);
    if (selectedNodeTypeRef.current !== null && selectedKeyValueRef.current.length > 0) return true;

    checkForProtagCreationTitle(node);
    if (selectedNodeTypeRef.current !== null && selectedKeyValueRef.current.length > 0) return true;

    checkForCreationTitle(node);
    if (selectedNodeTypeRef.current !== null && selectedKeyValueRef.current.length > 0) return true;

    throw 'Not a valid left click node';
  }, []);

  const handleLetterNodeClick = useCallback(async () => {
    dispatch(
      setClickedEntityNode({
        xmlId: selectedNodeXmlIdRef.current,
        nodeType: selectedNodeTypeRef.current!,
        nodeTypeValue: selectedKeyValueRef.current,
      }),
    );

    const editorLetter = await fetchLetterDataByName(selectedKeyValueRef.current);
    if (!editorLetter?.xmlContent) {
      enqueueSnackbar(`Letter with name ${selectedKeyValueRef.current} not found`, {
        variant: 'error',
      });
      return;
    }

    dispatch(
      setReadableLetter({
        id: editorLetter.id,
        name: editorLetter.name,
        xmlContent: editorLetter.xmlContent,
      }),
    );

    dispatch(
      setEditorSelectedItem({
        selectedItem: {
          left: EditorConstants.compMappingLeft.READONLY_VIEW,
          right: editorSelectedRightItem,
        },
      }),
    );
  }, [dispatch, editorSelectedRightItem]);

  const handleEntityNodeClick = useCallback(() => {
    dispatch(
      setClickedEntityNode({
        xmlId: selectedNodeXmlIdRef.current,
        nodeType: selectedNodeTypeRef.current!,
        nodeTypeValue: selectedKeyValueRef.current,
      }),
    );

    dispatch(
      setEditorSelectedItem({
        selectedItem: {
          left: null,
          right: EditorConstants.compMappingRight.ENT_NODE_INFO,
        },
      }),
    );
  }, [dispatch]);

  const handleNodeLeftClick = useCallback(
    async (event: MouseEvent) => {
      event.preventDefault();

      const targetNode = event.target as Node;

      const xmlId = (targetNode as Element).getAttribute('xml:id');

      if (!xmlId) return;

      selectedNodeXmlIdRef.current = '';
      selectedKeyValueRef.current = '';

      if (!validNodeList.includes((targetNode as Element).nodeName.toLowerCase())) return;

      selectedNodeXmlIdRef.current = xmlId;

      try {
        if (!isValidTitleNode(targetNode as Element)) return;

        const isLetter = checkForLetterTitle(targetNode as Element);

        if (isLetter) {
          await handleLetterNodeClick();
        } else if (
          checkForPersNameNode(targetNode as Element) ||
          checkForPlaceNameNode(targetNode as Element)
        ) {
          handleEntityNodeClick();
        }
      } catch (error) {
        enqueueSnackbar(
          `${(targetNode as Element).attributes[0]} is not a valid left click node: ${(error as Error).message}`,
          { variant: 'error' },
        );
      }
    },
    [handleEntityNodeClick, handleLetterNodeClick, isValidTitleNode, validNodeList],
  );

  useEffect(() => {
    const el = xmlContentRef.current;
    if (!el) return;

    el.addEventListener('mouseup', handleNodeLeftClick);

    return () => {
      el.removeEventListener('mouseup', handleNodeLeftClick);
    };
  }, [handleNodeLeftClick, props.xmlContentRef, xmlContentRef]);

  return <></>;
};

export default LeftClickAnnotationAction;
