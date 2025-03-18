import { EditorUtils } from "./index";
import editorKeyHandle from "../../components/editor/letter/Center/EditorKeyHandle";

export const keyPressHandles = {
  async baseHandling(
    stateEditorLetter: { letterId: number } ,
    changeType: string,
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
  }
}
