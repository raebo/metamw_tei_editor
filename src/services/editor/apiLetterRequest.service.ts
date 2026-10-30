import initApi from '../apiRequest.service';
import { SnippetEntity } from '../mappings/autoAnnoMappings';
import { EditorConstants } from '@src/constants/editor';
import { entitySearchCategory, parseEntitySearchResponse } from '@src/schemas/entitySearch';

export const setLetterFavourite = async (letterId: number, isFavourite: boolean): Promise<boolean> => {
  try {
    await initApi.initApi().get(`/jwt/editor/letters/search?searchValue=FOOOBAR&letterId=${letterId}&isFavourite=${isFavourite}`);

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const letterExists = async (letterId: string): Promise<boolean> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${encodeURIComponent(letterId)}/exists`);

    return response.data;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const letterContent = async (letterId: number): Promise<string> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}/xml_content`);

    return response.data;
  } catch (err) {
    console.error(err);
    return '';
  }
};

export const fetchEntityKey = async (entityType: string): Promise<string> => {
  const entityKey = EditorConstants.ENTITY_TYPES[entityType as keyof typeof EditorConstants.ENTITY_TYPES];
  if (!entityKey) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  try {
    const response = await initApi.initApi().get('/jwt/editor/entities/fetch_entity_key', {
      params: { entity_type: entityType.toLowerCase() },
    });

    return response?.data?.entity_key;
  } catch {
    throw new Error(`Could not fetch new entity key for: ${entityType}`);
  }
};

export const searchEditortEntities = async (searchString: string | null, entityType: string): Promise<SnippetEntity[] | undefined> => {
  entitySearchCategory(entityType);

  try {
    type SearchKeys = 'entity_type' | 'search_value';
    let search_data: Partial<Record<SearchKeys, string>> = {
      entity_type: entityType,
    };

    if (searchString !== null && searchString.trim() !== '') {
      search_data = {
        ...search_data,
        search_value: searchString.trim(),
      };
    }

    const response = await initApi
      .initApi()
      .post('/jwt/editor/entities/search?per_page=20', { search_data }, { headers: { 'Content-Type': 'application/json' } });

    return parseEntitySearchResponse(response.data, entityType);
  } catch (err) {
    throw new Error('Error fetching data for search entity: ' + err);
  }
};
