import {
  EditorLetterData,
  mapApiToEditorLetterData,
  mapApiToPinnedLetter,
  PinnedLetter
} from "../mappings/editorMappings";
import initApi from "../apiRequest.service";

export const fetchPinnedLetters = async (): Promise<PinnedLetter[]> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters`);

    const result = response.data.map((result: any) => { return mapApiToPinnedLetter(result) });

    if (result) {
      return result
    } else {
      return []
    }
  } catch (err) {
    return []
  }
}

export const setLetterPinStatus = async (pinnedLetter: PinnedLetter, isPinned: boolean): Promise<boolean> => {
  const response = await initApi.initApi().patch(`/jwt/editor/pinned_letters/${pinnedLetter.id}/pinned`, { isPinned: isPinned });

  if (response.status === 200) {
    return true
  } else {
    throw new Error("Failed to set pin status: " + response.data.error)
  }
}

export const fetchPinnedLetterData = async (letterId: number): Promise<EditorLetterData | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters/${letterId}`);

    return mapApiToEditorLetterData(response.data);

  } catch (err) {
    console.error(err);
  }
}


