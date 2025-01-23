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

export const setLetterPinStatus = async (pinnedLetter: PinnedLetter, isPinned: boolean): Promise<boolean> => {
  const response = await initApi.initApi().patch(`/jwt/editor/letters/${pinnedLetter.id}/pinned`, { isPinned: isPinned });

  if (response.status === 200) {
    return true
  } else {
    throw new Error("Failed to set pin status: " + response.data.error)
  }
}
