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
  xml_content: string
}

export interface AutoAnnoSnippet {
  id: number
  xml_id: string
  status: string
  reference_key_orig: string
  reference_type_orig: string
  reference_key_final: string
  reference_type_final: string
  reference_name_orig: string
  reference_name_final: string
}



export const fetchAutoAnnoListData = async (): Promise<AutoAnnoType[] | undefined> => {
  try {
  const response = await initApi.initApi().get('/jwt/automatic_annotations')

  return response.data;
  } catch (err) {
    console.error(err);
  }
};

export const fetchAutoAnnoJobLetters = async (id: string): Promise<AutoAnnoJobLetter[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotations/${id}/letters`);

    return response.data;
  } catch (err) {
    console.error(err);
  }
}

export const fetchAutoAnnoLetter = async (id: string | undefined): Promise<AutoAnnoJobLetter | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}`);

    console.log(response.data)
    return response.data;
  } catch (err) {
    console.error(err);
  }
}


export const fetchAutoAnnoLetterSnippets = async (id: number | undefined): Promise<AutoAnnoSnippet[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/automatic_annotation_letters/${id}/snippets`);

    console.log(response.data)
    return response.data;
  } catch (err) {
    console.error(err);
  }
}
