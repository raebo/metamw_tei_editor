import type { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { EditorUtils } from '@src/utils/editor';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import {
  fetchLetterData,
  fetchLetterDataByName,
  searchForLetterNameTitle,
} from '@src/services/editor/apiLettersRequest.service';
import { debounce } from 'lodash-es';
import { EditorLetter, type SearchLetter } from '@src/services/mappings/editorMappings';
import { Autocomplete, Checkbox, Divider, FormControlLabel, Stack, TextField } from '@mui/material';
import { EditorConstants } from '@src/constants/editor';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import Button from '@mui/material/Button';
import { DialogActionButton } from '@src/components/editor/letter/Dialog/Components/Misc/DialogActionButton';

type AddPreccSuccProps = DefaultDialogProps & {
  letterType: 'precursor' | 'successor';
};

// unknown not_identified

const ManagePreccSuccLetterDialog = (props: AddPreccSuccProps) => {
  const { t } = useTranslation();
  const td = (key: string) => t(`editor:dialog.precursorSuccessorDialog.${key}`);

  const letterName = useSelector((state: RootState) => state.editorLetter.letter.name);
  const [selectedLetter, setSelectedLetter] = useState<EditorLetter | null>(null);
  const [teiHeader, setTeiHeader] = useState<Element | null>(null);
  const [letterType, setLetterType] = useState<'unknown' | 'not_identified' | 'select' | null>(
    null,
  );
  const isPrecursor = props.letterType === 'precursor';
  const isSuccessor = props.letterType === 'successor';
  const [selectedOption, setSelectedOption] = useState<
    'unknown' | 'not_identified' | 'select' | null
  >(null);
  const [autoAvailable, setAutoAvailable] = useState<boolean>(false);
  const [letters, setLetters] = useState<EditorLetter[]>([]);

  const buttonLabel = isPrecursor ? td('button.setPredecessor') : td('button.setSuccessor');
  const autocompleteLabel = isPrecursor
    ? td('label.chooseLetterPrecursor')
    : td('label.chooseLetterSuccessor');
  const notDeterminedLabel = isPrecursor
    ? td('label.precursorNotDetermined')
    : td('label.successorNotDetermined');
  const unknownLabel = isPrecursor ? td('label.precursorUnknown') : td('label.successorUnknown');
  const successMessage = isPrecursor ? td('successPredecessor') : td('successSuccessor');

  useEffect(() => {
    if (letterName === null) throw new Error('AddPreccSuccLetterDialog Letter name is required');

    try {
      setTeiHeader(EditorUtils.teiHeaderContent.extractTeiHeader(props.xmlDoc));
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
    }
  }, [letterName, props]);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    if (letterType !== null) {
      return;
    }

    const loadLetterData = async () => {
      const { name, letterStatus } = EditorUtils.teiHeaderContent.extractPrevNextLetter(
        teiHeader,
        props.letterType,
      );

      setSelectedOption(letterStatus);

      if (letterStatus === 'select' && name !== null) {
        try {
          const letterData = await fetchLetterDataByName(name);
          if (isMounted) {
            setSelectedLetter(letterData === undefined ? null : letterData);
            setAutoAvailable(true);
          }
        } catch (err) {
          if (isMounted) {
            enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
          }
        }
      }
    };
    void loadLetterData();

    return () => {
      isMounted = false;
    };
  }, [letterType, props.letterType, teiHeader]);

  const resolveLetterPrefix = (): 'fmb' | 'gb' => {
    if (letterName === null) throw new Error('AddPreccSuccLetterDialog Letter name is required');

    const startsWithFmb = letterName.toLowerCase().startsWith('fmb');
    const startsWithGb = letterName.toLowerCase().startsWith('gb');

    if ((startsWithFmb && isPrecursor) || (startsWithGb && isSuccessor)) {
      return 'gb';
    }
    if ((startsWithGb && isPrecursor) || (startsWithFmb && isSuccessor)) {
      return 'fmb';
    }
    throw new Error('AddPreccSuccLetterDialog searchLetterPrefix unsupported condition');
  };

  const handlePrecSuccLetterCheckboxChange = (value: 'unknown' | 'not_identified' | 'select') => {
    setSelectedOption(value);
    setSelectedLetter(null);
    if (value === 'select') {
      setAutoAvailable(true);
    }
  };

  const searchForLetters = async (inputValue: string) => {
    try {
      const responseLetters = await searchForLetterNameTitle(resolveLetterPrefix(), inputValue);

      if (responseLetters) {
        setLetters(responseLetters);
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
        variant: 'error',
      });
    }
  };

  const debouncedSearchForLetters = useMemo(
    () => debounce(searchForLetters, 300), // 300ms delay
    [searchForLetters],
  );

  const handleSubmit = async () => {
    if (selectedOption === null) {
      enqueueSnackbar('Could not set letter without given an option', { variant: 'error' });
      return;
    }

    try {
      EditorUtils.markupGeneration.setPreccSuccMarkup(
        props.xmlDoc,
        props.letterType,
        selectedOption,
        selectedLetter,
      );

      const changeType = isPrecursor
        ? EditorConstants.changeTypes.misc.HEADER_ADD_PRECURSOR_LETTER
        : EditorConstants.changeTypes.misc.HEADER_ADD_SUCCESSOR_LETTER;

      setSelectedLetter(null);
      setSelectedOption(null);

      props.onSave(props.xmlDoc, changeType, successMessage, null);
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
    }
  };

  return (
    <>
      <DialogContent>
        <div className="autoSnippetFormRow" style={{ marginTop: '25px', width: '98%' }}>
          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrecSuccLetterCheckboxChange('unknown')}
                  checked={selectedOption === 'unknown'}
                />
              }
              label={unknownLabel}
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrecSuccLetterCheckboxChange('not_identified')}
                  checked={selectedOption === 'not_identified'}
                />
              }
              label={notDeterminedLabel}
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrecSuccLetterCheckboxChange('select')}
                  checked={selectedOption === 'select'}
                />
              }
              label={autocompleteLabel}
            />
          </Stack>
        </div>
        <div className="autoSnippetFormRow" style={{ marginTop: '25px', width: '98%' }}>
          <Stack spacing={2}>
            <Autocomplete
              disabled={!autoAvailable}
              options={letters}
              value={selectedLetter}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, newValue) => setSelectedLetter(newValue)}
              onInputChange={(_, inputValue, reason) => {
                if (
                  inputValue &&
                  reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION
                ) {
                  void debouncedSearchForLetters(inputValue);
                }
              }}
              getOptionLabel={(option) => option.title || ''}
              filterOptions={(options, { inputValue }) =>
                options.filter(
                  (option) =>
                    option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.name.toLowerCase().includes(inputValue.toLowerCase()),
                )
              }
              renderOption={(props, option, { inputValue }) => {
                return (
                  <li {...props}>
                    <div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: MiscUtils.stringHandling.highlightText(option.title, inputValue),
                        }}
                      />
                      <div
                        style={{ fontSize: '0.8em', color: 'gray' }}
                        dangerouslySetInnerHTML={{
                          __html: MiscUtils.stringHandling.highlightText(option.name, inputValue),
                        }}
                      />
                    </div>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label={autocompleteLabel} variant="outlined" />
              )}
              fullWidth
            />
          </Stack>
        </div>
        <Divider />
        <DialogActionButton
          label={buttonLabel}
          onClick={handleSubmit}
          disabled={selectedOption === null}
        />
      </DialogContent>
    </>
  );
};

export default ManagePreccSuccLetterDialog;
