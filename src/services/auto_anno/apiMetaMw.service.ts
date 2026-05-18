import initApi from '@src/services/apiRequest.service';
import { mapRemotePersonToEntity, PersonEntity } from '@src/services/mappings/editorMappings';

export const fetchMetamwEntityData = async (
  entityKey: string | null,
): Promise<{ [key: string]: string } | null> => {
  if (!entityKey) {
    throw new Error('Entity key is required to fetch letter data');
  }
  const response = await initApi.initApi().get(`/jwt/misc/entities/${entityKey}`);

  return response.data;
};

export const fetchMetamwLetterData = async (
  letterKey: string | null,
): Promise<{ [key: string]: string } | null> => {
  if (!letterKey) {
    throw new Error('Letter key is required to fetch letter data');
  }

  const response = await initApi.initApi().get(`/jwt/editor/letters/by_name/${letterKey}`);

  return response.data;
};

export const fetchAndMapPersonEntityData = async (entityKey: string): Promise<PersonEntity> => {
  const data = await fetchMetamwEntityData(entityKey);

  return mapRemotePersonToEntity(data);
};
