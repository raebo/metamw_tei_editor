import { initApi } from '@src/services/apiRequest.service';
import { removeTmpIds, replaceDataKeys, replaceWithCamelCase } from '../auto_anno/domHandling';
import { EntityType } from '@src/constants/editor';
import { MiscUtils } from '../misc';
import { type RismEntry, SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { ProtagCreation, ProtagCreationCategory } from '@src/services/mappings/editorMappings';

export const backendService = {
  searchRismEntries: async (searchValue: string): Promise<RismEntry[]> => {
    const requestBody = {
      search_value: searchValue,
    };

    const response = await initApi().post('/jwt/misc/rism_entries/search', requestBody);

    if (!response) {
      throw new Error('No response from server for RISM entries');
    }

    const rismEntries: RismEntry[] = response.data.map((item: any) => {
      return {
        id: item.id,
        title: item.title,
        name: item.name,
        city: item.city,
        country: item.country,
        code: item.code,
      } as RismEntry;
    });

    return rismEntries;
  },
  searchSenderReceiverLetters: async (
    searchValue: string | null,
    senderType: 'RECEIVER' | 'WRITER',
  ): Promise<SnippetEntity[]> => {
    const requestBody = {
      sender_type: senderType,
      ...(searchValue !== null && { search_value: searchValue }),
    };

    try {
      const response = await initApi().post(`/jwt/misc/letters/search`, requestBody);

      if (!response) {
        throw new Error('No response from server for letters');
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

  fetchAuthorSenderLetters: async (
    author: SnippetEntity,
    senderType: 'RECEIVER' | 'WRITER',
    searchValue: string | null,
  ): Promise<SnippetEntity[]> => {
    const requestBody = {
      sender_type: senderType,
      entity_key: author.entityKey,
      ...(searchValue !== null && { search_value: searchValue }),
    };

    try {
      const response = await initApi().post(`/jwt/misc/letters/author_receivers/`, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response) {
        throw new Error('No response from server for author letters');
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
  fetchLetterAuthorsSenders: async (searchValue: string | null, senderType: 'RECEIVER' | 'WRITER'): Promise<SnippetEntity[]> => {
    const requestBody = {
      sender_type: senderType,
      ...(searchValue !== null && { search_value: searchValue }),
    };

    try {
      const response = await initApi().post(`/jwt/misc/letters/author_senders`, requestBody);

      if (!response) {
        throw new Error('No response from server for letter authors');
      }

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
  fetchCategoriesForProtagCreation: async (protagCreationId: number): Promise<ProtagCreationCategory[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/categories_for_protag_creation/${protagCreationId}`);

      if (!response) {
        throw new Error('No response from server for protag creation categories');
      }

      return response.data.map((protag: { id: number; name: string; name_en: string; protag_creation_category_id: number }) => {
        return {
          id: protag.id,
          name: protag.name,
          name_en: protag.name_en,
          protagCreationCategoryId: protag.protag_creation_category_id,
        } as ProtagCreationCategory;
      });
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchCategoriesForProtagCreation: ${error.message}`);
      }
    }
  },
  fetchLetterAuthors: async (letterName: string): Promise<SnippetEntity[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/letters/${letterName}/authors`);

      if (!response) {
        throw new Error('No response from server for letter authors');
      }

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

  fetchProtagCreationEntries: async (protagCreationCategory: ProtagCreationCategory | null): Promise<ProtagCreation[]> => {
    try {
      const url =
        protagCreationCategory !== null
          ? `/jwt/misc/protag_creations_for_category/${protagCreationCategory.id}`
          : `/jwt/misc/protag_creations`;

      const response = await initApi().get(url, {});

      if (!response) {
        throw new Error('No response from server for protag creation entries');
      }

      return response.data.map(
        (protag: { id: number; key: string; name: string; protag_creation_category_id: number; mwv: string | null; op: string | null }) => {
          return {
            id: protag.id,
            key: protag.key,
            name: protag.name,
            protagCreationCategoryId: protag.protag_creation_category_id,
            mwv: protag.mwv || null,
            opus: protag.op || null,
          } as ProtagCreation;
        },
      );
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchProtagCreationEntries: ${error.message}`);
      }
    }
  },
  fetchProtagCreationCategories: async (categoryId: number | null): Promise<ProtagCreationCategory[]> => {
    try {
      const response = await initApi().get(`/jwt/misc/protag_creation_categories`, {
        params: {
          categoryId: categoryId,
        },
      });

      if (!response) {
        throw new Error('No response from server for protag creation categories');
      }

      return response.data.map((protag: { id: number; name: string; name_en: string; protag_creation_category_id: number }) => {
        return {
          id: protag.id,
          name: protag.name,
          name_en: protag.name_en,
          protagCreationCategoryId: protag.protag_creation_category_id,
        } as ProtagCreationCategory;
      });
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
        throw new Error('No response from server for creation kinds');
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
        throw new Error('No response from server for author categories');
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
        throw new Error('No response from server for author creations');
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
  fetchCountryEntries: async (): Promise<{ name: string; id: number }[]> => {
    try {
      const response = await initApi().get('/jwt/misc/countries');

      if (!response) {
        throw new Error('No response from server for country entries');
      }

      return response.data;
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
        throw new Error('No response from server for place kind entries');
      }

      return response.data;
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchKindEntries: ${error.message}`);
      }
    }
  },
  createEntity: async (entityData: any, entityType: string): Promise<{ newId: number }> => {
    try {
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      const response = await initApi().post(`/jwt/editor/entities?entity_type=${entityType}`, {
        entityData: {
          ...entityData,
        },
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
      throw new Error('No letter id provided');
    }

    try {
      await initApi().patch(`/jwt/editor/pinned_letters/${letterId}/set_content/`, {
        changes: {
          new_content: MiscUtils.misc.pipeFunctions(content, replaceWithCamelCase, replaceDataKeys, removeTmpIds),
          xml_id: xmlId,
          change_type: changeType,
        },
      });
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error(err);
      }
    }
    return true;
  },
  resetLetter: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().delete(`/jwt/editor/pinned_letters/${letterId}/reset_letter/`);

      return true;
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error('Error resetting letter content: ' + response.data.error);
      } else {
        throw new Error('Error resetting letter content: ' + err);
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
        throw new Error('Error publishing letter content: ' + err);
      }
    }
  },
  undoLetterChange: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().post(`/jwt/editor/letters/${letterId}/letter_changes/undo/`);

      return true;
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Error undoing letter change: ' + err);
      }
    }
  },
  redoLetterChange: async (letterId: number): Promise<boolean> => {
    try {
      await initApi().post(`/jwt/editor/letters/${letterId}/letter_changes/redo/`);

      return true;
    } catch (err: any) {
      const response = err.response;

      if (response !== undefined) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Error redoing letter change: ' + err);
      }
    }
  },
};
