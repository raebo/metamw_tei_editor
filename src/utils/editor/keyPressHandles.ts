import { EditorUtils } from './index';
import { AppDispatch } from '@src/redux/redux.store';
import { setDialogType } from '@src/redux/slices/editor.letter.slice';

export const keyPressHandles = {
  openDialog(dispatch: AppDispatch, dialogType: string): void {
    dispatch(setDialogType({ dialogType: dialogType }));
  },
  async baseHandling(xmlDoc: Document, keyFunction: (xmlDoc: Document) => void) {
    keyFunction(xmlDoc);
  },
  moveWritingActUp(xmlDoc: Document) {
    try {
      const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);
      const writingActNode = EditorUtils.xmlCheck.findNearestWritingActNode(markedNode);

      EditorUtils.writingActContent.moveActUp(xmlDoc, writingActNode);
      EditorUtils.xmlCheck.unwrapedMarkedSpan(xmlDoc);
    } catch (error) {
      throw error;
    }
  },
  moveWritingActDown(xmlDoc: Document) {
    try {
      const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);
      const writingActNode = EditorUtils.xmlCheck.findNearestWritingActNode(markedNode);

      EditorUtils.writingActContent.moveActDown(xmlDoc, writingActNode);
      EditorUtils.xmlCheck.unwrapedMarkedSpan(xmlDoc);
    } catch (error) {
      throw error;
    }
  },
  markContentBold(xmlDoc: Document) {
    const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);

    if (!markedNode.firstChild) {
      throw new Error('No content found inside the marked span.');
    }

    const hi = xmlDoc.createElement('hi');
    hi.setAttribute('rend', 'bold');
    hi.appendChild(markedNode.firstChild);

    markedNode.parentNode?.replaceChild(hi, markedNode);
  },
  markContentItalic(xmlDoc: Document) {
    const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);

    if (!markedNode.firstChild) {
      throw new Error('No content found inside the marked span.');
    }

    const hi = xmlDoc.createElement('hi');
    hi.setAttribute('rend', 'italic');
    hi.appendChild(markedNode.firstChild);

    markedNode.parentNode?.replaceChild(hi, markedNode);
  },
  markContentUnderline(xmlDoc: Document) {
    const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);

    if (!markedNode.firstChild) {
      throw new Error('No content found inside the marked span.');
    }

    const hi = xmlDoc.createElement('hi');
    hi.setAttribute('rend', 'underline');
    hi.appendChild(markedNode.firstChild);

    markedNode.parentNode?.replaceChild(hi, markedNode);
  },
  removeNode(node: Node | undefined): string {
    if (!node) {
      throw new Error('No node found');
    }

    const parent = node.parentNode;

    if (parent) {
      parent.removeChild(node);
    }

    let parentNode: Node | null = parent;

    while (parentNode && !(parentNode instanceof Element && parentNode.tagName.toLowerCase() === 'tei')) {
      parentNode = parentNode.parentNode;
    }

    if (!parentNode) {
      throw new Error('No ancestor <tei> tag found');
    } else {
      return parentNode.outerHTML;
    }
  },
};
