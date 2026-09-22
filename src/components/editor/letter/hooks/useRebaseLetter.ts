import { useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@src/redux/hooks';
import {
  setEditorPinnedLetterContentChanged,
  setReloadLetterContent,
} from '@src/redux/slices/editor.letter.slice';
import { EditorUtils } from '@src/utils/editor';
import { MiscUtils } from '@src/utils/misc';

export const useRebaseLetter = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return useCallback(
    async (letterId: number, letterName: string | null): Promise<boolean> => {
      try {
        await EditorUtils.backendService.rebaseLetter(letterId);
        dispatch(setReloadLetterContent({ reloadLetterContent: true }));
        dispatch(setEditorPinnedLetterContentChanged({ id: letterId, contentChanged: false }));
        enqueueSnackbar(t('editor:common.staleness.reloadSuccess', { name: letterName ?? '' }), {
          variant: 'success',
        });
        return true;
      } catch (error) {
        enqueueSnackbar(
          t('editor:common.staleness.reloadError', {
            reason: MiscUtils.misc.getErrorMessage(error),
          }),
          { variant: 'error' },
        );
        return false;
      }
    },
    [dispatch, t],
  );
};
