import { TeiHeaderDialogProps } from '../AddTeiHeaderDialog';
import { Autocomplete, TextField } from '@mui/material';
import React from 'react';

const firstHeaderOptions = [
  "Anna Mustermann an Felix Mendelssohn Bartholdy in Musterstadt",
  "Anna Mustermann an Felix Mendelssohn Bartholdy und Otto Mustermann in Musterstadt",
  "Anna Mustermann und Otto Mustermann an Felix Mendelssohn Bartholdy in Musterstadt",
  "Anna Mustermann und Otto Mustermann an Felix Mendelssohn Bartholdy und Amalie Musterfrau in Musterstadt",
  "Anna Mustermann an Felix Mendelssohn Bartholdy",
  "Felix Mendelssohn Bartholdy an Anna Mustermann in Musterstadt"
]

const TeiHeaderFirstHeadline = (props: TeiHeaderDialogProps) => {

  const completionState = props.completionState;

  const setFirstHeaderValue = (value: string) => {
    props.onChange({ firstHeaderComplete: true, firstHeaderContent: value })
  }

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Autocomplete
          freeSolo
          options={firstHeaderOptions}
          value={completionState.firstHeaderContent}
          onChange={(event, newValue) => {
            if (newValue !== null) {
              setFirstHeaderValue(newValue);
            }
          }}
          onInputChange={(event, newInputValue) => {
            setFirstHeaderValue(newInputValue);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Erste Kopfzeile des Briefes einfügen" variant="outlined" />
          )}
        />
      </div>
    </>
  )
}

export default TeiHeaderFirstHeadline;
