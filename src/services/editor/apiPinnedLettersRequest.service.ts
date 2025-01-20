import { mapApiToPinnedLetter, PinnedLetter } from "../mappings/editorMappings";
import initApi from "../apiRequest.service";

export const fetchPinnedLetters = async (): Promise<PinnedLetter[]> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/pinned_letters`);

    const result = response.data.map((result: string[]) => { return mapApiToPinnedLetter(result) });

    if (result) {
      return result
    } else {
      return []
    }
  } catch (err) {
    return []
  }
}
