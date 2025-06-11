import { initApi } from '../../services/apiRequest.service';
import { SnippetEntity } from '../../services/mappings/autoAnnoMappings';
import { MarkupProtagCreationData, ProtagCreationCategory } from '../../services/mappings/editorMappings';
import { EditorUtils } from './index';
import { EditorConstants, EntityType } from '../../constants/editor';

export const protagCreationDataService = {
  fetchProtagPersonData: async () : Promise<SnippetEntity>=> {
    try {
      const response = await initApi().get(`/jwt/misc/person/protagonist_data`);

      if (!response) {
        throw new Error("No response from server for protag person data");
      }

      const item = response.data

      if (!item || !item.id || !item.key || !item.display_name) {
        throw new Error("Invalid response structure for protag person data");
      }

      return {
        entityId: item.id,
        entityKey: item.key,
        entityDisplayName: item.display_name,
      } as SnippetEntity

    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`protagCreationDataService.fetchProtagPersonData: ${error.message}`);
      }
    }
  },
  handleProtagCreationDataEntries: async (
    letterElement: Element,
    stateEditorLetter: { id: number, name: string },
    markupProtagCreationData: MarkupProtagCreationData[],
  ): Promise<any> => {

    const protagData = await EditorUtils.protagCreationDataService.fetchProtagPersonData()

    const newEntries = markupProtagCreationData.filter((protagData) => protagData.isNewEntry);

    for (const newProtagEntry of newEntries) {
      await EditorUtils.backendService.createEntity({
        key: newProtagEntry.key,
        name: newProtagEntry.name,
        mwv: newProtagEntry.mwv ?? null,
        opus: newProtagEntry.opus ?? null,
        protag_creation_category: {
          id: newProtagEntry.protagCreationCategory.id
        },
      }, EntityType.PROTAG_CREATION);
    }

    const markedSpan= letterElement.querySelectorAll('span.marked')[0]
    if (markedSpan === undefined) return { xmlId: '', contentChanged: false };

    const xmlId = EditorUtils.markupGeneration.generateXmlId('title')
    const titleNameNode = document.createElement("title")
    titleNameNode.setAttribute("xml:id", xmlId)

    for( const protagCreationData of markupProtagCreationData) {
      const catListNode = document.createElement("list")
      const listXmlId = EditorUtils.markupGeneration.generateXmlId('title')
      catListNode.setAttribute("xml:id", listXmlId)

      const allCategories: ProtagCreationCategory[] = [
        ...(protagCreationData.parentProtagCreations ?? []),
        protagCreationData.protagCreationCategory
      ];

      allCategories.reverse().forEach((protagCreation, index) => {
        const categoryNode = document.createElement("item");
        categoryNode.setAttribute('n', (index + 1).toString());
        categoryNode.setAttribute('sortKey', protagCreation.name_en ?? protagCreation.name);
        categoryNode.setAttribute("style", "hidden")
        catListNode.appendChild(categoryNode)
      });

      titleNameNode.appendChild(catListNode);

      const nameNode = document.createElement("name")
      nameNode.setAttribute("style", "hidden")
      nameNode.setAttribute("type", "author")
      nameNode.setAttribute("key", protagData.entityKey)
      nameNode.textContent = protagData.entityDisplayName
      titleNameNode.appendChild(nameNode)

      const protagCreationNode = document.createElement("name")
      protagCreationNode.setAttribute("key", protagCreationData.key)
      protagCreationNode.setAttribute("style", "hidden")
      protagCreationNode.textContent = protagCreationData.name

      if (protagCreationData.mwv) {
        const mwvNode = document.createElement("idno")
        mwvNode.setAttribute("type", "MWV")
        mwvNode.textContent = protagCreationData.mwv
        protagCreationNode.appendChild(mwvNode)
      }

      if (protagCreationData.opus) {
        const opusNode = document.createElement("idno")
        opusNode.setAttribute("type", "op")
        opusNode.textContent = protagCreationData.opus
        protagCreationNode.appendChild(opusNode)
      }

      titleNameNode.appendChild(protagCreationNode)
    }

    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, titleNameNode)

    const result = await EditorUtils.backendService.patchContent(
      letterElement.innerHTML,
      stateEditorLetter.id,
      EditorConstants.changeTypes.protag_creation.ADDED,
      xmlId
    );

    if (!result) {
      throw new Error(`Patch operation failed for  a new place data entry`);
    }
  }
}
// <title xmlns="http://www.tei-c.org/ns/1.0" xml:id="title_bcca1b36-6051-4340-aef9-bee2d94cae57"> Magnificat
//   <list style="hidden" type="fmb_works_directory" xml:id="title_okdwvb6y-kn0s-njre-exdh-fichn60lkvci">
//     <item n="1" sortKey="musical_works" style="hidden" />
//     <item n="2" sortKey="vocal_music" style="hidden" />
//     <item n="3" sortKey="sacred_vocal_music" style="hidden" />
//     <item n="4" sortKey="large-scale_sacred_vocal_works" style="hidden" />
//   </list>
//   <name key="PSN0000001" style="hidden" type="author">Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix
//     (1809-1847)
//   </name>
//   <name key="PRC0100102" style="hidden">Magnificat für Solostimmen, gemischten Chor und Orchester, [Frühjahr 1822] bis
//     31. Mai 1822
//     <idno type="MWV">A 2</idno>
//     <idno type="op" />
//   </name>
// </title>
