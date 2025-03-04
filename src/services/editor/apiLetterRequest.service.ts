import initApi from "../apiRequest.service";
import { PinnedLetter } from "../mappings/editorMappings";

export const setLetterFavourite= async (letterId: number, isFavourite: boolean): Promise<boolean> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/search?searchValue=FOOBAR`);

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

