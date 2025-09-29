import { EditorUtils } from '@src/utils/editor/index';
import { EditorConstants } from '@src/constants/editor';

export const contentFlow = {
  insertPageBreak: (xmlDoc: Document) => {
    // get the marked node
    const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);
    if (!markedNode) return;

    // get all page break nodes in the document
    const pageBreakNodes = xmlDoc.getElementsByTagName('pb');

    // get nearest page break node before the marked node
    let lastPbNumber = 0;
    for (const pb of pageBreakNodes) {
      if (pb.compareDocumentPosition(markedNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
        // pb is before markedNode
        const nAttr = pb.getAttribute('n');
        if (nAttr) {
          const parsed = parseInt(nAttr, 10);
          if (!isNaN(parsed) && parsed > lastPbNumber) {
            lastPbNumber = parsed;
          }
        }
      }
    }

    const newNumber = lastPbNumber + 1;

    // create the new page break node
    //    <seg type="pagebreak">|2| <pb n="2" type="pagebreak"/></seg
    const segNode = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'seg');
    segNode.setAttribute('type', 'pagebreak');
    segNode.textContent = `|${newNumber}| `;

    const pageBreak = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'pb');
    pageBreak.setAttribute('n', newNumber.toString());
    pageBreak.setAttribute('type', 'pagebreak');

    segNode.appendChild(pageBreak);

    // update the position attributes of all page break nodes after the inserted one
    const counter = newNumber + 1;

    for (const pb of pageBreakNodes) {
      const pgPos = pb.getAttribute('n');

      if (!pgPos || parseInt(pgPos) < newNumber) {
        continue; // skip ones before new seg or without n attribute
      }

      const newPos = parseInt(pgPos) + 1;

      pb.setAttribute('n', newPos.toString());

      const segParent = pb.parentNode;
      if (segParent && segParent.nodeType === Node.ELEMENT_NODE) {
        const el = segParent as Element;
        if (el.nodeName === 'seg' && el.getAttribute('type') === 'pagebreak') {
          // remove old text node and insert new label
          if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
            el.removeChild(el.firstChild);
          }
          el.insertBefore(xmlDoc.createTextNode(`|${counter}| `), pb);
        }
      }
    }

    markedNode.parentNode?.insertBefore(segNode, markedNode);

    while (markedNode.firstChild) {
      markedNode.parentNode?.insertBefore(markedNode.firstChild, markedNode);
    }
    markedNode.parentNode?.removeChild(markedNode);
  },
  reorderExistingPageBreaks: (xmlDoc: Document) => {
    // get all seg nodes with type="pagebreak"
    const segNodes = xmlDoc.querySelectorAll('seg[type="pagebreak"]');

    let counter = 1;
    segNodes.forEach((seg) => {
      // update the text node to |n|
      if (seg.firstChild && seg.firstChild.nodeType === Node.TEXT_NODE) {
        seg.firstChild.textContent = `|${counter}| `;
      } else {
        // if no text node, create one
        const textNode = xmlDoc.createTextNode(`|${counter}| `);
        seg.insertBefore(textNode, seg.firstChild);
      }

      // find the pb child and update its n attribute
      const pb = seg.querySelector('pb');
      if (pb) {
        pb.setAttribute('n', counter.toString());
      } else {
        // if no pb child, create one
        const newPb = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'pb');
        newPb.setAttribute('n', counter.toString());
        newPb.setAttribute('type', 'pagebreak');
        seg.appendChild(newPb);
      }

      counter += 1;
    });
  },
  insertColumnBreak: (xmlDoc: Document) => {
    const markedNode = EditorUtils.xmlCheck.markedSpanNode(xmlDoc);
    if (!markedNode) return;

    const breakNode = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'cb');
    breakNode.setAttribute('type', 'column_break');
    breakNode.setAttribute('n', '1');

    markedNode.parentNode?.insertBefore(breakNode, markedNode);

    const parentDiv = markedNode.closest('div[type="act_of_writing"]');

    const columnBreakNodes = parentDiv ? Array.from(parentDiv.getElementsByTagName('cb')) : [];

    let counter = 1;
    columnBreakNodes.forEach((breakNode: Element) => {
      const newPos = counter;
      breakNode.setAttribute('n', newPos.toString());
      counter++;
    });

    while (markedNode.firstChild) {
      markedNode.parentNode?.insertBefore(markedNode.firstChild, markedNode);
    }
    markedNode.parentNode?.removeChild(markedNode);
  },
};
