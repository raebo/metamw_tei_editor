import initApi from './apiRequest.service';

export interface AutoAnnoType {
  id: number;
  name: string;
  status: string;
}

export const fetchAutoAnnoListData = async (): Promise<AutoAnnoType[] | null> => {
  try {
  const response = await initApi.initApi().get('/jwt/automatic_annotations')

  return response.data;
  } catch (err) {
    console.error(err);
  }

  return null;
};