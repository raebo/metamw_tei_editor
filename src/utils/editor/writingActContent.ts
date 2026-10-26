import { EditorConstants, HeaderPerson } from '@src/constants/editor';

function currentWritingAct(xmlDoc: XMLDocument, numberOfWritingAct: number): Element {
  const allWritingActsList = allWritingActs(xmlDoc);
  const currentAct = Array.from(allWritingActsList).find((act) => {
    return act.getAttribute('n') === numberOfWritingAct.toString();
  });

  if (!currentAct) throw new Error('No writing Act foud for number: ' + numberOfWritingAct);

  return currentAct;
}

function allWritingActs(xmlDoc: XMLDocument): Element[] {
  const bodyNode = xmlDoc.querySelector('text > body');
  if (!bodyNode) throw new Error('No body node found in text.');

  return Array.from(bodyNode.children).filter((bodyChild) => {
    return bodyChild.nodeName.toLowerCase() === 'div' && bodyChild.getAttribute('type') === 'act_of_writing';
  });
}

function renumberWritingActs(xmlDoc: XMLDocument): void {
  allWritingActs(xmlDoc).forEach((writingAct, index) => writingAct.setAttribute('n', String(index + 1)));
}

export const writingActContent = {
  currentActIsMovableUp: (node: Element | null): boolean => {
    const numberOfWritingAct = Number((node as Element).getAttribute('n'));
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const parentChildren = node?.parentNode?.children;

    if (!parentChildren) return false;

    const allWritingActsList = Array.from(parentChildren).filter((bodyChild) => {
      return bodyChild.nodeName.toLowerCase() === 'div' && bodyChild.getAttribute('type') === 'act_of_writing';
    });

    return numberOfWritingAct > 1 && allWritingActsList.length > 1;
  },
  currenActIsMovableDown: (node: Element | null): boolean => {
    const numberOfWritingAct = Number((node as Element).getAttribute('n'));
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const parentChildren = node?.parentNode?.children;

    if (!parentChildren) return false;

    const allWritingActsList = Array.from(parentChildren).filter((bodyChild) => {
      return bodyChild.nodeName.toLowerCase() === 'div' && bodyChild.getAttribute('type') === 'act_of_writing';
    });

    return numberOfWritingAct < allWritingActsList.length; //minimal position is 1
  },
  moveActUp: (xmlDoc: XMLDocument | null, node: Element): void => {
    if (!xmlDoc) throw new Error('No XML document provided.');

    const resolved = currentWritingAct(xmlDoc, Number(node.getAttribute('n')));
    const writingActs = allWritingActs(xmlDoc);
    const currentIndex = writingActs.indexOf(resolved);
    const previousWritingAct = writingActs[currentIndex - 1];
    if (!previousWritingAct) throw new Error('No previous writing act found.');

    const parent = resolved.parentNode;
    if (!parent) throw new Error('No parent node found.');

    parent.insertBefore(resolved, previousWritingAct);
    renumberWritingActs(xmlDoc);
  },
  moveActDown: (xmlDoc: XMLDocument | null, node: Element): void => {
    if (!xmlDoc) throw new Error('No XML document provided.');

    const resolved = currentWritingAct(xmlDoc, Number(node.getAttribute('n')));
    const writingActs = allWritingActs(xmlDoc);
    const currentIndex = writingActs.indexOf(resolved);
    const nextWritingAct = writingActs[currentIndex + 1];
    if (!nextWritingAct) throw new Error('No next writing act found.');

    const parent = resolved.parentNode;
    if (!parent) throw new Error('No parent node found.');

    parent.insertBefore(nextWritingAct, resolved);
    renumberWritingActs(xmlDoc);
  },
  extractAuthorsWriters: (xmlDoc: XMLDocument, numberOfWritingAct: number | null): { authors: HeaderPerson[]; writers: HeaderPerson[] } => {
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
  setAuthorsWriters: (xmlDoc: XMLDocument, numberOfWritingAct: number | null, authors: HeaderPerson[], writers: HeaderPerson[]): void => {
    const newChildNodes: Element[] = [];
    if (!numberOfWritingAct) throw new Error('No writing act number provided.');

    const writingAct = currentWritingAct(xmlDoc, numberOfWritingAct);

    Array.from(writingAct.children).forEach((child) => {
      if (child.nodeName === 'docAuthor' && (child.getAttribute('resp') === 'author' || child.getAttribute('resp') === 'writer')) {
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
