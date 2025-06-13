import { v4 as uuidv4 } from "uuid"
import { EditorUtils } from "./index"
import {xmlCheck} from "./xmlCheck";
import {
  ActOfWritingElement,
  MarkupPersonData,
  MarkupPlaceData,
} from '../../services/mappings/editorMappings';
import { SnippetEntity } from '../../services/mappings/autoAnnoMappings';
import { EditorConstants } from '../../constants/editor';

const generateSettlementNode = ( data: { key: string | null, name: string | null, type: string | null}) : HTMLElement => {
  if (data.key === null || data.name === null || data.type === null) {
    throw new Error("generateSettlementNode missing key name or type is null")
  }

  const settlementNode = document.createElement("settlement")
  settlementNode.setAttribute("style", "hidden")
  settlementNode.setAttribute("key", data.key)
  settlementNode.setAttribute("type",data.type)
  settlementNode.textContent = data.name

  return settlementNode
}

const generateCountryNode = (data: { name: string | null}) : HTMLElement => {

  if (data.name === null) {
    throw new Error("generateCountryNode missing key name or type is null")
  }

  const countryNode = document.createElement("country")
  countryNode.setAttribute("style", "hidden")
  countryNode.textContent = data.name

  return countryNode
}

export const markupGeneration = {
  generateXmlId: (xmlType: string) : string => {
    return `${xmlType}_${uuidv4()}`;
  },
  replaceMarkedNode: (spanNode: Element, nodeReplacement : Element) : void => {
    const content = spanNode.textContent || "";

    // Clone the replacement node to avoid side effects
    const clonedReplacement = nodeReplacement.cloneNode(true) as Element;

    // Prepend the original marked text as a text node at the beginning
    const textNode = document.createTextNode(content);
    clonedReplacement.insertBefore(textNode, clonedReplacement.firstChild);

    // Replace the marked span with the enriched replacement node
    spanNode.parentNode?.replaceChild(clonedReplacement, spanNode);
  },
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
  addSightMarkup: (placeNameNode: HTMLElement, markupPlace: MarkupPlaceData) : {} => {
    const country = markupPlace.country
    const settlement = markupPlace.settlement

    if (country === null || settlement === null || settlement.key === null) { throw new Error("markupData contains no settlement or country") }

    const sightNode = document.createElement("name")
    sightNode.setAttribute("style", "hidden")

    sightNode.setAttribute("key", markupPlace.key)
    sightNode.setAttribute("type", 'sight')
    sightNode.textContent = markupPlace.name
    placeNameNode.appendChild(sightNode)

    placeNameNode.appendChild(generateSettlementNode( {
      key: settlement.key, name: settlement.name, type: settlement.type }))

    placeNameNode.appendChild(generateCountryNode({ name: country.name }))

    return {  }
  },
  addSettlementMarkup: (placeNameNode: HTMLElement, markupPlace: MarkupPlaceData) : {} => {
    const country = markupPlace.country

    if (country === null) { throw new Error("markupData contains no settlement or country") }
    placeNameNode.appendChild(generateSettlementNode({
        key: markupPlace.key, name: markupPlace.name, type: markupPlace.kind
      }
    ))
    placeNameNode.appendChild(generateCountryNode({ name: country.name }))

    return {}
  },
  addInstitutionMarkup: (placeNameNode: HTMLElement, markupPlace: MarkupPlaceData) : { } => {
    const country = markupPlace.country
    const settlement = markupPlace.settlement

    if (country === null || settlement === null || settlement.key === null) { throw new Error("markupData contains no settlement or country") }

    const instNode = document.createElement("name")
    instNode.setAttribute("style", "hidden")
    instNode.setAttribute("key", markupPlace.key)
    instNode.setAttribute("type", 'institution')
    instNode.setAttribute("subtype", markupPlace.kind === null ? '' : markupPlace.kind)

    instNode.textContent = markupPlace.name
    placeNameNode.appendChild(instNode)

    placeNameNode.appendChild(generateSettlementNode( {
      key: settlement.key, name: settlement.name, type: settlement.type }))

    placeNameNode.appendChild(generateCountryNode({ name: country.name }))

    return {}
  },
  addAuthorMarkup: (titleNode: Element, people: SnippetEntity[]) : {} => {
    for (const person of people) {
      const nameNode = document.createElement("name")
      nameNode.setAttribute("style", "hidden")
      nameNode.setAttribute("type", "author")
      nameNode.setAttribute("key", person.entityKey)
      nameNode.textContent = person.entityDisplayName
      titleNode.appendChild(nameNode)
    }

    return {}
  },
  addProtagLetterMarkup: async (
    letterElement: Element,
    stateEditorLetter: { id: number, name: string },
    markupLetterData: { letterKey: string, letterName: string }
  ) : Promise<any> => {

    const protagData = await EditorUtils.protagCreationDataService.fetchProtagPersonData()

    const markedSpan= letterElement.querySelectorAll('span.marked')[0]
    if (markedSpan === undefined) throw new Error("no marked span found in letter element")

    const titleNode = document.createElement("title")
    const nameNode = document.createElement("name")
    nameNode.setAttribute("type", "author")
    nameNode.setAttribute("key", protagData.entityKey)
    nameNode.setAttribute("style", "hidden")
    nameNode.textContent = protagData.entityDisplayName
    titleNode.appendChild(nameNode)

    const letterNode = document.createElement("name")
    letterNode.setAttribute("type", "letter")
    letterNode.setAttribute("key", markupLetterData.letterKey)
    letterNode.setAttribute("style", "hidden")
    letterNode.textContent = markupLetterData.letterName
    titleNode.appendChild(letterNode)

    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, titleNode)

    await EditorUtils.backendService.patchContent(
      letterElement.innerHTML,
      stateEditorLetter.id,
      EditorConstants.changeTypes.misc.PROTAG_LETTER_ADDED,
      null
    );
  },
  addGbLetterMarkup: async (
    letterElement: Element,
    stateEditorLetter: { id: number, name: string },
    markupLetterData: { authorKey: string, authorName: string, letterKey: string, letterName: string }
  ) : Promise<any> => {

    const markedSpan= letterElement.querySelectorAll('span.marked')[0]
    if (markedSpan === undefined) throw new Error("no marked span found in letter element")

    const titleNode = document.createElement("title")
    const nameNode = document.createElement("name")
    nameNode.setAttribute("type", "author")
    nameNode.setAttribute("key", markupLetterData.authorKey)
    nameNode.setAttribute("style", "hidden")
    nameNode.textContent = markupLetterData.authorName
    titleNode.appendChild(nameNode)

    const letterNode = document.createElement("name")
    letterNode.setAttribute("type", "letter")
    letterNode.setAttribute("key", markupLetterData.letterKey)
    letterNode.setAttribute("style", "hidden")
    letterNode.textContent = markupLetterData.letterName
    titleNode.appendChild(letterNode)

    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, titleNode)

    await EditorUtils.backendService.patchContent(
      letterElement.innerHTML,
      stateEditorLetter.id,
      EditorConstants.changeTypes.misc.GB_LETTER_ADDED,
      null
    );
  },
  addPersonMarkup: (root: Element, peopleMarkupData: MarkupPersonData[]) : { xmlId: string | null, contentChanged: boolean } => {

    const markedSpans = root.querySelectorAll('span.marked')

    if (markedSpans.length === 0) return { xmlId: null, contentChanged: false };

    const xmlId = EditorUtils.markupGeneration.generateXmlId('persName')

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

      EditorUtils.markupGeneration.replaceMarkedNode(span, persNameNode)
    })

    return { xmlId: xmlId, contentChanged: true }
  },
  noteMarkup: (xmlContent: string, userLogin: string, noteContent: string, commentType: string) : { xmlString: string, xmlId: string } => {
    const parser = new DOMParser()
    const xmlId = EditorUtils.markupGeneration.generateXmlId('note')
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
