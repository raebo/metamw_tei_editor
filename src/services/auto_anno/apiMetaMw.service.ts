import initApi from "../apiRequest.service";
import { mapRemotePersonToEntity, PersonEntity } from '../mappings/editorMappings';

export const fetchMetamwEntityData = async (entityKey: string): Promise<{ [key:string]:string}|null> => {
  const response = await initApi
    .initApi()
    .get(
      `/jwt/misc/entities/${entityKey}`
    );

  return response.data
}

export const fetchAndMapPersonEntityData = async (entityKey: string): Promise<PersonEntity> => {
  const data = await fetchMetamwEntityData(entityKey);

  return mapRemotePersonToEntity(data)
}
