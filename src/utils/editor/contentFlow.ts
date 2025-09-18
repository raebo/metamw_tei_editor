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
};
