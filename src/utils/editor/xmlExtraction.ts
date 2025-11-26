import type { RismEntry } from '@src/services/mappings/autoAnnoMappings';
import { EditorConstants } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor/index';

export const xmlExtraction = {
  extractMsIdentifierNode(teiHeader: Element, numberOfEntry: number): Element {
    const msDescNode = teiHeader.querySelector('fileDesc sourceDesc msDesc');

    if (!msDescNode) {
      throw new Error('No msDesc node found');
    }

    const msIdentifiers = msDescNode.getElementsByTagNameNS(EditorConstants.TEI_NS, 'msIdentifier');
    return msIdentifiers[numberOfEntry];
  },
  extractProvenanceData(teiHeader: Element, numberOfEntry: number): string {
    const provenanceData = teiHeader.getElementsByTagNameNS(EditorConstants.TEI_NS, 'provenance')[
      numberOfEntry
    ];

    if (!provenanceData || !provenanceData.textContent) {
      throw new Error('No provenanceNode with data found');
    }

    return provenanceData.textContent?.trim();
  },
  extractMsIdentifierData(
    teiHeader: Element,
    numberOfEntry: number,
    applyState?: (data: RismEntry) => void,
  ): RismEntry {
    const selectedMsIdentifier = EditorUtils.xmlExtraction.extractMsIdentifierNode(
      teiHeader,
      numberOfEntry,
    );

    const institutionEl = selectedMsIdentifier.getElementsByTagNameNS(
      EditorConstants.TEI_NS,
      'institution',
    )[0];

    const get = (tag: string) =>
      selectedMsIdentifier
        .getElementsByTagNameNS(EditorConstants.TEI_NS, tag)[0]
        ?.textContent?.trim() ?? '';

    const rismEntry: RismEntry = {
      id: null,
      name: get('repository'),
      title: get('collection'),
      city: get('settlement'),
      country: get('country'),
      code: institutionEl?.textContent?.trim() ?? '',
      idNo: get('idno'),
    };

    if (applyState) applyState(rismEntry);

    return rismEntry;
  },
};
