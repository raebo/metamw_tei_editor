import {Box, Chip, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField} from '@mui/material';
import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import {EditorConstants, LanguageOption } from '../../../../../../constants/editor';
import React, {useEffect, useState} from 'react';
import CancelIcon from "@mui/icons-material/Cancel";
import {EditorUtils} from "../../../../../../utils/editor";

const TeiHeaderTransEdition = (props: TeiHeaderDialogProps) => {
  const [letterLanguages, setLetterLanguages] = useState<LanguageOption[]>([])
	const [selectedLang, setSelectedLang] = useState("");
	const [transkriptionValue, setTranskriptionValue] = useState<string>(props.completionState.transkriptionValue)
	const [editionValue, setEditionValue] = useState<string>(props.completionState.editionValue)

	useEffect(() => {
		const assignedLanguages : LanguageOption[] = EditorUtils.teiHeaderContent.extractLanguages(props.teiHeader)

		props.onChange({ letterLanguage: assignedLanguages });
		setLetterLanguages(Array.from(new Set([...assignedLanguages, ...letterLanguages])));
	}, [props.teiHeader])

  const changeTranskriptionValue = (value: string) => {
    props.onChange({ transkriptionValue: value })
		setTranskriptionValue(value);
  }

  const changeEditionValue = (value: string) => {
    props.onChange({ editionValue: value })
		setEditionValue(value);
  }

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'de' | 'en' | 'fr' | 'it' | 'la' | 'grc' | 'he';

		const language = EditorConstants.LANGUAGES.find( lang => lang.value === value)

		if (language) {
			setLetterLanguages(Array.from(new Set([...letterLanguages, language])));
			props.onChange({ letterLanguage: Array.from(new Set([...letterLanguages, language]) ) });
			setSelectedLang("");
		}
	}

	const handleRemoveLanguage = (lang: LanguageOption) => {
		const updatedLanguages = letterLanguages.filter((l) => l !== lang);
		setLetterLanguages(updatedLanguages);
		props.onChange({ letterLanguage: updatedLanguages });
	}

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Stack direction="row" spacing={2}>
          <TextField
            id="outlined-basic"
            label="Transkription"
            variant="outlined"
						disabled={true}
            value={transkriptionValue}
            onChange={(event) => changeTranskriptionValue(event.target.value)}
          />
            <TextField
            id="outlined-basic"
            label="Edition"
            variant="outlined"
						disabled={true}
            value={editionValue}
            onChange={(event) => changeEditionValue(event.target.value)}
          />
          <FormControl variant="outlined" sx={{m: 1, minWidth: 120, width: '98%'}}>
            <InputLabel id="auto-anno-snippet-reference-type">Sprache des Briefes</InputLabel>
            <Select
              value={selectedLang}
              disabled={false}
              labelId="simple-select-filled-label"
              id="simple-select-filled"
              onChange={(event) => handleLanguageChange(event)}
            >
							<MenuItem value="">
								<em>Sprache Auswählen</em>
							</MenuItem>
							{ EditorConstants.LANGUAGES.map((item) => {
								const isAdded = letterLanguages.some(lang => lang.value === item.value );
								return (
									<MenuItem
										key={item.value}
										value={item.value}
										disabled={isAdded}
										sx={isAdded ? { color: "gray" } : {}}
									>
										{item.label}
									</MenuItem>
								);
							})}
            </Select>
						<Box mt={2} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							{ letterLanguages.map((lang) => {
								const label =
									EditorConstants.LANGUAGES.filter((l) => l.value === lang.value)[0].label || ""

								return (
									<Chip
										key={lang.value}
										label={label}
										onDelete={() => handleRemoveLanguage(lang)}
										deleteIcon={<CancelIcon />}
										color="primary"
										variant="outlined"
									/>
								);
							}) }
						</Box>
          </FormControl>
        </Stack>
      </div>
    </>
  )
}

export default TeiHeaderTransEdition
