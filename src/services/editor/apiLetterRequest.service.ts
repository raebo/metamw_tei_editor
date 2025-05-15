import initApi from "../apiRequest.service";
import { SnippetEntity } from '../mappings/autoAnnoMappings';
import { EditorConstants } from '../../constants/editor';

export const setLetterFavourite= async (letterId: number, isFavourite: boolean): Promise<boolean> => {
  try {
    await initApi.initApi().get(`/jwt/editor/letters/search?searchValue=FOOOBAR&letterId=${letterId}&isFavourite=${isFavourite}`);

    return true

  } catch (err) {
    console.error(err);
    return false
  }
}

export const letterExists = async (letterId: string): Promise<boolean> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}/exists`);

    return response.data;

  } catch (err) {
    console.error(err);
    return false;
  }
}

export const letterContent = async (letterId: number): Promise<string> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}/xml_content`);

    return response.data;

  } catch (err) {
    console.error(err);
    return "";
  }
}

export const fetchEntityKey = async (entityType: string): Promise<string> => {
  const entityKey = EditorConstants.ENTITY_TYPES[entityType as keyof typeof EditorConstants.ENTITY_TYPES];
  if (!entityKey) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  try {
    const response = await initApi.initApi().get(`/jwt/editor/entities/fetch_entity_key?entity_type=${entityType.toLowerCase()}`);

    return response?.data?.entity_key
  } catch (err) {
    throw new Error(`Could not fetch new entity key for: ${entityType}`);
  }
}


export const searchEditortEntities = async (searchString: string | null, entityType: string): Promise<SnippetEntity[]| undefined> => {
  const entityKey = EditorConstants.ENTITY_TYPES[entityType as keyof typeof EditorConstants.ENTITY_TYPES];
  if (!entityKey) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  let url = `/jwt/editor/entities/search/${entityType.toLowerCase()}`

  if (searchString !== null) { url += `/${searchString}` }

  try {
    const response = await initApi.initApi().get(url + `?per_page=20`)

    return response?.data?.[entityKey.toLowerCase()]?.entries || undefined;

  } catch (err) {
    throw new Error("Error fetching data for search entity: " + err);
  }
}

