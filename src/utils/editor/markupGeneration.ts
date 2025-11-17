import { v4 as uuidv4 } from 'uuid';
import { EditorUtils } from './index';
import {
  ActOfWritingElement,
  MarkupPersonData,
  MarkupPlaceData,
} from '@src/services/mappings/editorMappings';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { EditorConstants } from '@src/constants/editor';

const generateSettlementNode = (data: {
  key: string | null;
  name: string | null;
  type: string | null;
}): Element => {
  if (data.key === null || data.name === null || data.type === null) {
    throw new Error('generateSettlementNode missing key name or type is null');
  }

  const settlementNode = document.createElementNS(EditorConstants.TEI_NS, 'settlement');
  settlementNode.setAttribute('style', 'hidden');
  settlementNode.setAttribute('key', data.key);
  settlementNode.setAttribute('type', data.type);
  settlementNode.textContent = data.name;

  return settlementNode as Element;
};

const generateCountryNode = (data: { name: string | null }): Element => {
  if (data.name === null) {
    throw new Error('generateCountryNode missing key name or type is null');
  }

  const countryNode = document.createElementNS(EditorConstants.TEI_NS, 'country');
  countryNode.setAttribute('style', 'hidden');
  countryNode.textContent = data.name;

  return countryNode;
};

