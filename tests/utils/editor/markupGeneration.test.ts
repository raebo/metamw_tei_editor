import { EditorConstants } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor';

const parseXml = (body: string) =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>${body}</p></div></body></text></TEI>`,
    'application/xml',
  );

describe('markupGeneration comments', () => {
  it.each(EditorConstants.noteTypeItems)('creates a $value comment with its selected language and responsibility', ({ value }) => {
    const xmlDoc = parseXml('<span class="marked">Referenced text</span>');

    const { xmlId } = EditorUtils.markupGeneration.noteMarkup(xmlDoc, 'TB', 'Comment text', value, 'fr');

    const note = xmlDoc.querySelector('note');
    expect(note?.getAttribute('xml:id')).toBe(xmlId);
    expect(note?.getAttribute('type')).toBe(value);
    expect(note?.getAttribute('xml:lang')).toBe('fr');
    expect(note?.getAttribute('resp')).toBe('TB');
    expect(note?.textContent).toBe('Comment text');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
    expect(xmlDoc.querySelector('p')?.firstChild?.textContent).toBe('Referenced text');
  });

  it('updates comment text as plain text and preserves identity and responsibility', () => {
    const xmlDoc = parseXml('<note xml:id="note_existing" type="word_description" xml:lang="de" resp="AB">Old</note>');
    const note = xmlDoc.querySelector('note')!;

    EditorUtils.markupGeneration.updateNoteMarkup(xmlDoc, 'note_existing', 'translation', 'en', '<img src=x onerror=alert(1)>Safe text');

    expect(note.getAttribute('xml:id')).toBe('note_existing');
    expect(note.getAttribute('resp')).toBe('AB');
    expect(note.getAttribute('type')).toBe('translation');
    expect(note.getAttribute('xml:lang')).toBe('en');
    expect(note.textContent).toBe('<img src=x onerror=alert(1)>Safe text');
    expect(note.children).toHaveLength(0);
  });

  it.each(EditorConstants.noteTypeLanguages)('stores the configured $value language', ({ value }) => {
    const xmlDoc = parseXml('<span class="marked">Referenced text</span>');

    EditorUtils.markupGeneration.noteMarkup(xmlDoc, 'AB', 'Comment', 'single_place_comment', value);

    expect(xmlDoc.querySelector('note')?.getAttribute('xml:lang')).toBe(value);
  });

  it('preserves unknown existing type and language values during content updates', () => {
    const xmlDoc = parseXml('<note xml:id="note_legacy" type="legacy-comment" xml:lang="x-legacy" resp="AB">Old</note>');

    EditorUtils.markupGeneration.updateNoteMarkup(xmlDoc, 'note_legacy', 'legacy-comment', 'x-legacy', 'Updated');

    const note = xmlDoc.querySelector('note');
    expect(note?.getAttribute('type')).toBe('legacy-comment');
    expect(note?.getAttribute('xml:lang')).toBe('x-legacy');
    expect(note?.textContent).toBe('Updated');
  });

  it('rejects missing required values and unsupported new values', () => {
    const xmlDoc = parseXml('<span class="marked">Text</span>');

    expect(() => EditorUtils.markupGeneration.noteMarkup(xmlDoc, 'AB', '', 'these_comment', 'de')).toThrow('Comment content is required');
    expect(() => EditorUtils.markupGeneration.noteMarkup(xmlDoc, '', 'Comment', 'these_comment', 'de')).toThrow(
      'Comment responsibility is required',
    );
    expect(() => EditorUtils.markupGeneration.noteMarkup(xmlDoc, 'AB', 'Comment', 'unsupported', 'de')).toThrow('Unsupported comment type');
    expect(() => EditorUtils.markupGeneration.noteMarkup(xmlDoc, 'AB', 'Comment', 'these_comment', 'xx')).toThrow(
      'Unsupported comment language',
    );
  });

  it('deletes a comment by its XML ID', () => {
    const xmlDoc = parseXml('<note xml:id="note_delete" type="these_comment" xml:lang="de" resp="AB">Delete me</note>');

    EditorUtils.markupGeneration.deleteNoteMarkup(xmlDoc, 'note_delete');

    expect(xmlDoc.querySelector('note')).toBeNull();
  });
});
