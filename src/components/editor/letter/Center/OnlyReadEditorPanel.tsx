import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, Grid, TextField, Typography } from '@mui/material';
import { EditorLetter, type PinnedLetter } from '@src/services/mappings/editorMappings';
import { EditorConstants } from '@src/constants/editor';
import { MiscUtils } from '@src/utils/misc';
import {
  fetchLetterXmlContent,
  fetchSearchLetters,
} from '@src/services/editor/apiLettersRequest.service';
import { editor } from 'monaco-editor';
import XMLDisplayParser from '@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { enqueueSnackbar } from 'notistack';
import { useAppDispatch } from '@src/redux/hooks';
import { setReadableLetter, setReloadLetterContent } from '@src/redux/slices/editor.letter.slice';

const SEARCH_HEIGHT = '10%';

const OnlyReadEditorPanel: React.FC = () => {
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const inputPlaceHolder = 'Briefname oder -titel eingeben';
  const stateReadableLetter = useSelector(
    (state: RootState) => state.editorLetter.onlyReadableLetter,
  );
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState<EditorLetter[]>([]);
  const stateLetterFontSize = useSelector(
    (state: RootState) => state.auth.settings?.letterFontSize,
  );

  const [autocompleteDefaultValue, setAutocompleteDefaultValue] = useState<string | null>(null);

  useEffect(() => {
    if (autocompleteRef.current) {
      autocompleteRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (stateReadableLetter) {
      setAutocompleteDefaultValue(stateReadableLetter.autocompleteName);
      setXmlContent(stateReadableLetter.xmlContent);
    }
  }, [stateReadableLetter]);

  const onValueChange = async (choosenLetter: EditorLetter) => {
    if (!choosenLetter?.id) return;

    try {
      const xmlContent = await fetchLetterXmlContent(choosenLetter.id);

      if (xmlContent) {
        // dispatch(
        //   setReadableLetter({ autocompleteName: choosenLetter.name, xmlContent: xmlContent }),
        // );
        setXmlContent(xmlContent);
      } else {
        enqueueSnackbar('Fehler: Kein XML-Inhalt gefunden', { variant: 'error' });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';

      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const onInputChange = async (input: string) => {
    if (input.length < 2) {
      setAutocompleteOptions([]);
      return;
    }

    const searchResult: EditorLetter[] | undefined = await fetchSearchLetters(input);
    setAutocompleteOptions(searchResult ?? []);
  };

  const parserXmlMemo = useMemo(() => {
    if (xmlContent === undefined || xmlContent === null) return <></>;

    return (
      <XMLDisplayParser
        xmlContentRef={xmlContentRef}
        xmlString={xmlContent}
        onRightClickMarked={(pos) => null}
      />
    );
  }, [xmlContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Suchmaske – fix */}
      <Box
        sx={{
          height: SEARCH_HEIGHT,
          flexShrink: 0,
          overflow: 'auto',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderBottom: '2px solid #999', // fixer Trenner
        }}
      >
        <Box sx={{ fontWeight: 'bold' }}>
          <Typography variant="h5" gutterBottom>
            Brief für Leseansicht auswählen
          </Typography>
        </Box>
        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <Autocomplete
              disabled={false}
              options={autocompleteOptions}
              // value={autocompleteDefaultValue}
              onChange={(_, newValue) => onValueChange(newValue)}
              onInputChange={(_, inputValue, reason) => {
                if (
                  inputValue &&
                  reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION
                ) {
                  onInputChange(inputValue);
                }
              }}
              getOptionLabel={(option) => option?.name || ''}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase()),
                )
              }
              renderOption={(props, option, { inputValue }) => {
                return (
                  <li {...props}>
                    <div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: MiscUtils.stringHandling.highlightText(option.name, inputValue),
                        }}
                      />
                    </div>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={autocompleteRef}
                  label={inputPlaceHolder}
                  variant="outlined"
                />
              )}
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>

      {/* XML WYSIWYG – nimmt den Rest */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* TODO: XML-WYSIWYG-Komponente */}
        <Box sx={{ fontWeight: 'bold' }}>
          <div
            className="letter-xml"
            id="onlyReadletterXml"
            style={{ fontSize: `${stateLetterFontSize}%` }}
          >
            <div id="onlyReadletterXmlContent" style={{ padding: 20 }}>
              {xmlContent && parserXmlMemo}
            </div>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default OnlyReadEditorPanel;
