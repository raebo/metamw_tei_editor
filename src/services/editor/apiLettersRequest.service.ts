import initApi from '../apiRequest.service'
import {
  EditorLetter,
  EditorLetterData,
  mapApiToEditorLetter,
  mapApiToEditorLetterData
} from "../mappings/editorMappings";


export const fetchLastUsedLettersByUser = async (): Promise<EditorLetter[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/last_used_by_user`);

    return response.data.map(mapApiToEditorLetter);

  } catch (err) {
    console.error(err);
  }
}

export const fetchSearchLetters = async (searchValue: string): Promise<EditorLetter[]| undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/search?searchValue=${searchValue}`);

    return response.data.map(mapApiToEditorLetter);

  } catch (err) {
    console.error(err);
  }
}

export const fetchLetterData = async (letterId: number): Promise<EditorLetterData | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}`);

    return mapApiToEditorLetterData(response.data);

  } catch (err) {
    console.error(err);
  }
}