export const markupGeneration = {
  generateXmlId: (xmlType: string): string => {
    return `${xmlType}_${uuidv4()}`;
  },
  replaceMarkedNode: (spanNode: Element, nodeReplacement: Element): void => {
    const content = spanNode.textContent || '';

    // Clone the replacement node to avoid side effects
    const clonedReplacement = nodeReplacement.cloneNode(true) as Element;

    // Prepend the original marked text as a text node at the beginning
    const textNode = document.createTextNode(content);
    clonedReplacement.insertBefore(textNode, clonedReplacement.firstChild);

    // Replace the marked span with the enriched replacement node
    spanNode.parentNode?.replaceChild(clonedReplacement, spanNode);
  },
  addAttachmentMarkup: (
    xmlDoc: XMLDocument,
    attachmentType: string,
    attachmentName: string,
  ): { contentChanged: boolean } => {
    const listBibl = xmlDoc.querySelector('teiHeader sourceDesc msDesc physDesc accMat listBibl');
    if (!listBibl) return { contentChanged: false };

    const existingBiblEntries = listBibl.querySelectorAll('bibl');

    if (
      existingBiblEntries.length === 1 &&
      existingBiblEntries[0].getAttribute('type') === 'none'
    ) {
      existingBiblEntries[0].setAttribute('type', attachmentType);
      existingBiblEntries[0].textContent = attachmentName;
    } else {
      const newBibl = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'bibl');
      newBibl.setAttribute('type', attachmentType);
      newBibl.textContent = attachmentName;
      listBibl.appendChild(newBibl);
    }

    return { contentChanged: true };
  },
  addSightMarkup: (placeNameNode: Element, markupPlace: MarkupPlaceData) => {
    const country = markupPlace.country;
    const settlement = markupPlace.settlement;

    if (country === null || settlement === null || settlement.key === null) {
      throw new Error('markupData contains no settlement or country');
    }

    const sightNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
    sightNode.setAttribute('style', 'hidden');

    sightNode.setAttribute('key', markupPlace.key);
    sightNode.setAttribute('type', 'sight');
    sightNode.textContent = markupPlace.name;
    placeNameNode.appendChild(sightNode);

    placeNameNode.appendChild(
      generateSettlementNode({
        key: settlement.key,
        name: settlement.name,
        type: settlement.type,
      }),
    );

    placeNameNode.appendChild(generateCountryNode({ name: country.name }));
  },
  addSettlementMarkup: (placeNameNode: Element, markupPlace: MarkupPlaceData) => {
    const country = markupPlace.country;

    if (country === null) {
      throw new Error('markupData contains no settlement or country');
    }
    placeNameNode.appendChild(
      generateSettlementNode({
        key: markupPlace.key,
        name: markupPlace.name,
        type: markupPlace.kind,
      }),
    );
    placeNameNode.appendChild(generateCountryNode({ name: country.name }));
  },
  addInstitutionMarkup: (placeNameNode: Element, markupPlace: MarkupPlaceData) => {
    const country = markupPlace.country;
    const settlement = markupPlace.settlement;

    if (country === null || settlement === null || settlement.key === null) {
      throw new Error('markupData contains no settlement or country');
    }

    const instNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
    instNode.setAttribute('style', 'hidden');
    instNode.setAttribute('key', markupPlace.key);
    instNode.setAttribute('type', 'institution');
    instNode.setAttribute('subtype', markupPlace.kind === null ? '' : markupPlace.kind);

    instNode.textContent = markupPlace.name;
    placeNameNode.appendChild(instNode);

    placeNameNode.appendChild(
      generateSettlementNode({
        key: settlement.key,
        name: settlement.name,
        type: settlement.type,
      }),
    );

    placeNameNode.appendChild(generateCountryNode({ name: country.name }));
  },
  addAuthorMarkup: (titleNode: Element, people: SnippetEntity[]) => {
    for (const person of people) {
      const nameNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
      nameNode.setAttribute('style', 'hidden');
      nameNode.setAttribute('type', 'author');
      nameNode.setAttribute('key', person.entityKey);
      nameNode.textContent = person.entityDisplayName;
      titleNode.appendChild(nameNode);
    }
  },
  addDateMarkup: (xmlDoc: XMLDocument, dateNode: Element) => {
    const markedSpan = xmlDoc.querySelector('span.marked');
    if (!markedSpan) throw new Error('No marked span found in XML document');

    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, dateNode);
  },
  addProtagLetterMarkup: (
    nodeToUpdate: Element,
    markupLetterData: [{ letterKey: string; letterName: string; authors: SnippetEntity[] }],
  ) => {
    const titleNode = document.createElementNS(EditorConstants.TEI_NS, 'title');
    titleNode.setAttribute('xml:id', EditorUtils.markupGeneration.generateXmlId('title'));

    for (const letterData of markupLetterData) {
      for (const authorData of letterData.authors) {
        const nameNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
        nameNode.setAttribute('type', 'author');
        nameNode.setAttribute('key', authorData.entityKey);
        nameNode.setAttribute('style', 'hidden');
        nameNode.textContent = authorData.entityDisplayName;
        titleNode.appendChild(nameNode);
      }

      const letterNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
      letterNode.setAttribute('type', 'letter');
      letterNode.setAttribute('key', letterData.letterKey);
      letterNode.setAttribute('style', 'hidden');
      letterNode.textContent = letterData.letterName;
      titleNode.appendChild(letterNode);
    }

    EditorUtils.markupGeneration.replaceMarkedNode(nodeToUpdate, titleNode);
  },
  addGbLetterMarkup: (
    nodeToUpdate: Element,
    markupLetterData: [{ letterKey: string; letterName: string; authors: SnippetEntity[] }],
  ) => {
    const titleNode = document.createElementNS(EditorConstants.TEI_NS, 'title');
    titleNode.setAttribute('xml:id', EditorUtils.markupGeneration.generateXmlId('title'));

    for (const entry of markupLetterData) {
      for (const author of entry.authors) {
        const nameNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
        nameNode.setAttribute('type', 'author');
        nameNode.setAttribute('key', author.entityKey);
        nameNode.setAttribute('style', 'hidden');
        nameNode.textContent = author.entityDisplayName;
        titleNode.appendChild(nameNode);
      }

      const letterNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
      letterNode.setAttribute('type', 'letter');
      letterNode.setAttribute('key', entry.letterKey);
      letterNode.setAttribute('style', 'hidden');
      letterNode.textContent = entry.letterName;
      titleNode.appendChild(letterNode);
    }

    EditorUtils.markupGeneration.replaceMarkedNode(nodeToUpdate, titleNode);
  },
  addPersonMarkup: (xmlDoc: Document, peopleMarkupData: MarkupPersonData[]): string => {
    const markedSpan = xmlDoc.querySelectorAll('span.marked');
    if (!markedSpan) throw new Error('No marked span found in the document');

    const xmlId = EditorUtils.markupGeneration.generateXmlId('persName');

    markedSpan.forEach((span) => {
      const persNameNode = document.createElementNS(EditorConstants.TEI_NS, 'persName');
      persNameNode.setAttribute('xml:id', xmlId);

      peopleMarkupData.forEach((markup) => {
        const nameNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
        nameNode.setAttribute('type', 'person');
        nameNode.setAttribute('key', markup.key);
        nameNode.setAttribute('style', 'hidden');
        nameNode.textContent = markup.nameDisplay;

        persNameNode.appendChild(nameNode);
      });

      EditorUtils.markupGeneration.replaceMarkedNode(span, persNameNode);
    });

    return xmlId;
  },
  noteMarkup: (
    xmlDoc: XMLDocument | null,
    userLogin: string,
    noteContent: string,
    commentType: string,
  ): { xmlId: string } => {
    if (!xmlDoc) {
      throw new Error('No xml document provided');
    }

    const xmlId = EditorUtils.markupGeneration.generateXmlId('note');
    const markedSpan = xmlDoc.querySelector('span.marked');

    if (!markedSpan || !markedSpan.parentNode)
      throw new Error('no markedSpan found in markupGeneration');

    const content = markedSpan.textContent || '';

    // Create <note> element
    const noteElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'note');
    noteElement.setAttribute('resp', userLogin);
    noteElement.setAttribute('type', commentType);
    noteElement.setAttribute('xml:id', xmlId);
    noteElement.setAttribute('xml:lang', 'de');
    noteElement.textContent = `${content} - ${noteContent}`; // Prefix comment with span content

    // Replace <span> with its inner text
    const textNode = document.createTextNode(content);
    markedSpan.parentNode.replaceChild(textNode, markedSpan);

    // Insert <note> after the text
    textNode.after(noteElement);

    return {
      xmlId: xmlId,
    };
  },
  updateNoteMarkup: (
    xmlDoc: Document,
    xmlId: string,
    noteType: string,
    noteLanguage: string,
    noteContent: string,
  ): { oldNoteType: string | null; oldNoteContent: string | null } => {
    const noteElement = EditorUtils.xmlCheck.elementByXmlTypeAndId(xmlId, 'note', xmlDoc);

    if (!noteElement) {
      throw new Error(`Note with xml:id ${xmlId} not found`);
    }

    const oldNoteContent = noteElement.textContent;
    const oldNoteType = noteElement.getAttribute('type');

    noteElement.setAttribute('type', noteType);
    noteElement.setAttribute('xml:lang', noteLanguage);
    noteElement.innerHTML = noteContent;

    return {
      oldNoteType: oldNoteType,
      oldNoteContent: oldNoteContent,
    };
  },
  deleteNoteMarkup: (xmlDoc: Document, xmlId: string) => {
    const noteElement = EditorUtils.xmlCheck.elementByXmlTypeAndId(xmlId, 'note', xmlDoc);

    if (!noteElement) {
      throw new Error(`Note with xml:id ${xmlId} not found`);
    }

    noteElement.remove();
  },

  insertActOfWritingBlock: (xmlDoc: XMLDocument, authorWriters: ActOfWritingElement[]): void => {
    const nValue = xmlDoc.querySelectorAll("div[type='act_of_writing']").length + 1;

    const bodyTag = xmlDoc.querySelector('text > body');

    if (!bodyTag) {
      throw new Error('Could not insert act_of_writing block, because no <body> tag was found.');
    }

    const div = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'div');
    div.setAttribute('type', 'act_of_writing');
    div.setAttribute('n', nValue.toString());
    div.setAttribute('xml:id', EditorUtils.markupGeneration.generateXmlId('div'));

    const rolePriority: Record<'author' | 'writer', number> = {
      author: 0,
      writer: 1,
    };
    const sortedAuthorWriters = authorWriters.sort(
      (a, b) =>
        rolePriority[a.role as 'author' | 'writer'] - rolePriority[b.role as 'author' | 'writer'],
    );

    sortedAuthorWriters.forEach((authorWriter) => {
      const docAuthor = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'docAuthor');
      docAuthor.setAttribute('style', 'hidden');
      docAuthor.setAttribute('data-key', authorWriter.key);
      docAuthor.setAttribute('resp', authorWriter.role);
      docAuthor.textContent = authorWriter.name;
      div.appendChild(docAuthor);
    });

    const paragraph = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'p');
    paragraph.setAttribute('style', 'paragraph_without_indent');

    const startPI = xmlDoc.createProcessingInstruction(
      'oxy_custom_start',
      'type="oxy_content_highlight" color="235,192,230"',
    );
    const endPI = xmlDoc.createProcessingInstruction('oxy_custom_end', '');

    paragraph.appendChild(startPI);
    paragraph.appendChild(xmlDoc.createTextNode('Brieftext'));
    paragraph.appendChild(endPI);

    div.appendChild(paragraph);

    bodyTag.appendChild(div); // or use some custom selector
  },
  addSaluteMarkup: (referencedNode: Element, saluteNode: Element): void => {
    let prevSibling: Element | null = referencedNode.previousElementSibling;

    // loop until we find a node which is not a salute
    while (prevSibling && prevSibling.nodeName === 'SALUTE') {
      prevSibling = prevSibling.previousElementSibling;
    }

    const parent = referencedNode.parentNode;
    if (!parent) throw new Error('Referenced node has no parent');

    // insert saluteNode before the first non-salute sibling (or at start if prevSibling is null)
    parent.insertBefore(saluteNode, prevSibling?.nextElementSibling ?? parent.firstChild);
  },
};
