import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { Autocomplete, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { EditorLetter } from '../../../../../../services/mappings/editorMappings';
import { searchForLetterNameTitle } from '../../../../../../services/editor/apiLettersRequest.service';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { MiscUtils } from '../../../../../../utils/misc';
import { EditorConstants } from '../../../../../../constants/editor';
import {EditorUtils} from "../../../../../../utils/editor";


const TeiHeaderNextLetter = (props: TeiHeaderDialogProps) => {

	const [nextLetterType, setNextLetterType] = useState<'unknown' | 'not_identified' | 'select' | null>(null)
	const [autoAvailable, setAutoAvailable] = useState<boolean>(false)
  const selectedOption: EditorLetter | null = props.completionState.nextLetter
  const [letters, setLetters] = useState<EditorLetter[]>([]);


  const setSelectedOption = (value: EditorLetter | null) => {
    if (value) {
      props.onChange({ nextLetter: value })
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

		const fetchNextLetter = async() => {
			const { name, letterPrefix } = EditorUtils.teiHeaderContent.extractPrevNextLetter(props.teiHeader, 'successor');
			if (name && letterPrefix) {
				const nextLetter: EditorLetter[] | undefined = await searchForLetterNameTitle(letterPrefix, name)

				if (nextLetter && nextLetter[0]) {
					props.onChange({
						nextLetterAutoAvailable: true,
						nextLetterType: 'select',
						nextLetter: nextLetter[0]
					});
					setNextLetterType('select')
					setAutoAvailable(true)
				}
			} else {
				props.onChange({
					nextLetterAutoAvailable: false,
					nextLetterType: name as 'unknown' | 'not_identified' | null,
					nextLetter: null
				})
				if (name === 'unknown' || name === 'not_identified' || name === null) {
					setNextLetterType(name as 'unknown' | 'not_identified' | null);
				} else {
					setNextLetterType(null);
				}
			}
		}

		try {
			void fetchNextLetter();
			void fetchDefaultLetters()
		} catch (error) {
			enqueueSnackbar("Error during initialization nextLetter: " + MiscUtils.misc.getErrorMessage(error), { variant:"error" });
		}
  }, [props.teiHeader]);

  const handlePrevLetterCheckboxChange = (value: 'unknown' | 'not_identified' | 'select') => {
    props.onChange({
      nextLetterAutoAvailable: value === 'select',
      nextLetterType: value,
      ...(value !== 'select' && { nextLetter: null })
    }
    )
		setNextLetterType(value);
		if (value === 'select') {
			setAutoAvailable(true);
		}
  }

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
            disabled={!autoAvailable}
            options={letters}
            value={selectedOption}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, newValue) => setSelectedOption(newValue)}
            onInputChange={(_event, inputValue, reason) => {
              if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
                void debouncedSearchForLetters(inputValue);
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
              <TextField {...params} label="Folgebrief auswählen" variant="outlined" />
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
              label="Folgerbrief (Unbekannt)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('not_identified')}
                  checked={nextLetterType === 'not_identified'}
                />
              }
              label="Folgebrief (Noch nicht ermittelt)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('select')}
                  checked={autoAvailable}
                />
              }
              label="Auswahl Folgebrief"
            />
          </Stack>


        </Stack>
      </div>
    </>
  )
}

export default TeiHeaderNextLetter
