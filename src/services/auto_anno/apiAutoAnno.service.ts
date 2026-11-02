import initApi from '../apiRequest.service';
import {
  AutoAnnoJobLetter,
  AutoAnnoLetter,
  AutoAnnoSnippet,
  AutoAnnoJob,
  SnippetApiEntity,
  SnippetEntity,
} from '../mappings/autoAnnoMappings';
import {
  AutoAnnoJobSchema,
  AutoAnnoJobLetterListSchema,
  AutoAnnoJobLetterSchema,
  AutoAnnoSnippetSchema,
  SnippetApiEntitySchema,
  AutoAnnoJobApi,
  AutoAnnoJobLetterListApi,
  AutoAnnoJobLetterApi,
  AutoAnnoSnippetApi,
  autoAnnoLockingRequest,
  AutoAnnoErrorSchema,
  AutoAnnoStatusErrorSchema,
  AutoAnnoStatusSchema,
  AutoAnnoUnauthorizedSchema,
} from '@src/schemas/autoAnno';
import axios from 'axios';
import { assertWellFormedXml } from '@src/utils/xml/backendXml';
import { entitySearchCategory, parseEntitySearchResponse } from '@src/schemas/entitySearch';

export class AutoAnnoRequestError extends Error {
  constructor(
    readonly operation: string,
    readonly status: number | undefined,
    readonly backendMessage: string | undefined,
  ) {
    const detail = backendMessage ?? (status === undefined ? 'Network request failed' : `HTTP ${status}`);
    super(`${operation}: ${detail}`);
    this.name = 'AutoAnnoRequestError';
  }
}

const throwAutoAnnoRequestError = (operation: string, error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (response) {
      const standardError = AutoAnnoErrorSchema.safeParse(response.data);
      const statusError = AutoAnnoStatusErrorSchema.safeParse(response.data);
      const unauthorizedError = AutoAnnoUnauthorizedSchema.safeParse(response.data);
      const backendMessage = standardError.success
        ? standardError.data.error
        : statusError.success
          ? (statusError.data.message ?? statusError.data.status)
          : unauthorizedError.success
            ? unauthorizedError.data.message
            : undefined;

      throw new AutoAnnoRequestError(operation, response.status, backendMessage);
    }

    throw new AutoAnnoRequestError(operation, undefined, error.message || undefined);
  }

  if (error instanceof Error) throw error;
  throw new AutoAnnoRequestError(operation, undefined, undefined);
};

const mapAutoAnnoJob = (job: AutoAnnoJobApi): AutoAnnoJob => ({
  id: job.id,
  name: job.service_identifier ?? '',
  status: String(job.status),
  search_string: job.search_string ?? '',
  updated_at: typeof job.updated_at === 'string' ? job.updated_at : '',
  letters_count: job.letters_count,
  snippets_count: job.snippets_count,
  letters_open: job.letters_open,
  letters_closed: job.letters_closed,
  snippets_open: job.snippets_open,
  snippets_closed: job.snippets_closed,
});

const mapAutoAnnoJobLetter = (letter: AutoAnnoJobLetterListApi): AutoAnnoJobLetter => ({
  ...letter,
  status: String(letter.status),
});

const mapAutoAnnoLetter = (letter: AutoAnnoJobLetterApi): AutoAnnoLetter => ({
  ...letter,
  status: String(letter.status),
});

const mapAutoAnnoSnippet = (snippet: AutoAnnoSnippetApi): AutoAnnoSnippet => ({
  ...snippet,
  xml_id: snippet.xml_id ?? '',
  status: String(snippet.status),
  references: snippet.references.map((reference) => ({
    ...reference,
    name: reference.name ?? '',
  })),
  reference_key_final: snippet.reference_key_final ?? '',
  reference_type_final: snippet.reference_type_final ?? '',
  reference_name_final: snippet.reference_name_final ?? '',
});

export const fetchAutoAnnoJobs = async (): Promise<AutoAnnoJob[]> => {
  const response = await initApi.initApi().get('/jwt/automatic_annotations');

  return AutoAnnoJobSchema.array().parse(response.data).map(mapAutoAnnoJob);
};

export const fetchAutoAnnoJobLetters = async (id: number): Promise<AutoAnnoJobLetter[]> => {
  const response = await initApi.initApi().get(`/jwt/automatic_annotations/${id}/letters`);

  return AutoAnnoJobLetterListSchema.array().parse(response.data).map(mapAutoAnnoJobLetter);
};

