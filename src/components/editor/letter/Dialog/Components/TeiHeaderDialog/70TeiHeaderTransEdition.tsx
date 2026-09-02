import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material';
import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { EditorConstants, LanguageOption } from '@src/constants/editor';
import React, { useEffect, useState } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';
import { EditorUtils } from '@src/utils/editor';
import { useTranslation } from 'react-i18next';

const TeiHeaderTransEdition = (props: TeiHeaderDialogProps) => {
  const { t } = useTranslation();
  const [letterLanguages, setLetterLanguages] = useState<LanguageOption[]>([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [transkriptionValue, setTranskriptionValue] = useState<string>(
    props.completionState.transkriptionValue,
  );
  const [editionValue, setEditionValue] = useState<string>(props.completionState.editionValue);
  const { teiHeader, onChange } = props;

  useEffect(() => {
    const assignedLanguages: LanguageOption[] =
      EditorUtils.teiHeaderContent.extractLanguages(teiHeader);

    onChange({ letterLanguage: assignedLanguages });
    // Functional update (reads the *current* letterLanguages via `prev`, not the value closed
    // over when this effect was created) so the effect doesn't need `letterLanguages` as a
    // dependency. Depending on it directly would be unsafe here: the merged array below is a
    // freshly created reference every run, so a `letterLanguages` dependency would make this
    // effect re-trigger itself on every commit - an infinite loop.
    setLetterLanguages((prev) => Array.from(new Set([...assignedLanguages, ...prev])));
  }, [teiHeader, onChange]);

  const changeTranskriptionValue = (value: string) => {
    onChange({ transkriptionValue: value });
    setTranskriptionValue(value);
  };

  const changeEditionValue = (value: string) => {
    onChange({ editionValue: value });
    setEditionValue(value);
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'de' | 'en' | 'fr' | 'it' | 'la' | 'grc' | 'he';

    const language = EditorConstants.LANGUAGES.find((lang) => lang.value === value);

    if (language) {
      const updatedLanguages = Array.from(new Set([...letterLanguages, language]));
      setLetterLanguages(updatedLanguages);
      onChange({ letterLanguage: updatedLanguages });
      setSelectedLang('');
    }
  };

  const handleRemoveLanguage = (lang: LanguageOption) => {
    const updatedLanguages = letterLanguages.filter((l) => l !== lang);
    setLetterLanguages(updatedLanguages);
    onChange({ letterLanguage: updatedLanguages });
  };

  return (
    <>
      <div className="autoSnippetFormRow" style={{ marginTop: '25px', width: '98%' }}>
        <Stack direction="row" spacing={2}>
          <TextField
            id="outlined-basic"
            label={t('editor:dialog.teiHeaderTransEdition.label.transcription')}
            variant="outlined"
            disabled={true}
            value={transkriptionValue}
            onChange={(event) => changeTranskriptionValue(event.target.value)}
          />
          <TextField
            id="outlined-basic"
            label={t('editor:dialog.teiHeaderTransEdition.label.edition')}
            variant="outlined"
            disabled={true}
            value={editionValue}
            onChange={(event) => changeEditionValue(event.target.value)}
          />
          <FormControl variant="outlined" sx={{ m: 1, minWidth: 120, width: '98%' }}>
            <InputLabel id="auto-anno-snippet-reference-type">
              {t('editor:dialog.teiHeaderTransEdition.label.letterLanguage')}
            </InputLabel>
            <Select
              value={selectedLang}
              disabled={false}
              labelId="simple-select-filled-label"
              id="simple-select-filled"
              onChange={(event) => handleLanguageChange(event)}
            >
              <MenuItem value="">
                <em>{t('editor:dialog.teiHeaderTransEdition.label.chooseLanguage')}</em>
              </MenuItem>
              {EditorConstants.LANGUAGES.map((item) => {
                const isAdded = letterLanguages.some((lang) => lang.value === item.value);
                return (
                  <MenuItem
                    key={item.value}
                    value={item.value}
                    disabled={isAdded}
                    sx={isAdded ? { color: 'gray' } : {}}
                  >
                    {item.label}
                  </MenuItem>
                );
              })}
            </Select>
            <Box mt={2} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {letterLanguages.map((lang) => {
                const label =
                  EditorConstants.LANGUAGES.filter((l) => l.value === lang.value)[0].label || '';

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
              })}
            </Box>
          </FormControl>
        </Stack>
      </div>
    </>
  );
};

export default TeiHeaderTransEdition;
