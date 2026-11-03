import { EditorConstants } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor';

const parseXml = (teiHeaderContent: string): XMLDocument =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}">${teiHeaderContent}<text><body/></text></TEI>`,
    'application/xml',
  );

const elementsByName = (root: Element, localName: string): Element[] =>
  Array.from(root.getElementsByTagNameNS(EditorConstants.TEI_NS, localName));

const actionByType = (teiHeader: Element, type: 'sent' | 'received'): Element | undefined =>
  elementsByName(teiHeader, 'correspAction').find((action) => action.getAttribute('type') === type);

const isWriterRespStmtForTest = (respStmt: Element): boolean =>
  Array.from(respStmt.children).some(
    (child) =>
      (child.localName === 'resp' && child.textContent?.trim().toLowerCase() === 'writer') ||
      (child.localName === 'persName' && child.getAttribute('resp') === 'writer'),
  );

describe('teiHeaderContent optional correspondence structures', () => {
  it('adds authors, writers and receivers when the person nodes are missing', () => {
    const xmlDoc = parseXml(`
      <teiHeader>
        <fileDesc>
          <titleStmt>
            <title>Testbrief</title>
            <respStmt resp="transcription">
              <resp resp="transcription">Transkription:</resp>
              <name resp="transcription">FMB-C</name>
            </respStmt>
            <respStmt resp="edition">
              <resp resp="edition">Edition:</resp>
              <name resp="edition">FMB-C</name>
            </respStmt>
          </titleStmt>
          <publicationStmt><p/></publicationStmt>
          <sourceDesc><p/></sourceDesc>
        </fileDesc>
        <profileDesc><correspDesc/></profileDesc>
      </teiHeader>
    `);
    const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
    const authors = [{ key: 'PSN0000001', name: 'Autorin' }];
    const writers = [{ key: 'PSN0000002', name: 'Schreiber' }];
    const receivers = [{ key: 'PSN0000003', name: 'Empfängerin' }];

    expect(EditorUtils.teiHeaderContent.extractAuthorWriters(teiHeader)).toEqual({
      authors: [],
      writers: [],
    });

    EditorUtils.teiHeaderContent.setAuthorWritersFirstPosition(teiHeader, authors, writers);
    EditorUtils.teiHeaderContent.setAuthorsWritersSndPosition(teiHeader, authors, writers);
    EditorUtils.teiHeaderContent.setReceivers(teiHeader, receivers);

    const titleAuthor = elementsByName(teiHeader, 'author')[0];
    const writerRespStmt = elementsByName(teiHeader, 'respStmt').find(isWriterRespStmtForTest)!;
    const titleWriter = writerRespStmt.getElementsByTagNameNS(EditorConstants.TEI_NS, 'persName')[0];
    const sentPeople = elementsByName(actionByType(teiHeader, 'sent')!, 'persName');
    const receivedPeople = elementsByName(actionByType(teiHeader, 'received')!, 'persName');

    expect(titleAuthor.getAttribute('data-key')).toBe('PSN0000001');
    expect(titleWriter.getAttribute('data-key')).toBe('PSN0000002');
    expect(writerRespStmt.getAttribute('resp')).toBeNull();
    expect(elementsByName(teiHeader, 'respStmt')).toHaveLength(3);
    expect(
      elementsByName(teiHeader, 'respStmt')
        .find((respStmt) => respStmt.getAttribute('resp') === 'transcription')
        ?.getElementsByTagNameNS(EditorConstants.TEI_NS, 'persName'),
    ).toHaveLength(0);
    expect(sentPeople.map((person) => person.getAttribute('resp'))).toEqual(['author', 'writer']);
    expect(receivedPeople).toHaveLength(1);
    expect(receivedPeople[0].getAttribute('data-key')).toBe('PSN0000003');
  });

  it('creates profileDesc and correspondence containers when they are missing', () => {
    const xmlDoc = parseXml(`
      <teiHeader>
        <fileDesc>
          <titleStmt><title>Testbrief</title></titleStmt>
          <publicationStmt><p/></publicationStmt>
          <sourceDesc><p/></sourceDesc>
        </fileDesc>
        <revisionDesc/>
      </teiHeader>
    `);
    const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);

    EditorUtils.teiHeaderContent.setReceivers(teiHeader, [{ key: 'PSN0000003', name: 'Empfängerin' }]);

    const profileDesc = elementsByName(teiHeader, 'profileDesc')[0];
    const receiver = elementsByName(actionByType(teiHeader, 'received')!, 'persName')[0];

    expect(profileDesc.nextElementSibling?.localName).toBe('revisionDesc');
    expect(receiver.textContent).toBe('Empfängerin');
  });

  it('offers both management actions at the top of an empty TEI header', () => {
    const xmlDoc = parseXml(`
      <teiHeader>
        <fileDesc>
          <titleStmt><title>Testbrief</title></titleStmt>
          <publicationStmt><p/></publicationStmt>
          <sourceDesc><p/></sourceDesc>
        </fileDesc>
        <profileDesc><correspDesc/></profileDesc>
      </teiHeader>
    `);
    const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
    let authorWriterMatches = false;
    let receiverMatches = false;

    EditorUtils.xmlCheck.isNodeMatchingPath(
      teiHeader,
      EditorUtils.rightClickPathHandles.manageAuthorWriterAncestorPaths(),
      () => {
        authorWriterMatches = true;
      },
      () => {},
    );
    EditorUtils.xmlCheck.isNodeMatchingPath(
      teiHeader,
      EditorUtils.rightClickPathHandles.manageReceiverAncestorPaths(),
      () => {
        receiverMatches = true;
      },
      () => {},
    );

    expect(authorWriterMatches).toBe(true);
    expect(receiverMatches).toBe(true);
  });

  it('offers both management actions from an existing correspondence person', () => {
    const xmlDoc = parseXml(`
      <teiHeader>
        <fileDesc>
          <titleStmt><title>Testbrief</title></titleStmt>
          <publicationStmt><p/></publicationStmt>
          <sourceDesc><p/></sourceDesc>
        </fileDesc>
        <profileDesc>
          <correspDesc>
            <correspAction type="received">
              <persName data-key="PSN0000003" resp="receiver">Empfängerin</persName>
            </correspAction>
          </correspDesc>
        </profileDesc>
      </teiHeader>
    `);
    const receiver = elementsByName(EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc), 'persName')[0];
    let authorWriterMatches = false;
    let receiverMatches = false;

    EditorUtils.xmlCheck.isNodeMatchingPath(
      receiver,
      EditorUtils.rightClickPathHandles.manageAuthorWriterAncestorPaths(),
      () => {
        authorWriterMatches = true;
      },
      () => {},
    );
    EditorUtils.xmlCheck.isNodeMatchingPath(
      receiver,
      EditorUtils.rightClickPathHandles.manageReceiverAncestorPaths(),
      () => {
        receiverMatches = true;
      },
      () => {},
    );

    expect(authorWriterMatches).toBe(true);
    expect(receiverMatches).toBe(true);
  });
});
