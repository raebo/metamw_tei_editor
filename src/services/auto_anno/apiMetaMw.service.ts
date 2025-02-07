import initApi from "../apiRequest.service";

export const fetchMetamwEntityData = async (entityKey: string): Promise<{ [key:string]:string}|null> => {
  const response = await initApi
    .initApi()
    .get(
      `/jwt/misc/entities/${entityKey}`
    );

  return response.data
}
