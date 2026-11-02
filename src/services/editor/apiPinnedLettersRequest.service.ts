import { EditorLetterData, mapApiToEditorLetterData, mapApiToPinnedLetter, PinnedLetter } from '../mappings/editorMappings';
import initApi from '../apiRequest.service';
import axios from 'axios';
import { parsePinnedLetterStatusResponse } from '@src/schemas/pinnedLetter';
import { z } from 'zod';

export const fetchPinnedLetters = async (): Promise<PinnedLetter[]> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters`);

    return z
      .array(z.unknown())
      .parse(response.data)
      .map((result) => {
        return mapApiToPinnedLetter(result);
      });
  } catch (err) {
    throw new Error('Failed to fetch pinned letters: ' + err);
  }
};

const pinStatusMatches = async (letterId: number, pinned: boolean): Promise<boolean> => {
  try {
    const pinnedLetters = await fetchPinnedLetters();
    return pinnedLetters.some((letter) => letter.id === letterId) === pinned;
  } catch {
    return false;
  }
};

export const setLetterPinStatus = async (letterId: number, pinned: boolean): Promise<void> => {
  try {
    const response = await initApi.initApi().patch(`/jwt/editor/pinned_letters/${letterId}/pinned`, { pinned });
    const result = parsePinnedLetterStatusResponse(response.data);

    if (response.status !== 200 || result.pinned !== pinned) {
      throw new Error(`Backend did not confirm pinned=${pinned}`);
    }
  } catch (error) {
    const shouldReconcile =
      axios.isAxiosError(error) && (error.response === undefined || (error.response.status >= 500 && error.response.status < 600));

    if (shouldReconcile && (await pinStatusMatches(letterId, pinned))) return;
    throw error;
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
