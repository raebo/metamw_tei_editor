import initApi from '../apiRequest.service'
import {
  EditorLetter,
  EditorLetterData,
  mapApiToEditorLetter,
  mapApiToEditorLetterData, mapApiToLetterData,
} from '../mappings/editorMappings';
import { NewLetterCompletionState } from '../../components/editor/letter/Dialog/Components/AddNewLetterDialog';
import { MiscUtils } from '../../utils/misc';


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

export const searchForLetterNameTitle = async (letterType: string, searchValue: string | null): Promise<EditorLetter[]| undefined> => {
  const searchUrl = searchValue === null
    ? `/jwt/editor/letters/search_for_letters/${letterType}`
    : `/jwt/editor/letters/search_for_letters/${letterType}/${searchValue}`;

  if (searchUrl === '') {
    throw new Error('No valid search parameters provided');
  }

  const response = await initApi.initApi().get(searchUrl);

  return response.data.map(mapApiToLetterData);
}

export const createNewLetter = async (letterData: NewLetterCompletionState): Promise< { newLetterId: number, newLetterName: string, responseMessage: string }> => {
  const response = await initApi.initApi().post(
    '/jwt/editor/letters', {
      letter:
        MiscUtils.misc.pickAttributes(letterData,
        ["isFmbLetter", "letterName",
         "firstHeaderContent", "sndHeaderContent",
         "prevLetterType", "prevLetter",
         "nextLetterType", "nextLetter",
         "writerEntity", "writingPlace",
         "receivingPlace", "receiverEntity",
         "transkriptionValue", "editionValue", "letterLanguage"
        ])
    })

  const newLetterId = response.data.letter_id
  const newLetterName = response.data.letter_name
  const responseMessage = response.data.message

  if (newLetterId === undefined) throw new Error("Error creating new letter: no new letter Id given" + responseMessage);
  if (newLetterName === undefined) throw new Error("Error creating new letter: no new letter Name given" + responseMessage);

  if (response.status === 200) {
    return {
      newLetterId: newLetterId,
      newLetterName: newLetterName,
      responseMessage: responseMessage
    };
  } else {
    throw new Error('Invalid response' + response.data.message);
  }
}
