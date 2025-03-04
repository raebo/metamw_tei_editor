import { v4 as uuidv4 } from "uuid";

export const markupGeneration = {
  noteMarkup: (xmlContent: string, userLogin: string, noteContent: string, commentType: string) => {
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const doc = parser.parseFromString(xmlContent, "application/xml");

    const markedSpan = doc.querySelector('span.marked');

    if (markedSpan && markedSpan.parentNode) {
      const uuid = `note-${uuidv4()}`;
      const content = markedSpan.textContent || "";

      // Create <note> element
      const noteElement = doc.createElement("note");
      noteElement.setAttribute("resp", userLogin);
      noteElement.setAttribute("type", commentType);
      noteElement.setAttribute("xml:id", uuid);
      noteElement.setAttribute("xml:lang", "de");
      noteElement.textContent = `${content} - ${noteContent}`; // Prefix comment with span content

      // Replace <span> with its inner text
      const textNode = document.createTextNode(content);
      markedSpan.parentNode.replaceChild(textNode, markedSpan);

      // Insert <note> after the text
      textNode.after(noteElement);
    }

    return serializer.serializeToString(doc);
  }
}
