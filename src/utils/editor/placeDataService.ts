import {EditorUtils} from "./index";
import {CountryOption, MarkupPlaceData} from "../../services/mappings/editorMappings";
import {EditorConstants, EntityType} from "../../constants/editor";
import {SelectCompleteOption} from "../../schemas";

export const placeDataService = {
  fetchCountries: async () : Promise<CountryOption[]> => {
    const countries = await EditorUtils.backendService.fetchCountryEntries();
    if (countries) {
      return countries.map((country) => ({
        name: country.name,
        id: country.id,
      }))
    } else {
      throw new Error("No countries found");
    }
  },
  fetchKindEntries : async () : Promise<SelectCompleteOption[]> => {
    const kindEntries= await EditorUtils.backendService.fetchKindEntries();
    if (kindEntries) {
      return kindEntries.map((kindName) => ({
        label: kindName,
        value: kindName
      }));
    } else {
      throw new Error("No kinds found");
    }
  },
  handlePlaceDataEntries: async (
    letterElement: Element,
    stateEditorLetter: {id: number, name: string },
    markupPlaceData: MarkupPlaceData[]) : Promise<any> => {
    
    const newEntries  = markupPlaceData.filter((placeData) => placeData.isNewEntry);
    
    for(const placeData of newEntries) {
      await EditorUtils.backendService.createEntity(placeData, placeData.placeType)
    }
    
    const markedSpan= letterElement.querySelectorAll('span.marked')[0]
    if (markedSpan === undefined) return { xmlId: '', contentChanged: false };
    
    const xmlId = EditorUtils.markupGeneration.generateXmlId('placeName');
    const placeNameNode = document.createElement("placeName")
    placeNameNode.setAttribute("xml:id", xmlId)
    
    for (const placeData of markupPlaceData) {
      switch (placeData.placeType) {
        case EntityType.SIGHT:
          EditorUtils.markupGeneration.addSightMarkup(placeNameNode, placeData);
          break
        case EntityType.SETTLEMENT:
          EditorUtils.markupGeneration.addSettlementMarkup(placeNameNode, placeData);
          break
        case EntityType.INSTITUTION:
          EditorUtils.markupGeneration.addInstitutionMarkup(placeNameNode, placeData);
          break
        default:
          throw new Error("Invalid place type: " + placeData.placeType);
      }
    }
    
    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, placeNameNode)
    
    const result = await EditorUtils.backendService.patchContent(
      letterElement.innerHTML,
      stateEditorLetter.id,
      EditorConstants.changeTypes.place.ADDED,
      xmlId
    );
    
    if (!result) {
      throw new Error(`Patch operation failed for  a new place data entry`);
    }
  }
}
