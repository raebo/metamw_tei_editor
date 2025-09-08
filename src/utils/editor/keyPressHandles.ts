import { EditorUtils } from "./index";
import { AppDispatch } from "../../redux/redux.store";
import { setDialogType } from "../../redux/slices/editor.letter.slice";

export const keyPressHandles = {
  openDialog(dispatch: AppDispatch, dialogType: string) : void {
    dispatch(setDialogType({ dialogType: dialogType }));
  },
  async baseHandling(
    keyFunction: (xmlContent: string) => string,
  ) : Promise<string> {
    const xmlContent = EditorUtils.xmlCheck.letterXml()

    if (!xmlContent) { throw new Error("No xml content found") }

    return keyFunction(xmlContent)
  },
	moveWritingActUp(xmlContent: string) : string{
		const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(xmlContent);

		try {
			const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);
			const writingActNode = EditorUtils.xmlCheck.findNearestWritingActNode(markedNode);

			EditorUtils.writingActContent.moveActUp(xmlDoc, writingActNode);
			EditorUtils.xmlCheck.unwrapedMarkedSpan(xmlDoc);

			return new XMLSerializer().serializeToString(xmlDoc)

		} catch (error) {
			throw error;
		}
	},
	moveWritingActDown(xmlContent: string) : string{
		const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(xmlContent);

		try {
			const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);
			const writingActNode = EditorUtils.xmlCheck.findNearestWritingActNode(markedNode);

			EditorUtils.writingActContent.moveActDown(xmlDoc, writingActNode);
			EditorUtils.xmlCheck.unwrapedMarkedSpan(xmlDoc);

			return new XMLSerializer().serializeToString(xmlDoc)

		} catch (error) {
			throw error;
		}
	},
  markContentBold(xmlContent: string): string {
    return xmlContent.replace(/<span class="marked">(.*?)<\/span>/g, '<hi rend="bold">$1</hi>');
  },
  markContentItalic(xmlContent: string) : string{
    return xmlContent.replace(/<span class="marked">(.*?)<\/span>/g, '<hi rend="italic">$1</hi>');
  },
  markContentUnderline(xmlContent: string) : string{
    return xmlContent.replace(/<span class="marked">(.*?)<\/span>/g, '<hi rend="underline" n="1">$1</hi>');
  },
  removeNode(node: Node | undefined) : string {
    if (!node) { throw new Error("No node found") }

    const parent = node.parentNode;

    if (parent) {
      parent.removeChild(node);
    }

    let parentNode: Node | null = parent;

    while (parentNode && !(parentNode instanceof Element && parentNode.tagName.toLowerCase() === 'tei')) {
      parentNode = parentNode.parentNode;
    }

    if (!parentNode) {
      throw new Error("No ancestor <tei> tag found");
    } else {
      return parentNode.outerHTML
    }
  }
}
