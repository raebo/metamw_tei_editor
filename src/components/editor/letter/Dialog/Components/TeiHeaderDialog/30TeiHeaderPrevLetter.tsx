import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { Autocomplete, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { searchForLetterNameTitle } from '../../../../../../services/editor/apiLettersRequest.service';
import { EditorLetter } from '../../../../../../services/mappings/editorMappings';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { MiscUtils } from '../../../../../../utils/misc';
import { EditorConstants } from '../../../../../../constants/editor';
import {EditorUtils} from "../../../../../../utils/editor";

const TeiHeaderPrevLetter = (props: TeiHeaderDialogProps) => {

  const completionState = props.completionState
  const selectedOption: EditorLetter | null = props.completionState.prevLetter
  const [letters, setLetters] = useState<EditorLetter[]>([])

  const setSelectedOption = (value: EditorLetter | null) => {
    if (value) {
      props.onChange({ prevLetter: value})
    }
  }

  useEffect(() => {
    const fetchDefaultLetters = async () => {
      try {
        const defaultLetters: EditorLetter[] | undefined = await searchForLetterNameTitle('fmb', null);

        if (defaultLetters === undefined) {
          enqueueSnackbar("No letters found", { variant:"error" });
        } else {
          setLetters(defaultLetters);
        }
      } catch (error) {
        enqueueSnackbar("Error fetching letters", { variant:"error" });
      }
    };

		const fetchPrevLetter = async() => {
			const { name, letterPrefix, letterStatus } = EditorUtils.teiHeaderContent.extractPrevNextLetter(props.teiHeader, 'precursor');
			if (name && letterPrefix) {
				const prevLetter: EditorLetter[] | undefined = await searchForLetterNameTitle(letterPrefix, name)

				if (prevLetter && prevLetter[0]) {
					props.onChange({
						prevLetterAutoAvailable: true,
						prevLetterType: 'select',
						prevLetter: prevLetter[0]
					});
				}
			} else {
				props.onChange({
					prevLetterAutoAvailable: false,
					prevLetterType: letterStatus,
					prevLetter: null
				});
			}
		}

    fetchDefaultLetters();
		fetchPrevLetter();
  }, [props.teiHeader]);


  const handlePrevLetterCheckboxChange = (value: 'unknown' | 'not_identified' | 'select') => {
    props.onChange({
      prevLetterAutoAvailable: value === 'select',
      prevLetterType: value,
      ...(value !== 'select' && { prevLetter: null })
    });
  };

  const searchForLetters = async (inputValue: string) => {
    try {
      const responseLetters = await searchForLetterNameTitle('fmb', inputValue)

      if (responseLetters) {
        setLetters(responseLetters);
      }

    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
    }
  }

  const debouncedSearchForLetters = useMemo(
    () => debounce(searchForLetters, 300), // 300ms delay
    []
  );

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Stack spacing={2}>
          <Autocomplete
            disabled={!completionState.prevLetterAutoAvailable}
            options={letters}
            value={selectedOption}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, newValue) => setSelectedOption(newValue) }
            onInputChange={(_, inputValue, reason) => {
              if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
                debouncedSearchForLetters(inputValue);
              }
            }}
            getOptionLabel={(option) => option.title || ''}
            filterOptions={(options, { inputValue }) =>
              options.filter((option) =>
                option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.name.toLowerCase().includes(inputValue.toLowerCase())
              )
            }
            renderOption={(props, option, { inputValue }) => {
              return (
                <li {...props}>
                  <div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: MiscUtils.stringHandling.highlightText(option.title, inputValue)
                      }}
                      />
                    <div style={{ fontSize: '0.8em', color: 'gray' }}
                       dangerouslySetInnerHTML={{
                         __html: MiscUtils.stringHandling.highlightText(option.name, inputValue)
                       }}
                    />
                  </div>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Vorgängerbrief auswählen" variant="outlined" />
            )}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('unknown')}
                  checked={completionState.prevLetterType === 'unknown'}
                />
              }
              label="Vorgängerbrief (Unbekannt)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('not_identified')}
                  checked={completionState.prevLetterType === 'not_identified'}
                />
              }
              label="Vorgängerbrief (Noch nicht ermittelt)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('select')}
                  checked={completionState.prevLetterAutoAvailable}
                />
              }
              label="Auswahl Vorgängerbrief"
            />
          </Stack>


        </Stack>
      </div>
    </>
  )
}

export default TeiHeaderPrevLetter
