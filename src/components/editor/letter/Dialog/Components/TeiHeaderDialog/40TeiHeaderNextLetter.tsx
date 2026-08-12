import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { Autocomplete, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { EditorLetter } from '@src/services/mappings/editorMappings';
import { searchForLetterNameTitle } from '@src/services/editor/apiLettersRequest.service';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { MiscUtils } from '@src/utils/misc';
import HighlightedText from '@src/components/support/HighlightedText';
import { EditorConstants } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor';
import { useTranslation } from 'react-i18next';

const TeiHeaderNextLetter = (props: TeiHeaderDialogProps) => {
  const { t } = useTranslation();

  const [nextLetterType, setNextLetterType] = useState<
    'unknown' | 'not_identified' | 'select' | null
  >(props.completionState.nextLetterType);
  const [autoAvailable, setAutoAvailable] = useState<boolean>(
    props.completionState.nextLetterType === 'select',
  );
  const selectedOption: EditorLetter | null = props.completionState.nextLetter;
  const [letters, setLetters] = useState<EditorLetter[]>([]);

  const setSelectedOption = (value: EditorLetter | null) => {
    if (value) {
      props.onChange({ nextLetter: value });
    }
  };

  useEffect(() => {
    const fetchDefaultLetters = async () => {
      try {
        const defaultLetters: EditorLetter[] | undefined = await searchForLetterNameTitle(
          'fmb',
          null,
        );

        if (defaultLetters === undefined) {
          enqueueSnackbar('No letters found', { variant: 'error' });
        } else {
          setLetters(defaultLetters);
        }
      } catch (error) {
        enqueueSnackbar('Error fetching letters', { variant: 'error' });
      }
    };

    const fetchNextLetter = async () => {
      if (!props.teiHeader) {
        // No TEI header available (e.g. when creating a new letter) -> nothing to extract;
        // a selection already made in completionState must not be overwritten here.
        return;
      }

      const { name, letterPrefix } = EditorUtils.teiHeaderContent.extractPrevNextLetter(
        props.teiHeader,
        'successor',
      );
      if (name && letterPrefix) {
        const nextLetter: EditorLetter[] | undefined = await searchForLetterNameTitle(
          letterPrefix,
          name,
        );

        if (nextLetter && nextLetter[0]) {
          props.onChange({
            nextLetterAutoAvailable: true,
            nextLetterType: 'select',
            nextLetter: nextLetter[0],
          });
          setNextLetterType('select');
          setAutoAvailable(true);
        }
      } else {
        props.onChange({
          nextLetterAutoAvailable: false,
          nextLetterType: name as 'unknown' | 'not_identified' | null,
          nextLetter: null,
        });
        if (name === 'unknown' || name === 'not_identified' || name === null) {
          setNextLetterType(name as 'unknown' | 'not_identified' | null);
        } else {
          setNextLetterType(null);
        }
      }
    };

    try {
      void fetchNextLetter();
      void fetchDefaultLetters();
    } catch (error) {
      enqueueSnackbar(
        'Error during initialization nextLetter: ' + MiscUtils.misc.getErrorMessage(error),
        { variant: 'error' },
      );
    }
  }, [props.teiHeader]);

  const handlePrevLetterCheckboxChange = (value: 'unknown' | 'not_identified' | 'select') => {
    props.onChange({
      nextLetterAutoAvailable: value === 'select',
      nextLetterType: value,
      ...(value !== 'select' && { nextLetter: null }),
    });
    setNextLetterType(value);
    if (value === 'select') {
      setAutoAvailable(true);
    }
  };

  const searchForLetters = async (inputValue: string) => {
    try {
      const responseLetters = await searchForLetterNameTitle('fmb', inputValue);

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
    [],
  );

  return (
    <>
      <div className="autoSnippetFormRow" style={{ marginTop: '25px', width: '98%' }}>
        <Stack spacing={2}>
          <Autocomplete
            disabled={!autoAvailable}
            options={letters}
            value={selectedOption}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, newValue) => setSelectedOption(newValue)}
            onInputChange={(_event, inputValue, reason) => {
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
                    <HighlightedText text={option.title} query={inputValue} />
                    <HighlightedText
                      text={option.name}
                      query={inputValue}
                      style={{ fontSize: '0.8em', color: 'gray' }}
                    />
                  </div>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('editor:dialog.teiHeaderNextLetter.label.chooseNextLetter')}
                variant="outlined"
              />
            )}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('unknown')}
                  checked={nextLetterType === 'unknown'}
                />
              }
              label={t('editor:dialog.teiHeaderNextLetter.checkbox.unknown')}
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('not_identified')}
                  checked={nextLetterType === 'not_identified'}
                />
              }
              label={t('editor:dialog.teiHeaderNextLetter.checkbox.notIdentified')}
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('select')}
                  checked={autoAvailable}
                />
              }
              label={t('editor:dialog.teiHeaderNextLetter.checkbox.select')}
            />
          </Stack>
        </Stack>
      </div>
    </>
  );
};

export default TeiHeaderNextLetter;
