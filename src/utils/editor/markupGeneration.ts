import { v4 as uuidv4 } from "uuid"
import { EditorUtils } from "./index"
import {xmlCheck} from "./xmlCheck";
import { ActOfWritingElement, MarkupPersonData } from '../../services/mappings/editorMappings';

export const markupGeneration = {
  addAttachmentMarkup: (xmlContent: string, attachmentType: string, attachmentName: string) : { xmlString: string, contentChanged: boolean } => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml")

    const listBibl = xmlDoc.querySelector("msdesc accmat listbibl")
    if (!listBibl) return { xmlString: xmlContent, contentChanged: false }

    const existingBiblEntries = listBibl.querySelectorAll("bibl")

    if (existingBiblEntries.length === 1 && existingBiblEntries[0].getAttribute("type") === "none") {
      existingBiblEntries[0].setAttribute("type", attachmentType)
      existingBiblEntries[0].textContent = attachmentName

    } else {
      const newBibl = xmlDoc.createElement("bibl")
      newBibl.setAttribute("type", attachmentType)
      newBibl.textContent = attachmentName
      listBibl.appendChild(newBibl)
    }

    return { xmlString: xmlCheck.serializeDocument(xmlDoc), contentChanged: true }
  },
  addPersonMarkup: (root: Element, peopleMarkupData: MarkupPersonData[]) : { xmlId: string | null, contentChanged: boolean } => {

    const markedSpans = root.querySelectorAll('span.marked')

    if (markedSpans.length === 0) return { xmlId: null, contentChanged: false };

    const xmlId = `persName_${uuidv4()}`

    markedSpans.forEach(span => {
      const persNameNode = document.createElement("persName")
      persNameNode.setAttribute("xml:id", xmlId)
      persNameNode.textContent = span.textContent

      peopleMarkupData.forEach(markup => {
        const nameNode = document.createElement("name")
        nameNode.setAttribute("type", "person")
        nameNode.setAttribute("key", markup.key)
        nameNode.setAttribute("style", "hidden")
        nameNode.textContent = markup.nameDisplay

        persNameNode.appendChild(nameNode)
      })

      span.replaceWith(persNameNode);
    })

    return { xmlId: xmlId, contentChanged: true }
  },
  noteMarkup: (xmlContent: string, userLogin: string, noteContent: string, commentType: string) : { xmlString: string, xmlId: string } => {
    const parser = new DOMParser()
    const xmlId = `note-${uuidv4()}`
    const serializer = new XMLSerializer()
    const doc = parser.parseFromString(xmlContent, "application/xml")

    const markedSpan = doc.querySelector('span.marked')

    if (markedSpan && markedSpan.parentNode) {
      const content = markedSpan.textContent || ""

      // Create <note> element
      const noteElement = doc.createElement("note")
      noteElement.setAttribute("resp", userLogin)
      noteElement.setAttribute("type", commentType)
      noteElement.setAttribute("xml:id", xmlId)
      noteElement.setAttribute("xml:lang", "de")
      noteElement.textContent = `${content} - ${noteContent}` // Prefix comment with span content

      // Replace <span> with its inner text
      const textNode = document.createTextNode(content)
      markedSpan.parentNode.replaceChild(textNode, markedSpan)

      // Insert <note> after the text
      textNode.after(noteElement)
    }

    return {
      xmlString: serializer.serializeToString(doc),
      xmlId: xmlId
    }
  },
  updateNoteMarkup: (xmlId: string, noteType: string, noteLanguage: string, noteContent: string) : { xmlString: string, oldNoteType: string | null, oldNoteContent: string | null } => {
    const parser = new DOMParser()
    const serializer = new XMLSerializer()
    const xmlString = EditorUtils.xmlCheck.letterXml()

    if (!xmlString) { throw new Error("No xml content found") }
    const doc = parser.parseFromString(xmlString, 'application/xml')

    const noteElement = EditorUtils.xmlCheck.elementByXmlTypeAndId(xmlId, 'note', doc)

    if (!noteElement) { throw new Error(`Note with xml:id ${xmlId} not found`) }

    const oldNoteContent = noteElement.textContent
    const oldNoteType = noteElement.getAttribute("type")

    noteElement.setAttribute("type", noteType)
    noteElement.setAttribute("xml:lang", noteLanguage)
    noteElement.innerHTML = noteContent

    return {
      xmlString: serializer.serializeToString(doc),
      oldNoteType: oldNoteType,
      oldNoteContent: oldNoteContent
    }
  },
  deleteNoteMarkup: (xmlId: string) : { xmlString: string } => {
    const parser = new DOMParser()
    const serializer = new XMLSerializer()
    const xmlString = EditorUtils.xmlCheck.letterXml()

    if (!xmlString) { throw new Error("No xml content found") }
    const doc = parser.parseFromString(xmlString, 'application/xml')

    const noteElement = EditorUtils.xmlCheck.elementByXmlTypeAndId(xmlId, 'note', doc)

    if (!noteElement) { throw new Error(`Note with xml:id ${xmlId} not found`) }

    noteElement.remove()

    return {
      xmlString: serializer.serializeToString(doc)
    }
  },

  insertActOfWritingBlock: (
    xmlDoc: Document,
    authorWriters: ActOfWritingElement[],
  ) : { xmlString: string }  => {

    const nValue = xmlDoc.querySelectorAll("div[type='act_of_writing']").length + 1;

    const div = xmlDoc.createElement("div");
    div.setAttribute("type", "act_of_writing");
    div.setAttribute("n", nValue.toString());

    const rolePriority: Record<"author" | "writer", number> = {
      author: 0,
      writer: 1,
    }
    const sortedAuthorWriters = authorWriters.sort((a, b) => rolePriority[a.role as 'author' | 'writer'] - rolePriority[b.role as 'author' | 'writer'])

    sortedAuthorWriters.forEach((authorWriter) => {
      const docAuthor = xmlDoc.createElement("docAuthor");
      docAuthor.setAttribute("style", "hidden");
      docAuthor.setAttribute("data-key", authorWriter.key);
      docAuthor.setAttribute("resp", authorWriter.role);
      docAuthor.textContent = authorWriter.name;
      div.appendChild(docAuthor);
    })


    const p = xmlDoc.createElement("p");
    p.setAttribute("style", "paragraph_without_indent");

    // Create the oxy processing instructions
    const startPI = xmlDoc.createProcessingInstruction(
      "oxy_custom_start",
      'type="oxy_content_highlight" color="235,192,230"'
    );
    const endPI = xmlDoc.createProcessingInstruction("oxy_custom_end", "");

    p.appendChild(startPI);
    p.appendChild(xmlDoc.createTextNode("Brieftext"));
    p.appendChild(endPI);

    div.appendChild(p);

    // Insert the new div at the desired location
    xmlDoc.documentElement.appendChild(div); // or use some custom selector

    return { xmlString: xmlCheck.serializeDocument(xmlDoc) }
  }
}
