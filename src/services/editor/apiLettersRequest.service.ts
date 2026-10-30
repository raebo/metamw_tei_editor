import initApi from '../apiRequest.service';
import {
  EditorLetter,
  EditorLetterData,
  mapApiToEditorLetter,
  mapApiToExactEditorLetter,
  mapApiToEditorLetterData,
  mapApiToLetterData,
} from '../mappings/editorMappings';
import { NewLetterCompletionState } from '@src/components/editor/letter/Dialog/Components/AddNewLetterDialog';
import { MiscUtils } from '@src/utils/misc';
import axios from 'axios';
import { z } from 'zod';
import {
  LetterActionReasonCode,
  LetterCapabilities,
  letterActionErrorSchema,
  letterCapabilitiesSchema,
  letterVersionSchema,
  parseLetterLifecycle,
} from '@src/schemas/editorLetterLifecycle';
import { LetterXmlContentResponseSchema } from '@src/schemas/editorSimpleResponses';

const createLetterResponseSchema = z.object({
  letter_id: z.number().int().positive(),
  letter_name: z.string(),
  message: z.string(),
  capabilities: letterCapabilitiesSchema,
  version: letterVersionSchema,
});

const renamedLetterResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  title: z.string().nullable(),
  xml_content: z.string().nullable(),
  capabilities: letterCapabilitiesSchema,
  version: letterVersionSchema,
});

export class LetterLifecycleRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly reasonCode?: LetterActionReasonCode,
  ) {
    super(message);
    this.name = 'LetterLifecycleRequestError';
  }
}

const lifecycleRequestError = (error: unknown): LetterLifecycleRequestError => {
  if (!axios.isAxiosError(error)) {
    return new LetterLifecycleRequestError('letter_operation_failed');
  }

  const parsedError = letterActionErrorSchema.safeParse(error.response?.data);
  const reasonCode = parsedError.success ? parsedError.data.error : undefined;
  return new LetterLifecycleRequestError(reasonCode ?? 'letter_operation_failed', error.response?.status, reasonCode);
};

export const fetchLastUsedLettersByUser = async (): Promise<EditorLetter[] | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/last_used_by_user`);

    return response.data.map(mapApiToEditorLetter);
  } catch (err) {
    throw new Error('Failed to fetch LastUsedLettersByUser: ' + err);
  }
};

export const fetchSearchLetters = async (searchValue: string): Promise<EditorLetter[] | undefined> => {
  try {
    const response = await initApi.initApi().get('/jwt/editor/letters/search', { params: { searchValue } });

    return response.data.map(mapApiToEditorLetter);
  } catch (err) {
    throw new Error('Failed to fetch SearchLetters: ' + err);
  }
};

export const fetchLetterXmlContent = async (letterId: number): Promise<string | null> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}/xml_content`);

    return LetterXmlContentResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error('Failed to fetch LetterXmlContent: ' + err);
  }
};

export const fetchLetterDataByName = async (letterName: string): Promise<EditorLetter | undefined> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/by_name/${encodeURIComponent(letterName)}`);

    return mapApiToExactEditorLetter(response.data);
  } catch (err) {
    throw new Error('Failed to fetch Letter Find By Name: ' + err);
  }
};

export const fetchLetterData = async (letterId: number): Promise<EditorLetterData> => {
  try {
    const response = await initApi.initApi().get(`/jwt/editor/letters/${letterId}`);

    return mapApiToEditorLetterData(response.data);
  } catch (err) {
    throw new Error('Failed to fetch letter data: ' + err);
  }
};

export const searchForLetterNameTitle = async (letterType: string, searchValue: string | null): Promise<EditorLetter[] | undefined> => {
  const searchUrl =
    searchValue === null
      ? `/jwt/editor/letters/search_for_letters/${encodeURIComponent(letterType)}`
      : `/jwt/editor/letters/search_for_letters/${encodeURIComponent(letterType)}/${encodeURIComponent(searchValue)}`;

  if (searchUrl === '') {
    throw new Error('No valid search parameters provided');
  }

  const response = await initApi.initApi().get(searchUrl);

  return response.data.map(mapApiToLetterData);
};

export const createNewLetter = async (
  letterData: NewLetterCompletionState,
): Promise<{
  newLetterId: number;
  newLetterName: string;
  responseMessage: string;
  capabilities: LetterCapabilities;
  version: string;
}> => {
  const response = await initApi.initApi().post('/jwt/editor/letters', {
    letter: MiscUtils.misc.pickAttributes(letterData, [
      'isFmbLetter',
      'letterName',
      'firstHeaderContent',
      'sndHeaderContent',
      'prevLetterType',
      'prevLetter',
      'nextLetterType',
      'nextLetter',
      'writerEntity',
      'writingPlace',
      'receivingPlace',
      'receivers',
      'transkriptionValue',
      'editionValue',
      'letterLanguage',
      'transkriptorValue',
      'editorValue',
    ]),
  });

  const parsedResponse = createLetterResponseSchema.parse(response.data);
  const lifecycle = parseLetterLifecycle(parsedResponse);

  if (response.status === 200) {
    return {
      newLetterId: parsedResponse.letter_id,
      newLetterName: parsedResponse.letter_name,
      responseMessage: parsedResponse.message,
      ...lifecycle,
    };
  } else {
    throw new Error('Invalid response' + response.data.message);
  }
};

export const renameLetter = async (
  letterId: number,
  name: string,
  version: string,
): Promise<{ id: number; name: string; capabilities: LetterCapabilities; version: string }> => {
  try {
    const response = await initApi
      .initApi()
      .patch(`/jwt/editor/letters/${letterId}`, { letter: { name } }, { headers: { 'X-Letter-Version': version } });
    const parsedResponse = renamedLetterResponseSchema.parse(response.data);

    return {
      id: parsedResponse.id,
      name: parsedResponse.name,
      ...parseLetterLifecycle(parsedResponse),
    };
  } catch (error) {
    throw lifecycleRequestError(error);
  }
};

export const discardLetter = async (letterId: number, version: string): Promise<void> => {
  try {
    const response = await initApi.initApi().delete(`/jwt/editor/letters/${letterId}`, {
      headers: { 'X-Letter-Version': version },
    });

    if (response.status !== 204) {
      throw new LetterLifecycleRequestError('letter_operation_failed', response.status);
    }
  } catch (error) {
    if (error instanceof LetterLifecycleRequestError) throw error;
    throw lifecycleRequestError(error);
  }
};
