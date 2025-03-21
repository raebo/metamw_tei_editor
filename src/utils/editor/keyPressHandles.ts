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

    const updatedXmlContent = await keyFunction(xmlContent)

    return updatedXmlContent
  },
  markContentBold(xmlContent: string): string {
    console.log("markContentBold")
    return xmlContent.replace(/<span class="marked">(.*?)<\/span>/g, '<hi rend="bold">$1</hi>');
  },
  markContentItalic(xmlContent: string) : string{
    return xmlContent.replace(/<span class="marked">(.*?)<\/span>/g, '<hi rend="italic">$1</hi>');
  },
  markContentUnderline(xmlContent: string) : string{
    return xmlContent.replace(/<span class="marked">(.*?)<\/span>/g, '<hi rend="underline" n="1">$1</hi>');
  }
}
