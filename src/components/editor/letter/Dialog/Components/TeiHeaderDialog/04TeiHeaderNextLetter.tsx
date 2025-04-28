import { TeiHeaderDialogProps } from '../AddTeiHeaderDialog';
import { Autocomplete, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { EditorLetter } from '../../../../../../services/mappings/editorMappings';
import { searchForLetterNameTitle } from '../../../../../../services/editor/apiLettersRequest.service';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash';
import { MiscUtils } from '../../../../../../utils/misc';


const TeiHeaderNextLetter = (props: TeiHeaderDialogProps) => {

  const [selectedOption, setSelectedOption] = useState<EditorLetter | null>(null);
  const completionState = props.completionState
  const [letters, setLetters] = useState<EditorLetter[]>([]);

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

    fetchDefaultLetters();
  }, []);

  const handlePrevLetterCheckboxChange = (value: 'unknown' | 'not_identified' | 'select') => {
    switch (value) {
      case 'unknown':
        props.onChange({ nextLetterAutoAvailable: false, nextLetterName: value } )

        break;
      case 'not_identified':
        props.onChange({ nextLetterAutoAvailable: false, nextLetterName: value } )
        break;
      case 'select':
        props.onChange( { nextLetterAutoAvailable: true, nextLetterName: null } )
        break;
    }
  }

  const searchForLetters = async (inputValue: string) => {
    const responseLetters = await searchForLetterNameTitle('fmb', inputValue)

    if (responseLetters) {
      setLetters(responseLetters);
    }
  }

  const debouncedSearchForLetters = useMemo(
    () => debounce(searchForLetters, 300), // 300ms delay
    []
  );

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px" }}>
        <Stack spacing={2}>
          <Autocomplete
            disabled={!completionState.nextLetterAutoAvailable}
            options={letters}
            value={selectedOption}
            onChange={(_, newValue) => setSelectedOption(newValue)}
            onInputChange={(_, inputValue) => {
              if (inputValue) {
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
              <TextField {...params} label="Folgebrief auswählen" variant="outlined" />
            )}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('unknown')}
                  checked={completionState.nextLetterName === 'unknown'}
                />
              }
              label="Folgerbrief (Unbekannt)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('not_identified')}
                  checked={completionState.nextLetterName === 'not_identified'}
                />
              }
              label="Folgebrief (Noch nicht ermittelt)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handlePrevLetterCheckboxChange('select')}
                  checked={completionState.nextLetterAutoAvailable}
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
