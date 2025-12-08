import { EditorUtils } from './index';
import {
  CountryOption,
  type HiRendType,
  MarkupPlaceData,
} from '@src/services/mappings/editorMappings';
import { EditorConstants, EntityType } from '@src/constants/editor';
import { SelectCompleteOption } from '@src/schemas';

export const placeDataService = {
  fetchCountries: async (): Promise<CountryOption[]> => {
    const countries = await EditorUtils.backendService.fetchCountryEntries();
    if (countries) {
      return countries.map((country) => ({
        name: country.name,
        id: country.id,
      }));
    } else {
      throw new Error('No countries found');
    }
  },
  fetchKindEntries: async (): Promise<SelectCompleteOption[]> => {
    const kindEntries = await EditorUtils.backendService.fetchKindEntries();
    if (kindEntries) {
      return kindEntries.map((kindName) => ({
        label: kindName,
        value: kindName,
      }));
    } else {
      throw new Error('No kinds found');
    }
  },
  handlePlaceDataEntries: async (
    xmlDoc: Document,
    markupPlaceData: MarkupPlaceData[],
    rendType: HiRendType,
  ): Promise<string> => {
    const newEntries = markupPlaceData.filter((placeData) => placeData.isNewEntry);

    for (const placeData of newEntries) {
      await EditorUtils.backendService.createEntity(placeData, placeData.placeType);
    }

    const markedSpan = xmlDoc.querySelectorAll('span.marked')[0];
    if (markedSpan === undefined) throw new Error('No marked span found');

    const xmlId = EditorUtils.markupGeneration.generateXmlId('placeName');
    const placeNameNode = document.createElementNS(EditorConstants.TEI_NS, 'placeName');
    placeNameNode.setAttribute('xml:id', xmlId);

    for (const placeData of markupPlaceData) {
      switch (placeData.placeType) {
        case EntityType.SIGHT:
          EditorUtils.markupGeneration.addSightMarkup(placeNameNode, placeData);
          break;
        case EntityType.SETTLEMENT:
          EditorUtils.markupGeneration.addSettlementMarkup(placeNameNode, placeData);
          break;
        case EntityType.INSTITUTION:
          EditorUtils.markupGeneration.addInstitutionMarkup(placeNameNode, placeData);
          break;
        default:
          throw new Error('Invalid place type: ' + placeData.placeType);
      }
    }

    if (rendType) {
      const hiNode = document.createElementNS(EditorConstants.TEI_NS, 'hi');
      hiNode.setAttribute('rend', rendType);
      hiNode.appendChild(placeNameNode);

      EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, hiNode);
    } else {
      EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, placeNameNode);
    }

    return xmlId;
  },
};
