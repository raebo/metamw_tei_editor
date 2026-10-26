import initApi from '@src/services/apiRequest.service';
import { mapRemotePersonToEntity, PersonEntity } from '@src/services/mappings/editorMappings';

const responseStatus = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

export const fetchMetamwEntityData = async (entityKey: string | null): Promise<{ [key: string]: string } | null> => {
  if (!entityKey) {
    throw new Error('Entity key is required to fetch letter data');
  }
  const response = await initApi.initApi().get(`/jwt/misc/entities/${entityKey}`);

  return response.data;
};

export const fetchMetamwLetterData = async (letterKey: string | null): Promise<{ [key: string]: string } | null> => {
  if (!letterKey) {
    throw new Error('Letter key is required to fetch letter data');
  }

  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/by_name/${letterKey}`);

    return response.data;
  } catch (error) {
    if (responseStatus(error) === 404) return null;
    throw error;
  }
};

export const fetchAndMapPersonEntityData = async (entityKey: string): Promise<PersonEntity> => {
  const data = await fetchMetamwEntityData(entityKey);

  return mapRemotePersonToEntity(data);
};
