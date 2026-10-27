import { EditorLetterData, mapApiToEditorLetterData, mapApiToPinnedLetter, PinnedLetter } from '../mappings/editorMappings';
import initApi from '../apiRequest.service';
import axios from 'axios';

export const fetchPinnedLetters = async (): Promise<PinnedLetter[]> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters`);

    return response.data.map((result: unknown) => {
      return mapApiToPinnedLetter(result);
    });
  } catch (err) {
    throw new Error('Failed to fetch pinned letters: ' + err);
  }
};

export const setLetterPinStatus = async (pinnedLetter: PinnedLetter, isPinned: boolean): Promise<boolean> => {
  const response = await initApi.initApi().patch(`/jwt/editor/pinned_letters/${pinnedLetter.id}/pinned`, { isPinned: isPinned });

  if (response.status === 200) {
    return true;
  } else {
    throw new Error('Failed to set pin status to "' + isPinned + '" : ' + response.data.error);
  }
};

export const fetchPinnedLetterData = async (letterId: number): Promise<EditorLetterData> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters/${letterId}`);

    return mapApiToEditorLetterData(response.data);
  } catch (err) {
    throw new Error('Failed to fetchPinnedLetterData: ' + err);
  }
};

export const refetchPinnedLetterAfterLifecycle = async (letterId: number): Promise<EditorLetterData | null> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters/${letterId}`);

    return mapApiToEditorLetterData(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
};
