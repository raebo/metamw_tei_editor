import initApi from '../apiRequest.service';
import { SnippetEntity } from '../mappings/autoAnnoMappings';
import { EditorConstants } from '@src/constants/editor';

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
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}/exists`);

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
    const response = await initApi.initApi().get(`/jwt/editor/entities/fetch_entity_key?entity_type=${entityType.toLowerCase()}`);

    return response?.data?.entity_key;
  } catch {
    throw new Error(`Could not fetch new entity key for: ${entityType}`);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const optionalString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const mapEditorEntity = (value: unknown, entityType: string): SnippetEntity | null => {
  if (!isRecord(value)) return null;

  const entityId = typeof value.entityId === 'number' ? value.entityId : value.id;
  if (typeof entityId !== 'number' || typeof value.entityKey !== 'string' || typeof value.entityName !== 'string') {
    return null;
  }

  return {
    entityId,
    entityType: optionalString(value.entityType) ?? entityType,
    entityKey: value.entityKey,
    entityName: value.entityName,
    entityFirstName: optionalString(value.entityFirstName),
    entityLastName: optionalString(value.entityLastName),
    entityDisplayName: optionalString(value.entityDisplayName) ?? value.entityName,
    entitySettlementKind: optionalString(value.entitySettlementKind),
    entityParentName: optionalString(value.entityParentName),
    entityPlaceCountryName: optionalString(value.entityPlaceCountryName),
    entityKind: optionalString(value.entityKind),
    extraData: isRecord(value.extraData) ? value.extraData : {},
  };
};

export const searchEditortEntities = async (searchString: string | null, entityType: string): Promise<SnippetEntity[] | undefined> => {
  const entityKey = EditorConstants.ENTITY_TYPES[entityType as keyof typeof EditorConstants.ENTITY_TYPES];
  if (!entityKey) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

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

    const entries: unknown = response?.data?.[entityKey.toLowerCase()]?.entries;
    if (!Array.isArray(entries)) return undefined;

    return entries.map((entry) => mapEditorEntity(entry, entityType)).filter((entry): entry is SnippetEntity => entry !== null);
  } catch (err) {
    throw new Error('Error fetching data for search entity: ' + err);
  }
};
