import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { Autocomplete, TextField } from '@mui/material';
import React, {useEffect} from 'react';
import {EditorUtils} from "../../../../../../utils/editor";

const sndHeaderOptions = [
  "Musterstadt, 01. Januar 1821",
  "Musterstadt, 1. und 15. Januar 1821",
  "1. Januar 1821",
  "vor dem 1. Januar",
  "nach dem 5. Februar",
  "zwischen dem 1. und 5. Januar",
  "zwischen dem 1. Januar und 7. Februar",
  "Musterstadt, 1821",
  "1821",
]

const TeiHeaderSndHeadline = (props: TeiHeaderDialogProps) => {
  const completionState = props.completionState

	useEffect(() => {
		const { sndHeadline } = EditorUtils.teiHeaderContent.titleElementHeadlines(props.teiHeader)

		if (sndHeadline) {
			props.onChange({ sndHeaderComplete: true, sndHeaderContent: sndHeadline});
		}
	}, [props.teiHeader]);

	const setSndHeaderValue = (value: string) => {
    props.onChange( { sndHeaderComplete: true, sndHeaderContent: value })
  }

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Autocomplete
          freeSolo
          options={sndHeaderOptions}
          value={completionState.sndHeaderContent}
          onChange={(_event, newValue) => {
            if (newValue !== null) {
              setSndHeaderValue(newValue);
            }
          }}
          onInputChange={(_event, newInputValue) => {
            setSndHeaderValue(newInputValue);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Zweite Kopfzeile des Briefes einfügen" variant="outlined" />
          )}
        />
      </div>
    </>
  )
}

export default TeiHeaderSndHeadline;
