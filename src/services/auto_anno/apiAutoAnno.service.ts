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
} from '@src/schemas/autoAnno';
import axios from 'axios';
import { assertWellFormedXml } from '@src/utils/xml/backendXml';
import { entitySearchCategory, parseEntitySearchResponse } from '@src/schemas/entitySearch';

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
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/set_locking_user`, autoAnnoLockingRequest(userId));

    return true;
  } catch (err) {
    throw new Error('patchAutoAnnoLetterLockingUser failed with error: ' + err);
  }
};

export const fetchAutoAnnoLetterSnippets = async (id: number | undefined): Promise<AutoAnnoSnippet[]> => {
  const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}/snippets`);

  return AutoAnnoSnippetSchema.array().parse(response.data).map(mapAutoAnnoSnippet);
};

export const searchAutoAnnoSnippetEntities = async (
  annoLetterId: number,
  searchString: string,
  entityType: string,
): Promise<SnippetEntity[] | undefined> => {
  try {
    const entityKey = entitySearchCategory(entityType);

    const response = await initApi
      .initApi()
      .get(
        `/jwt/automatic_annotation_letters/${annoLetterId}/snippets/search_entity/${encodeURIComponent(searchString)}/${entityKey}?per_page=20`,
      );

    return parseEntitySearchResponse(response.data, entityType);
  } catch (err) {
    throw new Error('Error fetching data for search entity: ' + err);
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
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/set_status`, {
      status,
    });

    return true;
  } catch (err) {
    throw new Error('Error updating snippet status: ' + err);
  }
};

export const updateAnnoLetterContent = async (id: number, xmlContent: string): Promise<boolean> => {
  try {
    assertWellFormedXml(xmlContent);
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/set_xml_content`, { xmlContent });
  } catch (err) {
    throw new Error('Error updating anno letter content: ' + (err instanceof Error ? err.message : String(err)));
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
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${annoLetterId}/snippets/${snippetId}/set_entity`, {
      entityType,
      entityKey,
    });
  } catch (err) {
    throw new Error('Error updating snippet entity: ' + (err instanceof Error ? err.message : String(err)));
  }

  return true;
};

export const writeAnnoLetter = async (id: number): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/write_letter_to_file`);

    return true;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(`Error writing anno letter: ${err.response?.data?.status || err.message}`);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

export const resetAnnoLetter = async (id: number): Promise<boolean> => {
  try {
    await initApi.initApi().patch(`/jwt/automatic_annotation_letters/${id}/reset_letter`);

    return true;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // Handle Axios-specific error
      throw new Error(`Error resetting anno letter: ${err.response?.data?.status || err.message}`);
    } else {
      // Handle unknown errors
      throw new Error('An unknown error occurred');
    }
  }
};
