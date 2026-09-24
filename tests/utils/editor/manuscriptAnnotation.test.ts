import { EditorConstants } from '@src/constants/editor';
import {
  deleteManuscriptAnnotation,
  insertManuscriptAnnotation,
  manuscriptAnnotationReference,
  readManuscriptAnnotation,
  resolveManuscriptAnnotation,
  updateManuscriptAnnotation,
} from '@src/utils/editor/manuscriptAnnotation';

const parseXml = (content: string): XMLDocument => new DOMParser().parseFromString(content, 'application/xml');

const tei = (content: string): XMLDocument => parseXml(`<TEI xmlns="${EditorConstants.TEI_NS}">${content}</TEI>`);

describe('manuscript annotations', () => {
  it('creates the complete missing header path before the existing text', () => {
    const xmlDoc = tei('<text><body><p>Letter</p></body></text>');

    const annotation = insertManuscriptAnnotation(xmlDoc, 'Paper and ink');

    expect(xmlDoc.documentElement.firstElementChild?.localName).toBe('teiHeader');
    expect(xmlDoc.querySelector('teiHeader > fileDesc > sourceDesc > msDesc > physDesc > scriptDesc > p')).toBe(annotation);
    expect(annotation.getAttribute('xml:id')).toMatch(/^script_annotation_/);
    expect(annotation.textContent).toBe('Paper and ink');
  });

  it('extends a partial header without replacing existing physical-description content', () => {
    const xmlDoc = tei(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><objectDesc><p>Existing description</p></objectDesc></physDesc></msDesc></sourceDesc></fileDesc></teiHeader><text/>',
    );

    insertManuscriptAnnotation(xmlDoc, 'First annotation');

    expect(xmlDoc.querySelector('objectDesc > p')?.textContent).toBe('Existing description');
    expect(xmlDoc.querySelector('scriptDesc > p')?.textContent).toBe('First annotation');
  });

  it('keeps multiple annotations independently addressable', () => {
    const xmlDoc = tei(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><scriptDesc/></physDesc></msDesc></sourceDesc></fileDesc></teiHeader>',
    );

    const first = insertManuscriptAnnotation(xmlDoc, 'First');
    const second = insertManuscriptAnnotation(xmlDoc, 'Second');

    expect(xmlDoc.querySelectorAll('scriptDesc > p')).toHaveLength(2);
    expect(resolveManuscriptAnnotation(xmlDoc, first.getAttribute('xml:id')!)).toBe(first);
    expect(resolveManuscriptAnnotation(xmlDoc, second.getAttribute('xml:id')!)).toBe(second);
  });

  it('loads, updates and deletes a legacy annotation addressed by its source path', () => {
    const xmlDoc = tei(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><scriptDesc><p>Legacy</p></scriptDesc></physDesc></msDesc></sourceDesc></fileDesc></teiHeader>',
    );
    const legacy = xmlDoc.querySelector('scriptDesc > p')!;
    const reference = manuscriptAnnotationReference(legacy, '0.0.0.0.0.0.0');

    expect(reference).toBe('path:0.0.0.0.0.0.0');
    const resolved = resolveManuscriptAnnotation(xmlDoc, reference);
    expect(readManuscriptAnnotation(resolved)).toBe('Legacy');
    updateManuscriptAnnotation(resolved, 'Updated');
    expect(resolved.getAttribute('xml:id')).toMatch(/^script_annotation_/);
    expect(resolved.textContent).toBe('Updated');

    deleteManuscriptAnnotation(resolved);
    expect(xmlDoc.querySelectorAll('scriptDesc > p')).toHaveLength(0);
    expect(xmlDoc.querySelector('scriptDesc')).toBeNull();
  });

  it('keeps the script description while another annotation remains', () => {
    const xmlDoc = tei(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><scriptDesc><p xml:id="script_annotation_1">One</p><p xml:id="script_annotation_2">Two</p></scriptDesc></physDesc></msDesc></sourceDesc></fileDesc></teiHeader>',
    );
    const first = resolveManuscriptAnnotation(xmlDoc, 'script_annotation_1');

    deleteManuscriptAnnotation(first);

    expect(xmlDoc.querySelector('scriptDesc')).not.toBeNull();
    expect(xmlDoc.querySelectorAll('scriptDesc > p')).toHaveLength(1);
    expect(xmlDoc.querySelector('scriptDesc > p')?.textContent).toBe('Two');
  });

  it('stores markup-looking input only as text', () => {
    const xmlDoc = tei('<text/>');

    const annotation = insertManuscriptAnnotation(xmlDoc, '<img src=x onerror=alert(1)><script>alert(1)</script>');

    expect(annotation.children).toHaveLength(0);
    expect(annotation.textContent).toBe('<img src=x onerror=alert(1)><script>alert(1)</script>');
  });

  it('rejects empty and control-character content', () => {
    const xmlDoc = tei('<text/>');

    expect(() => insertManuscriptAnnotation(xmlDoc, '   ')).toThrow('content is required');
    expect(() => insertManuscriptAnnotation(xmlDoc, 'bad\u0001content')).toThrow('invalid control characters');
  });
});
