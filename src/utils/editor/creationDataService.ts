import { type HiRendType, MarkupCreationData } from '@src/services/mappings/editorMappings';
import { EditorUtils } from './index';
import { EditorConstants, EntityType } from '@src/constants/editor';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { initApi } from '@src/services/apiRequest.service';
import { xml } from 'vkbeautify';

interface EnrichedCreation {
  creation: { key: string; name: string; kind: string; isNewEntry: boolean };
  authors: SnippetEntity[];
}

async function loadEnrichedCreations(
  markupCreations: MarkupCreationData[],
): Promise<EnrichedCreation[]> {
  return Promise.all(
    markupCreations.map(async (markupCreation) => {
      const creation = markupCreation.creation;

      if (!creation) {
        throw new Error('Creation data is missing in markupCreation');
      }
      const authors = await EditorUtils.creationDataService.fetchCreationAuthors(creation.key);
      return { creation: creation, authors: authors };
    }),
  );
}

export const creationDataService = {
  fetchCreationAuthors: async (creationKey: string): Promise<SnippetEntity[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/creation/${creationKey}/authors`);

      if (!response) {
        throw new Error('No response from server for author creations');
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
    xmlDoc: Document,
    markupCreationData: MarkupCreationData[],
    rendType: HiRendType,
  ): Promise<string> => {
    const newAuthors = markupCreationData.filter((creationData) => creationData.author?.isNewEntry);
    const newCreations = markupCreationData.filter(
      (creationData) => creationData.creation?.isNewEntry,
    );

    for (const authorData of newAuthors) {
      await EditorUtils.backendService.createEntity(
        {
          key: authorData.author?.key,
          first_name: authorData.author?.firstName,
          last_name: authorData.author?.lastName,
        },
        EntityType.PERSON,
      );
    }

    for (const creationData of newCreations) {
      await EditorUtils.backendService.createEntity(
        {
          author: { key: creationData.author?.key },
          key: creationData.creation?.key,
          name: creationData.creation?.name,
          kind: creationData.creation?.kind,
        },
        EntityType.CREATION,
      );
    }

    const enrichedCreations = await loadEnrichedCreations(markupCreationData); // All ASYNC operations should take place before DOM manipulation!!!!!

    const markedSpan = xmlDoc.querySelector('span.marked');
    if (!markedSpan) throw new Error('No marked span found in the document');

    const xmlId = EditorUtils.markupGeneration.generateXmlId('title');
    const titleNameNode = document.createElementNS(EditorConstants.TEI_NS, 'title');
    titleNameNode.setAttribute('xml:id', xmlId);

    for (const { creation, authors } of enrichedCreations) {
      EditorUtils.markupGeneration.addAuthorMarkup(titleNameNode, authors);

      const creationNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
      creationNode.setAttribute('key', creation.key);
      creationNode.setAttribute('style', 'hidden');
      creationNode.textContent = creation.name;

      titleNameNode.appendChild(creationNode);
    }

    if (rendType) {
      const hiNode = document.createElementNS(EditorConstants.TEI_NS, 'hi');
      hiNode.setAttribute('rend', rendType);
      hiNode.appendChild(titleNameNode);

      EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, hiNode);
    } else {
      EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, titleNameNode);
    }

    return xmlId;
  },
};