export const fetchAutoAnnoLetter = async (annoLetterId: number): Promise<AutoAnnoLetter> => {
  const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${annoLetterId}`);

  return mapAutoAnnoLetter(AutoAnnoJobLetterSchema.parse(response.data));
};

export const patchAutoAnnoLetterLockingUser = async (annoLetterId: number, userId: number | null): Promise<boolean> => {
  try {
    const response = await initApi
      .initApi()
      .patch(`/jwt/automatic_annotation_letters/${annoLetterId}/set_locking_user`, autoAnnoLockingRequest(userId));
    AutoAnnoStatusSchema.parse(response.data);

    return true;
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('patchAutoAnnoLetterLockingUser', error);
  }
};

export const fetchAutoAnnoLetterSnippets = async (id: number): Promise<AutoAnnoSnippet[]> => {
  const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}/snippets`);

  return AutoAnnoSnippetSchema.array().parse(response.data).map(mapAutoAnnoSnippet);
};

export const searchAutoAnnoSnippetEntities = async (
  annoLetterId: number,
  searchString: string,
  entityType: string,
): Promise<SnippetEntity[]> => {
  try {
    const entityKey = entitySearchCategory(entityType);

    const response = await initApi
      .initApi()
      .get(
        `/jwt/automatic_annotation_letters/${annoLetterId}/snippets/search_entity/${encodeURIComponent(searchString)}/${entityKey}?per_page=20`,
      );

    return parseEntitySearchResponse(response.data, entityType);
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('searchAutoAnnoSnippetEntities', error);
  }
};

const mapApiToSnippetEntity = (apiEntity: SnippetApiEntity): SnippetEntity => {
  const optionalLegacyString = (value: string | boolean | null): string | undefined => (typeof value === 'string' ? value : undefined);

  return {
    entityId: apiEntity.entity_id,
    entityType: apiEntity.entity_type ?? '',
    entityKey: apiEntity.entity_key ?? '',
    entityName: apiEntity.entity_name ?? '',
    entityDisplayName: apiEntity.entity_display_name ?? apiEntity.entity_name ?? '',
    entitySettlementKind: optionalLegacyString(apiEntity.entity_settlement_kind),
    entityPlaceCountryName: optionalLegacyString(apiEntity.entity_place_country_name),
    entityKind: apiEntity.entity_kind ?? undefined,
    extraData: typeof apiEntity.extra_data === 'object' && apiEntity.extra_data !== null ? apiEntity.extra_data : {},
  };
};

export const fetchAutoAnnoSnippetEntityData = async (
  annoLetterId: number,
  snippetId: number,
  entityKey: string,
  entityType: string,
): Promise<SnippetEntity> => {
  const response = await initApi
    .initApi()
    .get(
      `/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/entity_data/${encodeURIComponent(entityType.toLowerCase())}/${encodeURIComponent(entityKey)}`,
    );

  return mapApiToSnippetEntity(SnippetApiEntitySchema.parse(response.data));
};

//TODO: Why cant we move this to autoAnnoMappings.ts?
type SnippetStatus = 'REJECTED' | 'ACCEPTED' | 'UPDATED';

export const setAutoAnnoSnippetStatus = async (annoLetterId: number, snippetId: number, status: SnippetStatus): Promise<boolean> => {
  try {
    const response = await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/set_status`, {
      status,
    });
    AutoAnnoStatusSchema.parse(response.data);

    return true;
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('setAutoAnnoSnippetStatus', error);
  }
};

export const updateAnnoLetterContent = async (id: number, xmlContent: string): Promise<boolean> => {
  try {
    assertWellFormedXml(xmlContent);
    const response = await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/set_xml_content`, { xmlContent });
    AutoAnnoStatusSchema.parse(response.data);
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('updateAnnoLetterContent', error);
  }
  return true;
};

export const setAnnoSnippetEntity = async (
  annoLetterId: number,
  snippetId: number,
  entityType: string,
  entityKey: string,
): Promise<boolean> => {
  try {
    const response = await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/set_entity`, {
      entityType,
      entityKey,
    });
    AutoAnnoStatusSchema.parse(response.data);
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('setAnnoSnippetEntity', error);
  }

  return true;
};

export const writeAnnoLetter = async (id: number): Promise<boolean> => {
  try {
    const response = await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/write_letter_to_file`);
    AutoAnnoStatusSchema.parse(response.data);

    return true;
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('writeAnnoLetter', error);
  }
};

export const resetAnnoLetter = async (id: number): Promise<boolean> => {
  try {
    const response = await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/reset_letter`);
    AutoAnnoStatusSchema.parse(response.data);

    return true;
  } catch (error: unknown) {
    return throwAutoAnnoRequestError('resetAnnoLetter', error);
  }
};
