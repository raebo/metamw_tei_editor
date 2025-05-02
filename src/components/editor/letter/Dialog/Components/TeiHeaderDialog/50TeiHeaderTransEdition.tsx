import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { TeiHeaderDialogProps } from '../AddTeiHeaderDialog';
import { EditorConstants } from '../../../../../../constants/editor';
import React from 'react';

const TeiHeaderTransEdition = (props: TeiHeaderDialogProps) => {

  const completionState = props.completionState

  const setTranskriptionValue = (value: string) => {
    props.onChange({ transkriptionValue: value })
  }

  const setEditionValue = (value: string) => {
    props.onChange({ editionValue: value })
  }

  const setLetterLanguage = (value: 'de' | 'en' | 'fr' | 'it' | 'la' | 'grc' | 'he' | null) => {
    props.onChange({ letterLanguage: value })
  }

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'de' | 'en' | 'fr' | 'it' | 'la' | 'grc' | 'he';
    setLetterLanguage(value);
  }

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Stack direction="row" spacing={2}>
          <TextField
            id="outlined-basic"
            label="Transkription"
            variant="outlined"
            value={completionState.transkriptionValue}
            onChange={(event) => setTranskriptionValue(event.target.value)}
          />
            <TextField
            id="outlined-basic"
            label="Edition"
            variant="outlined"
            value={completionState.editionValue}
            onChange={(event) => setEditionValue(event.target.value)}
          />
          <FormControl variant="outlined" sx={{m: 1, minWidth: 120, width: '98%'}}>
            <InputLabel id="auto-anno-snippet-reference-type">Sprache des Briefes</InputLabel>
            <Select
              defaultValue={""}
              disabled={false}
              labelId="simple-select-filled-label"
              id="simple-select-filled"
              onChange={(event) => handleLanguageChange(event)}
            >
              { EditorConstants.noteTypeLanguages.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              )) }
            </Select>
          </FormControl>
        </Stack>
      </div>
    </>
  )
}

export default TeiHeaderTransEdition
