import { initApi } from '../../services/apiRequest.service'
import { replaceDataKeys, replaceWithCamelCase } from '../auto_anno/domHandling';
import { EntityType } from '../../constants/editor';
import { MiscUtils } from '../misc';
import { SnippetEntity } from '../../services/mappings/autoAnnoMappings';
import { ProtagCreation, ProtagCreationCategory } from '../../services/mappings/editorMappings';

export const backendService = {
  fetchAuthorSenderLetters: async (author: SnippetEntity, isSender: boolean, searchValue: string | null): Promise<SnippetEntity[]> => {
    const searchParam = searchValue ? `/${encodeURIComponent(searchValue)}` : '';

    try {
      const response = await initApi().get(`/jwt/misc/author_receiver_letters/${isSender}/${author.entityKey}${searchParam}`);

      if (!response) {
        throw new Error("No response from server for author letters");
      }

      return response.data.map((item: any) => {
        return {
          entityId: item.id,
          entityKey: item.name,
          entityName: item.title,
          entityDisplayName: item.display_name,
        } as SnippetEntity;
      });
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchAuthorLetters: ${error.message}`);
      }
    }
  },
  fetchLetterAuthorsSenders: async (seachValue: string | null, isSender: boolean): Promise<SnippetEntity[]> => {
    const searchParam = seachValue ? `/${encodeURIComponent(seachValue)}` : '';

    try {
      const response = await initApi().get(`/jwt/misc/letter_authors_receivers/${isSender}${searchParam}`, {
      });

      if (!response) {
        throw new Error("No response from server for letter authors");
      }

      console.log("Response data for letter authors:", response.data);

      return response.data.map((item: any) => {
        return {
          entityId: item.id,
          entityKey: item.key,
          entityLastName: item.last_name,
          entityFirstName: item.first_name,
          entityDisplayName: item.display_name,
        } as SnippetEntity;
      });
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchLetterAuthors: ${error.message}`);
      }
    }
  },
  fetchProtagCreationEntries : async (protagCreationCategory: ProtagCreationCategory): Promise<ProtagCreation[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/protag_creations_for_category/${protagCreationCategory.id}`, {
      });

      if (!response) {
        throw new Error("No response from server for protag creation entries");
      }

      return response.data.map((protag : { id: number, key: string, name: string, protag_creation_category_id: number, mwv: string | null, op: string | null} ) => {
        return {
          id: protag.id,
          key: protag.key,
          name: protag.name,
          protagCreationCategoryId: protag.protag_creation_category_id,
          mwv: protag.mwv || null,
          opus: protag.op || null
        } as ProtagCreation
      })
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchProtagCreationEntries: ${error.message}`);
      }
    }
  },
  fetchProtagCreationCategories: async (categoryId : number | null): Promise<ProtagCreationCategory[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/protag_creation_categories`, {
        params: {
          categoryId: categoryId
        }
      });

      if (!response) {
        throw new Error("No response from server for protag creation categories");
      }

      return response.data.map((protag : { id: number, name: string, name_en: string, protag_creation_category_id: number} ) => {
        return {
          id: protag.id,
          name: protag.name,
          name_en: protag.name_en,
          protagCreationCategoryId: protag.protag_creation_category_id,
        } as ProtagCreationCategory;
      })
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchCreationKinds: ${error.message}`);
      }
    }
  },
  fetchCreationKinds: async (): Promise<string[]> => {
    try {
      const response = await initApi().get('/jwt/misc/creation_kinds');

      if (!response) {
        throw new Error("No response from server for creation kinds");
      }

      return response.data;
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchCreationKinds: ${error.message}`);
      }
    }
  },
  fetchAuthorCategories: async (authorKey: string): Promise<string[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/author/${authorKey}/categories`);

      if (!response) {
        throw new Error("No response from server for author categories");
      } else {
        return response.data;
      }
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchAuthorCategories: ${error.message}`);
      }
    }
  },
  fetchAuthorCreations: async (authorKey: string): Promise<SnippetEntity[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/author/${authorKey}/creations`);

      if (!response) {
        throw new Error("No response from server for author creations");
      }

      return response.data.map((item: any) => {
        return {
          entityId: item.id,
          entityKey: item.key,
          entityName: item.name,
          entityKind: item.kind,
        } as SnippetEntity;
      });
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchAuthorCreations: ${error.message}`);
      }
    }
  },
  fetchCountryEntries: async (): Promise<{name: string, id: number}[]> => {
    try {
      const response = await initApi().get('/jwt/misc/countries');

      if (!response) {
        throw new Error("No response from server for country entries");
      }

      return response.data
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchCountryEntries: ${error.message}`);
      }
    }
  },
  fetchKindEntries: async (): Promise<string[]> => {
    try {
      const response = await initApi().get('/jwt/misc/place_kinds');

      if (!response) {
        throw new Error("No response from server for place kind entries");
      }

      return response.data
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchKindEntries: ${error.message}`);
      }
    }
  },
  createEntity: async (entityData: any, entityType: string): Promise<{newId: number }> => {
    try {
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      const response = await initApi().post(`/jwt/editor/entities?entity_type=${entityType}`, {
        entityData: {
          ...entityData
        }
      });

      return response.data;
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error(`backendService.createEntity: ${error.message}`);
      }
    }
  },
  patchContent: async (content: string, letterId: number | null, changeType: string, xmlId: string | null): Promise<boolean> => {
    if (!letterId) {
      throw new Error("No letter id provided");
    }

    try {
      await initApi()
        .patch(`/jwt/editor/pinned_letters/${letterId}/set_content/`, {
          changes: {
            new_content: MiscUtils.misc.pipeFunctions(content, replaceWithCamelCase, replaceDataKeys),
            xml_id: xmlId,
            change_type: changeType
          }
        } );
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error(err);
      }
    }
    return true
  },
  resetLetter: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().delete(`/jwt/editor/pinned_letters/${letterId}/reset_letter/`);

      return true;

    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error("Error resetting letter content: " + response.data.error);
      } else {
        throw new Error("Error resetting letter content: " + err);
      }
    }
  },
  publishLetter: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().post(`/jwt/editor/pinned_letters/${letterId}/publish/`);

      return true;
    } catch (err: any) {

      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error("Error publishing letter content: " + err);
      }
    }
  }
}
