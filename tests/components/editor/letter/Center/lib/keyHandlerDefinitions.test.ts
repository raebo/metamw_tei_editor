import { contentMarkedKeyHandleDefinitions } from '@src/components/editor/letter/Center/lib/keyHandlerDefinitions';
import { EditorConstants } from '@src/constants/editor';

const paragraphShortcuts = [
  ['ctrl+shift+p', null],
  ['ctrl+shift+d', 'paragraph_hanging'],
  ['alt+shift+a', 'paragraph centered'],
  ['ctrl+alt+4', 'paragraph_right'],
  ['ctrl+alt+5', 'paragraph_without_indent'],
  ['alt+9', 'paragraph_without_indent_indented'],
] as const;

describe('paragraph shortcut definitions', () => {
  it.each(paragraphShortcuts)('maps %s to its TEI paragraph style', (shortcut, expectedStyle) => {
    const xmlDoc = new DOMParser().parseFromString(
      '<TEI><text><body><div><p>Before <span class="marked">Selected</span> after</p></div></body></text></TEI>',
      'application/xml',
    );
    const definition = contentMarkedKeyHandleDefinitions[shortcut];

    definition.xmlAction?.(xmlDoc);

    const selectedParagraph = Array.from(xmlDoc.querySelectorAll('p')).find((paragraph) => paragraph.textContent === 'Selected');
    expect(selectedParagraph).toBeDefined();
    expect(selectedParagraph?.getAttribute('style')).toBe(expectedStyle);
    expect(definition.operationType).toBe(EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED);
  });
});
