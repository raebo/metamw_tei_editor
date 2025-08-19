import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { Autocomplete, TextField } from '@mui/material';
import React, {useEffect} from 'react';
import {EditorUtils} from "../../../../../../utils/editor";

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

	useEffect(() => {
		const { firstHeadline, sndHeadline } = EditorUtils.teiHeaderContent.titleElementHeadlines(props.teiHeader)

		if (firstHeadline) {
			props.onChange({ firstHeaderComplete: true, firstHeaderContent: firstHeadline });
		}
	}, [props.teiHeader]);

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
