import { initApi } from '../../services/apiRequest.service';
import { SnippetEntity } from '../../services/mappings/autoAnnoMappings';
import {
  MarkupProtagCreationData,
  ProtagCreationCategory,
} from '../../services/mappings/editorMappings';
import { EditorUtils } from './index';
import { EditorConstants, EntityType } from '../../constants/editor';

export const protagCreationDataService = {
  fetchProtagPersonData: async (): Promise<SnippetEntity> => {
    try {
      const response = await initApi().get(`/jwt/misc/person/protagonist_data`);

      if (!response) {
        throw new Error('No response from server for protag person data');
      }

      const item = response.data;

      if (!item || !item.id || !item.key || !item.display_name) {
        throw new Error('Invalid response structure for protag person data');
      }

      return {
        entityId: item.id,
        entityKey: item.key,
        entityDisplayName: item.display_name,
      } as SnippetEntity;
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
    stateEditorLetter: { id: number; name: string },
    markupProtagCreationData: MarkupProtagCreationData[],
  ): Promise<any> => {
    const protagData = await EditorUtils.protagCreationDataService.fetchProtagPersonData();

    const newEntries = markupProtagCreationData.filter((protagData) => protagData.isNewEntry);

    for (const newProtagEntry of newEntries) {
      await EditorUtils.backendService.createEntity(
        {
          key: newProtagEntry.key,
          name: newProtagEntry.name,
          mwv: newProtagEntry.mwv ?? null,
          opus: newProtagEntry.opus ?? null,
          protag_creation_category: {
            id: newProtagEntry.protagCreationCategory.id,
          },
        },
        EntityType.PROTAG_CREATION,
      );
    }

    const markedSpan = letterElement.querySelectorAll('span.marked')[0];
    if (markedSpan === undefined) return { xmlId: '', contentChanged: false };

    const xmlId = EditorUtils.markupGeneration.generateXmlId('title');
    const titleNameNode = document.createElementNS(EditorConstants.TEI_NS, 'title');
    titleNameNode.setAttribute('xml:id', xmlId);

    for (const protagCreationData of markupProtagCreationData) {
      const catListNode = document.createElementNS(EditorConstants.TEI_NS, 'list');
      const listXmlId = EditorUtils.markupGeneration.generateXmlId('title');
      catListNode.setAttribute('xml:id', listXmlId);

      const allCategories: ProtagCreationCategory[] = [
        ...(protagCreationData.parentProtagCreations ?? []),
        protagCreationData.protagCreationCategory,
      ];

      allCategories.reverse().forEach((protagCreation, index) => {
        const categoryNode = document.createElementNS(EditorConstants.TEI_NS, 'item');
        categoryNode.setAttribute('n', (index + 1).toString());
        categoryNode.setAttribute('sortKey', protagCreation.name_en ?? protagCreation.name);
        categoryNode.setAttribute('style', 'hidden');
        catListNode.appendChild(categoryNode);
      });

      titleNameNode.appendChild(catListNode);

      const nameNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
      nameNode.setAttribute('style', 'hidden');
      nameNode.setAttribute('type', 'author');
      nameNode.setAttribute('key', protagData.entityKey);
      nameNode.textContent = protagData.entityDisplayName;
      titleNameNode.appendChild(nameNode);

      const protagCreationNode = document.createElementNS(EditorConstants.TEI_NS, 'name');
      protagCreationNode.setAttribute('key', protagCreationData.key);
      protagCreationNode.setAttribute('style', 'hidden');
      protagCreationNode.textContent = protagCreationData.name;

      if (protagCreationData.mwv) {
        const mwvNode = document.createElementNS(EditorConstants.TEI_NS, 'idno');
        mwvNode.setAttribute('type', 'MWV');
        mwvNode.textContent = protagCreationData.mwv;
        protagCreationNode.appendChild(mwvNode);
      }

      if (protagCreationData.opus) {
        const opusNode = document.createElementNS(EditorConstants.TEI_NS, 'idno');
        opusNode.setAttribute('type', 'op');
        opusNode.textContent = protagCreationData.opus;
        protagCreationNode.appendChild(opusNode);
      }

      titleNameNode.appendChild(protagCreationNode);
    }

    EditorUtils.markupGeneration.replaceMarkedNode(markedSpan, titleNameNode);

    const result = await EditorUtils.backendService.patchContent(
      letterElement.innerHTML,
      stateEditorLetter.id,
      EditorConstants.changeTypes.protag_creation.ADDED,
      xmlId,
    );

    if (!result) {
      throw new Error(`Patch operation failed for  a new place data entry`);
    }
  },
};
