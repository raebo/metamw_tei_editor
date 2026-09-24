import {
  captureForeignHandAnnotationCaret,
  deleteForeignHandAnnotation,
  FOREIGN_HAND_ANNOTATION_PLACES,
  FOREIGN_HAND_ANNOTATION_SUBTYPES,
  insertForeignHandAnnotation,
  readForeignHandAnnotation,
  updateForeignHandAnnotation,
} from '@src/utils/editor/foreignHandAnnotation';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content = 'Alpha Beta') =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>${content}</p></div></body></text></TEI>`,
    'application/xml',
  );

const baseData = {
  content: 'Randnotiz',
  subtype: 'anonymus',
  place: 'bottom',
  responsibility: '',
  number: '1',
};

describe('foreignHandAnnotation', () => {
  it('maps a collapsed WYSIWYG caret to its exact XML text position', () => {
    document.body.innerHTML = '<div><p data-editor-xml-path="0.0.0.0">Alpha Beta</p></div>';
    const textNode = document.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 5);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(captureForeignHandAnnotationCaret(new XMLSerializer().serializeToString(parseXml()), selection)).toEqual({
      elementType: 'p',
      sourcePath: '0.0.0.0',
      reference: 'caret:0:5',
    });
  });

  it.each(FOREIGN_HAND_ANNOTATION_SUBTYPES)('creates the supported %s author type safely at the caret', (subtype) => {
    const xmlDoc = parseXml();
    const responsibility = subtype === 'name' ? '#PSN0000001' : '';
    const note = insertForeignHandAnnotation(xmlDoc, '0.0.0.0', 'caret:0:5', {
      ...baseData,
      subtype,
      responsibility,
      content: '<script>alert(1)</script>',
    });

    expect(note.getAttribute('type')).toBe('note');
    expect(note.getAttribute('subtype')).toBe(subtype);
    expect(note.getAttribute('place')).toBe('bottom');
    expect(note.getAttribute('n')).toBe('1');
    expect(note.getAttribute('style')).toBe('hidden');
    expect(note.getAttribute('xml:id')).toMatch(/^note_/);
    expect(note.getAttribute('resp')).toBe(responsibility || null);
    expect(note.querySelector('script')).toBeNull();
    expect(note.textContent).toBe('<script>alert(1)</script>');
    expect(xmlDoc.querySelector('p')?.childNodes[0].nodeValue).toBe('Alpha');
    expect(note.nextSibling?.nodeValue).toBe(' Beta');
  });

  it.each(FOREIGN_HAND_ANNOTATION_PLACES)('accepts the supported %s position', (place) => {
    const note = insertForeignHandAnnotation(parseXml(), '0.0.0.0', 'caret:0:5', {
      ...baseData,
      place,
    });
    expect(note.getAttribute('place')).toBe(place);
  });

  it('preserves the xml:id and unknown existing values when only content changes', () => {
    const xmlDoc = parseXml(
      '<note xml:id="note_legacy" type="note" subtype="legacy-writer" place="legacy-place" n="A" resp="Legacy">Old</note>',
    );
    const note = xmlDoc.querySelector('note')!;
    const current = readForeignHandAnnotation(note);

    updateForeignHandAnnotation(note, { ...current, content: 'Updated' });

    expect(note.getAttribute('xml:id')).toBe('note_legacy');
    expect(note.getAttribute('subtype')).toBe('legacy-writer');
    expect(note.getAttribute('place')).toBe('legacy-place');
    expect(note.getAttribute('n')).toBe('A');
    expect(note.getAttribute('resp')).toBe('Legacy');
    expect(note.textContent).toBe('Updated');
  });

  it.each([
    [{ ...baseData, content: ' ' }, 'content'],
    [{ ...baseData, subtype: 'name' }, 'responsibility'],
    [{ ...baseData, subtype: 'name', responsibility: 'Doe, Jane' }, 'person index'],
    [{ ...baseData, subtype: 'receiver', responsibility: 'Not allowed' }, 'responsibility'],
    [{ ...baseData, place: 'left' }, 'position'],
  ])('rejects invalid data containing %s', (data, expectedMessage) => {
    expect(() => insertForeignHandAnnotation(parseXml(), '0.0.0.0', 'caret:0:5', data)).toThrow(expectedMessage);
  });

  it('deletes only a foreign-hand annotation', () => {
    const xmlDoc = parseXml(
      '<note xml:id="note_delete" type="note" subtype="anonymus" place="bottom" n="7">Old</note><note xml:id="note_keep" type="note" subtype="receiver" place="below" n="9">Keep</note>',
    );
    deleteForeignHandAnnotation(xmlDoc.querySelector('note')!);
    expect(xmlDoc.querySelectorAll('note')).toHaveLength(1);
    expect(xmlDoc.querySelector('note')?.getAttribute('xml:id')).toBe('note_keep');
    expect(xmlDoc.querySelector('note')?.getAttribute('n')).toBe('1');
  });

  it('renumbers all foreign-hand annotations by document order after insertion', () => {
    const xmlDoc = parseXml(
      'Alpha<note xml:id="note_first" type="note" subtype="anonymus" place="bottom" n="5">First</note> Beta<note xml:id="note_last" type="note" subtype="receiver" place="below" n="A">Last</note>',
    );

    const inserted = insertForeignHandAnnotation(xmlDoc, '0.0.0.0', 'caret:2:0', {
      ...baseData,
      number: '999',
    });

    expect(Array.from(xmlDoc.querySelectorAll('note')).map((note) => note.getAttribute('n'))).toEqual(['1', '2', '3']);
    expect(inserted.getAttribute('n')).toBe('2');
  });
});
