import initApi from './apiRequest.service';

export interface AutoAnnoType {
  id: number;
  name: string;
  status: string;
}

export interface AutoAnnoJobLetter {
  id: number;
  letter: string;
  status: string;
}

export const fetchAutoAnnoListData = async (): Promise<AutoAnnoType[] | undefined> => {
  try {
  const response = await initApi.initApi().get('/jwt/automatic_annotations')

  return response.data;
  } catch (err) {
    console.error(err);
  }
};

export const fetchAutoAnnoJobData = async (id: string): Promise<AutoAnnoJobLetter[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}