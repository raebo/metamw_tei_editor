import { initApi } from '@src/services/apiRequest.service';
import { EntityType } from '@src/constants/editor';
import { type RismEntry, SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { ProtagCreation, ProtagCreationCategory } from '@src/services/mappings/editorMappings';
import { prepareEditorXmlForBackend } from '@src/utils/xml/backendXml';
import { z } from 'zod';
import {
  CountryApiSchema,
  CreationApiSchema,
  AuthorApiSchema,
  MiscLetterApiSchema,
  NullableStringListSchema,
  ProtagCreationApiSchema,
  ProtagCreationCategoryApiSchema,
  RismEntryApiSchema,
  StringListSchema,
} from '@src/schemas/miscReferenceData';
import {
  MessageResponseSchema,
  PublishLetterResponseSchema,
  SuccessMessageResponseSchema,
  UndoRedoResponseSchema,
} from '@src/schemas/editorMutationResponses';
import {
  EntityCreatedResponseSchema,
  EntityCreateErrorCode,
  EntityCreateErrorSchema,
  EntityCreateRequest,
  EntityCreateRequestSchema,
} from '@src/schemas/entityCreate';

const letterChangedSincePinnedSchema = z.object({
  error: z.literal('letter_changed_since_pinned'),
  message: z.string(),
});

const letterStalenessSchema = z.object({
  stale: z.boolean(),
  letter_updated_at: z.string().nullable(),
});

const rebaseLetterSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  xml_content: z.string(),
});

const responseErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;

  const response = (error as { response?: { data?: unknown } }).response;
  const parsed = z.object({ error: z.string() }).safeParse(response?.data);
  return parsed.success ? parsed.data.error : undefined;
};

export interface LetterStaleness {
  stale: boolean;
  letterUpdatedAt: string | null;
}

export class LetterChangedSincePinnedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LetterChangedSincePinnedError';
  }
}

export class PinnedLetterNotFoundError extends Error {
  constructor() {
    super('Pinned letter not found');
    this.name = 'PinnedLetterNotFoundError';
  }
}

export class EntityCreateRequestError extends Error {
  constructor(
    readonly code: EntityCreateErrorCode,
    readonly status?: number,
  ) {
    super(code);
    this.name = 'EntityCreateRequestError';
  }
}

