import { EditorConstants, HeaderPerson } from '../../constants/editor';

function currentWritingAct(xmlDoc: XMLDocument, numberOfWritingAct: number): Element {
  const allWritingActsList = allWritingActs(xmlDoc);
  const currentAct = Array.from(allWritingActsList).find((act) => {
    return act.getAttribute('n') === numberOfWritingAct.toString();
  });

  if (!currentAct) throw new Error('No writing Act foud for number: ' + numberOfWritingAct);

  return currentAct;
}

function allWritingActs(xmlDoc: XMLDocument): Element[] {
  const textNode = xmlDoc.children[0].children[1];
  if (!textNode) throw new Error('No text node found in XML document.');

  const bodyNode = Array.from(textNode.children).find(
    (child) => child.nodeName.toLowerCase() === 'body',
  );

  if (!bodyNode) throw new Error('No body node found in text.');

  return Array.from(bodyNode.children).filter((bodyChild) => {
    return (
      bodyChild.nodeName.toLowerCase() === 'div' &&
      bodyChild.getAttribute('type') === 'act_of_writing'
    );
  });
}

export const writingActContent = {
  currentActIsMovableUp: (node: Element | null): boolean => {
    const numberOfWritingAct = Number((node as Element).getAttribute('n'));
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const parentChildren = node?.parentNode?.children;

    if (!parentChildren) return false;

    const allWritingActsList = Array.from(parentChildren).filter((bodyChild) => {
      return (
        bodyChild.nodeName.toLowerCase() === 'div' &&
        bodyChild.getAttribute('type') === 'act_of_writing'
      );
    });

    return numberOfWritingAct > 1 && allWritingActsList.length > 1;
  },
  currenActIsMovableDown: (node: Element | null): boolean => {
    const numberOfWritingAct = Number((node as Element).getAttribute('n'));
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const parentChildren = node?.parentNode?.children;

    if (!parentChildren) return false;

    const allWritingActsList = Array.from(parentChildren).filter((bodyChild) => {
      return (
        bodyChild.nodeName.toLowerCase() === 'div' &&
        bodyChild.getAttribute('type') === 'act_of_writing'
      );
    });

    return numberOfWritingAct < allWritingActsList.length; //minimal position is 1
  },
  moveActUp: (xmlDoc: XMLDocument | null, node: Element): void => {
    if (!xmlDoc) throw new Error('No XML document provided.');

    const resolved = currentWritingAct(xmlDoc, Number(node.getAttribute('n')));
    if (!resolved) throw new Error('Node not found in xmlDoc.');

    const prevSibling = resolved.previousElementSibling;
    if (!prevSibling) throw new Error('No previous sibling found.');

    const parent = resolved.parentNode;
    if (!parent) throw new Error('No parent node found.');

    parent.insertBefore(resolved, prevSibling);

    const nResolved = resolved.getAttribute('n');
    const nNext = prevSibling.getAttribute('n');

    if (nResolved !== null && nNext !== null) {
      resolved.setAttribute('n', nNext);
      prevSibling.setAttribute('n', nResolved);
    }
  },
  moveActDown: (xmlDoc: XMLDocument | null, node: Element): void => {
    if (!xmlDoc) throw new Error('No XML document provided.');

    const resolved = currentWritingAct(xmlDoc, Number(node.getAttribute('n')));
    if (!resolved) throw new Error('Node not found in xmlDoc.');

    const nextSibling = resolved.nextElementSibling;
    if (!nextSibling) throw new Error('No next sibling found.');

    const parent = resolved.parentNode;
    if (!parent) throw new Error('No parent node found.');

    parent.insertBefore(nextSibling, resolved);

    const nResolved = resolved.getAttribute('n');
    const nNext = nextSibling.getAttribute('n');

    if (nResolved !== null && nNext !== null) {
      resolved.setAttribute('n', nNext);
      nextSibling.setAttribute('n', nResolved);
    }
  },
  extractAuthorsWriters: (
    xmlDoc: XMLDocument,
    numberOfWritingAct: number | null,
  ): { authors: HeaderPerson[]; writers: HeaderPerson[] } => {
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const authors: HeaderPerson[] = [];
    const writers: HeaderPerson[] = [];

    const writingAct = currentWritingAct(xmlDoc, numberOfWritingAct);

    Array.from(writingAct.children)
      .filter((node) => {
        return node.nodeName === 'docAuthor' && node.getAttribute('resp') === 'author';
      })
      .forEach((child) => {
        authors.push({
          name: child.textContent?.trim() || '',
          key: child.getAttribute('data-key'),
        } as HeaderPerson);
      });

    Array.from(writingAct.children)
      .filter((node) => {
        return node.nodeName === 'docAuthor' && node.getAttribute('resp') === 'writer';
      })
      .forEach((child) => {
        writers.push({
          name: child.textContent?.trim() || '',
          key: child.getAttribute('data-key'),
        } as HeaderPerson);
      });

    return { authors, writers };
  },
  setAuthorsWriters: (
    xmlDoc: XMLDocument,
    numberOfWritingAct: number | null,
    authors: HeaderPerson[],
    writers: HeaderPerson[],
  ): void => {
    const newChildNodes: Element[] = [];
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const writingAct = currentWritingAct(xmlDoc, numberOfWritingAct);

    Array.from(writingAct.children).forEach((child) => {
      if (
        child.nodeName === 'docAuthor' &&
        (child.getAttribute('resp') === 'author' || child.getAttribute('resp') === 'writer')
      ) {
        writingAct.removeChild(child);
      }
    });

    writers.reverse().forEach((writer) => {
      const writerElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'docAuthor');
      writerElement.setAttribute('resp', 'writer');
      if (writer.key) {
        writerElement.setAttribute('data-key', writer.key);
      }
      writerElement.textContent = writer.name;
      newChildNodes.push(writerElement);
    });

    authors.reverse().forEach((author) => {
      const authorElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'docAuthor');
      authorElement.setAttribute('resp', 'author');
      if (author.key) {
        authorElement.setAttribute('data-key', author.key);
      }
      authorElement.textContent = author.name;
      newChildNodes.push(authorElement);
    });

    newChildNodes.map((node: Element) => {
      if (writingAct.firstChild) {
        writingAct.insertBefore(node, writingAct.firstChild);
      } else {
        writingAct.appendChild(node);
      }
    });
  },
};
