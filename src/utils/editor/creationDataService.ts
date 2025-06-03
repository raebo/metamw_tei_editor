import { MarkupCreationData } from '../../services/mappings/editorMappings';
import { EditorUtils } from './index';
import { EditorConstants, EntityType } from '../../constants/editor';
import { SnippetEntity } from '../../services/mappings/autoAnnoMappings';
import { initApi } from '../../services/apiRequest.service';

interface EnrichedCreation {
  creation: { key: string, name: string, kind: string, isNewEntry: boolean };
  authors: SnippetEntity[];
}

async function loadEnrichedCreations(
  markupCreations: MarkupCreationData[]
): Promise<EnrichedCreation[]> {
  return Promise.all(
    markupCreations.map(async (markupCreation) => {
      const creation = markupCreation.creation;

      if (!creation) {
        throw new Error("Creation data is missing in markupCreation");
      }
      const authors = await EditorUtils.creationDataService.fetchCreationAuthors(creation.key);
      return { creation: creation, authors: authors };
    })
  );
}

export const creationDataService = {
  fetchCreationAuthors: async (creationKey: string): Promise<SnippetEntity[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/creation/${creationKey}/authors`);

      if (!response) {
        throw new Error("No response from server for author creations");
      }

      return response.data.map((item: any) => {
        return {
          entityId: item.id,
          entityKey: item.key,
          entityFirstName: item.first_name,
          entityLastName: item.last_name,
          entityDisplayName: item.display_name,
        } as SnippetEntity;
      });
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchCreationAuthors: ${error.message}`);
      }
    }
  },
  handleCreationDataEntries: async (
    letterElement: Element,
    stateEditorLetter: { id: number, name: string },
    markupCreationData: MarkupCreationData[],
  ): Promise<any> => {

    const newAuthors = markupCreationData.filter((creationData) => creationData.author?.isNewEntry);
    const newCreations = markupCreationData.filter((creationData) => creationData.creation?.isNewEntry);

    for (const authorData of newAuthors) {
      await EditorUtils.backendService.createEntity({
        key: authorData.author?.key,
        first_name: authorData.author?.firstName,
        last_name: authorData.author?.lastName,
      }, EntityType.PERSON)
    }

    for (const creationData of newCreations) {
      await EditorUtils.backendService.createEntity({
        author: { key: creationData.author?.key },
        key: creationData.creation?.key,
        name: creationData.creation?.name,
        kind: creationData.creation?.kind,
      }, EntityType.CREATION)
    }

    const enrichedCreations = await loadEnrichedCreations(markupCreationData); // All ASYNC operations should take place before DOM manipulation!!!!!

    const markedSpan= letterElement.querySelectorAll('span.marked')[0]
    if (markedSpan === undefined) return { xmlId: '', contentChanged: false };

    const xmlId = EditorUtils.markupGeneration.generateXmlId('title');
    const titleNameNode = document.createElement("title")
    titleNameNode.setAttribute("xml:id", xmlId)

    for(const { creation, authors } of enrichedCreations) {
      EditorUtils.markupGeneration.addAuthorMarkup(titleNameNode, authors)

      const creationNode = document.createElement("name");
      creationNode.setAttribute("key", creation.key);
      creationNode.setAttribute("style", "hidden");
      creationNode.textContent = creation.name;

      titleNameNode.appendChild(creationNode);
    }

    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, titleNameNode)

    const result = await EditorUtils.backendService.patchContent(
      letterElement.innerHTML,
      stateEditorLetter.id,
      EditorConstants.changeTypes.creation.ADDED,
      xmlId
    );

    if (!result) {
      throw new Error(`Patch operation failed for  a new place data entry`);
    }
  }
}