export const backendService = {
  updateUserLanguage: async (langCode: 'de' | 'en') => {
    const response = await initApi().put(`/jwt/misc/user/language/${langCode}`);
    MessageResponseSchema.parse(response.data);
  },
  searchRismEntries: async (searchValue: string): Promise<RismEntry[]> => {
    const requestBody = {
      search_value: searchValue,
    };

    const response = await initApi().post('/jwt/misc/rism_entries/search', requestBody);

    if (!response) {
      throw new Error('No response from server for RISM entries');
    }

    return RismEntryApiSchema.array()
      .parse(response.data)
      .map((item) => {
        return {
          id: item.id,
          title: item.title ?? '',
          name: item.name ?? '',
          city: item.city ?? '',
          country: item.country ?? '',
          code: item.code ?? '',
          idNo: '',
        };
      });
  },
  searchSenderReceiverLetters: async (searchValue: string | null, senderType: 'RECEIVER' | 'WRITER'): Promise<SnippetEntity[]> => {
    const requestBody = {
      sender_type: senderType,
      ...(searchValue !== null && { search_value: searchValue }),
    };

    try {
      const response = await initApi().post(`/jwt/misc/letters/search`, requestBody);

      if (!response) {
        throw new Error('No response from server for letters');
      }

      return MiscLetterApiSchema.array()
        .parse(response.data)
        .map((item) => {
          return {
            entityId: item.id,
            entityKey: item.name,
            entityName: item.title ?? '',
            entityDisplayName: item.display_name,
            entityType: 'LETTER',
            extraData: {},
          };
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
      const response = await initApi().post(`/jwt/misc/letters/author_receivers`, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response) {
        throw new Error('No response from server for author letters');
      }

      return MiscLetterApiSchema.array()
        .parse(response.data)
        .map((item) => {
          return {
            entityId: item.id,
            entityKey: item.name,
            entityName: item.title ?? '',
            entityDisplayName: item.display_name,
            entityType: 'LETTER',
            extraData: {},
          };
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

      return AuthorApiSchema.array()
        .parse(response.data)
        .map((item) => {
          return {
            entityId: item.id,
            entityKey: item.key,
            entityName: item.display_name,
            entityLastName: item.last_name ?? undefined,
            entityFirstName: item.first_name ?? undefined,
            entityDisplayName: item.display_name,
            entityType: EntityType.PERSON,
            extraData: {},
          };
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
      const response = await initApi().get(`/jwt/misc/categories_for_protag_creation/${encodeURIComponent(String(protagCreationId))}`);

      if (!response) {
        throw new Error('No response from server for protag creation categories');
      }

      return ProtagCreationCategoryApiSchema.array()
        .parse(response.data)
        .map((protag) => ({
          id: protag.id,
          name: protag.name,
          name_en: protag.name_en ?? '',
          protagCreationCategoryId: protag.protag_creation_category_id,
        }));
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
      const response = await initApi().get(`/jwt/misc/letters/${encodeURIComponent(letterName)}/authors`);

      if (!response) {
        throw new Error('No response from server for letter authors');
      }

      return AuthorApiSchema.array()
        .parse(response.data)
        .map((item) => {
          return {
            entityId: item.id,
            entityKey: item.key,
            entityName: item.display_name,
            entityLastName: item.last_name ?? undefined,
            entityFirstName: item.first_name ?? undefined,
            entityDisplayName: item.display_name,
            entityType: EntityType.PERSON,
            extraData: {},
          };
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
          ? `/jwt/misc/protag_creations_for_category/${encodeURIComponent(String(protagCreationCategory.id))}`
          : `/jwt/misc/protag_creations`;

      const response = await initApi().get(url, {});

      if (!response) {
        throw new Error('No response from server for protag creation entries');
      }

      return ProtagCreationApiSchema.array()
        .parse(response.data)
        .map((protag) => ({
          id: protag.id,
          key: protag.key,
          name: protag.name,
          protagCreationCategoryId: protag.protag_creation_category_id,
          mwv: protag.mwv,
          opus: protag.op,
        }));
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
      const url =
        categoryId === null
          ? '/jwt/misc/protag_creation_categories'
          : `/jwt/misc/protag_creation_categories/${encodeURIComponent(String(categoryId))}`;
      const response = await initApi().get(url);

      if (!response) {
        throw new Error('No response from server for protag creation categories');
      }

      return ProtagCreationCategoryApiSchema.array()
        .parse(response.data)
        .map((protag) => ({
          id: protag.id,
          name: protag.name,
          name_en: protag.name_en ?? '',
          protagCreationCategoryId: protag.protag_creation_category_id,
        }));
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

      return StringListSchema.parse(response.data);
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
      const response = await initApi().get(`/jwt/misc/author/${encodeURIComponent(authorKey)}/categories`);

      if (!response) {
        throw new Error('No response from server for author categories');
      } else {
        return NullableStringListSchema.parse(response.data).filter((category): category is string => category !== null);
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
      const response = await initApi().get(`/jwt/misc/author/${encodeURIComponent(authorKey)}/creations`);

      if (!response) {
        throw new Error('No response from server for author creations');
      }

      return CreationApiSchema.array()
        .parse(response.data)
        .map((item) => {
          return {
            entityId: item.id,
            entityKey: item.key,
            entityName: item.name,
            entityDisplayName: item.name,
            entityKind: item.kind ?? undefined,
            entityType: EntityType.CREATION,
            extraData: {},
          };
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

      return CountryApiSchema.array().parse(response.data);
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

      return StringListSchema.parse(response.data);
    } catch (error: any) {
      const response = error.response;

      if (response !== undefined) {
        throw new Error(`Error response is undefined  ${response.data.error}`);
      } else {
        throw new Error(`backendService.fetchKindEntries: ${error.message}`);
      }
    }
  },
  createEntity: async (request: EntityCreateRequest): Promise<string> => {
    const requestBody = EntityCreateRequestSchema.parse(request);

    try {
      const response = await initApi().post('/jwt/editor/entities', requestBody);

      return EntityCreatedResponseSchema.parse(response.data).entity_key;
    } catch (error: unknown) {
      const response =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { status?: number; data?: unknown } }).response
          : undefined;
      const parsedError = EntityCreateErrorSchema.safeParse(response?.data);

      if (parsedError.success) {
        throw new EntityCreateRequestError(parsedError.data.error, response?.status);
      }

      if (error instanceof Error) throw error;
      throw new Error('Entity creation request failed');
    }
  },
  patchContent: async (content: string, letterId: number | null, changeType: string, xmlId: string | null): Promise<boolean> => {
    if (!letterId) {
      throw new Error('No letter id provided');
    }

    try {
      const response = await initApi().patch(`/jwt/editor/pinned_letters/${letterId}/set_content`, {
        changes: {
          new_content: prepareEditorXmlForBackend(content),
          xml_id: xmlId,
          change_type: changeType,
        },
      });
      const result = SuccessMessageResponseSchema.parse(response.data);
      if (!result.success) throw new Error(result.message);
    } catch (error: unknown) {
      const responseError = responseErrorMessage(error);
      if (responseError) throw new Error(responseError);
      if (error instanceof Error) throw error;
      throw new Error(String(error));
    }
    return true;
  },
  resetLetter: async (letterId: number): Promise<boolean> => {
    try {
      const response = await initApi().delete(`/jwt/editor/pinned_letters/${letterId}/reset_letter`);
      const result = SuccessMessageResponseSchema.parse(response.data);
      if (!result.success) throw new Error(result.message);

      return true;
    } catch (error: unknown) {
      const message = responseErrorMessage(error) ?? (error instanceof Error ? error.message : String(error));
      throw new Error('Error resetting letter content: ' + message);
    }
  },
  fetchLetterStaleness: async (letterId: number, signal?: AbortSignal): Promise<LetterStaleness> => {
    try {
      const response = await initApi().get(`/jwt/editor/pinned_letters/${letterId}/staleness`, {
        signal,
      });
      const data = letterStalenessSchema.parse(response.data);

      return {
        stale: data.stale,
        letterUpdatedAt: data.letter_updated_at,
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        throw new PinnedLetterNotFoundError();
      }
      throw error;
    }
  },
  rebaseLetter: async (letterId: number): Promise<string> => {
    try {
      const response = await initApi().post(`/jwt/editor/pinned_letters/${letterId}/rebase`);
      return rebaseLetterSchema.parse(response.data).xml_content;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: unknown } } }).response?.data?.error === 'string'
      ) {
        throw new Error((error as { response: { data: { error: string } } }).response.data.error);
      }
      throw error;
    }
  },
  publishLetter: async (letterId: number): Promise<boolean> => {
    try {
      const response = await initApi().post(`/jwt/editor/pinned_letters/${letterId}/publish`);
      PublishLetterResponseSchema.parse(response.data);

      return true;
    } catch (err: unknown) {
      const response =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number; data?: unknown } }).response
          : undefined;

      if (response !== undefined) {
        if (response.status === 409) {
          const conflict = letterChangedSincePinnedSchema.safeParse(response.data);
          if (conflict.success) {
            throw new LetterChangedSincePinnedError(conflict.data.message);
          }
        }

        const genericError = z.object({ error: z.string() }).safeParse(response.data);
        throw new Error(genericError.success ? genericError.data.error : 'Could not publish letter');
      } else {
        throw new Error('Error publishing letter content: ' + err);
      }
    }
  },
  undoLetterChange: async (letterId: number): Promise<boolean> => {
    try {
      const response = await initApi().post(`/jwt/editor/letters/${letterId}/letter_changes/undo`);
      UndoRedoResponseSchema.parse(response.data);

      return true;
    } catch (error: unknown) {
      const responseError = responseErrorMessage(error);
      if (responseError) throw new Error(responseError);
      throw new Error('Error undoing letter change: ' + (error instanceof Error ? error.message : String(error)));
    }
  },
  redoLetterChange: async (letterId: number): Promise<boolean> => {
    try {
      const response = await initApi().post(`/jwt/editor/letters/${letterId}/letter_changes/redo`);
      UndoRedoResponseSchema.parse(response.data);

      return true;
    } catch (error: unknown) {
      const responseError = responseErrorMessage(error);
      if (responseError) throw new Error(responseError);
      throw new Error('Error redoing letter change: ' + (error instanceof Error ? error.message : String(error)));
    }
  },
};
