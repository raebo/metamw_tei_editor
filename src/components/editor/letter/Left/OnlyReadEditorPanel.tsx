import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, Grid, TextField, Typography } from '@mui/material';
import { EditorLetter } from '@src/services/mappings/editorMappings';
import { EditorConstants } from '@src/constants/editor';
import { MiscUtils } from '@src/utils/misc';
import { fetchLetterXmlContent, fetchSearchLetters } from '@src/services/editor/apiLettersRequest.service';
import XMLDisplayParser from '@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser';
import { useSelector } from 'react-redux';
import { RootState, store } from '@src/redux/redux.store';
import { enqueueSnackbar } from 'notistack';
import { useAppDispatch } from '@src/redux/hooks';
import { setReadableLetter } from '@src/redux/slices/editor.letter.slice';

const SEARCH_HEIGHT = '10%';

const OnlyReadEditorPanel: React.FC = () => {
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();

  const stateReadableLetter = useSelector((state: RootState) => state.editorLetter.onlyReadableLetter);
  const stateLetterFontSize = useSelector((state: RootState) => state.auth.settings?.letterFontSize);

  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState<EditorLetter[]>([]);
  const [autocompleteLetter, setAutocompleteLetter] = useState<EditorLetter | null>(null);

  // Beim Mount: Fokus setzen + Redux-State wiederherstellen (via store.getState() um Timing-Problem zu umgehen)
  useEffect(() => {
    autocompleteRef.current?.focus();

    const saved = store.getState().editorLetter.onlyReadableLetter;
    if (saved?.id) {
      setAutocompleteLetter({ id: saved.id, name: saved.name } as EditorLetter);
      setXmlContent(saved.xmlContent);
    }
  }, []);

  // During open panel: listening to external changes
  useEffect(() => {
    if (!stateReadableLetter?.id) return;
    setAutocompleteLetter({ id: stateReadableLetter.id, name: stateReadableLetter.name } as EditorLetter);
    setXmlContent(stateReadableLetter.xmlContent);
  }, [stateReadableLetter?.id]);

  const onValueChange = async (chosenLetter: EditorLetter | null) => {
    if (!chosenLetter?.id) return;
    try {
      const xml = await fetchLetterXmlContent(chosenLetter.id);
      if (xml) {
        dispatch(setReadableLetter({ id: chosenLetter.id, name: chosenLetter.name, xmlContent: xml }));
        setXmlContent(xml);
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
    const searchResult = await fetchSearchLetters(input);
    setAutocompleteOptions(searchResult ?? []);
  };

  const parserXmlMemo = useMemo(() => {
    if (!xmlContent) return null;
    return (
      <XMLDisplayParser
        xmlContentRef={xmlContentRef}
        xmlString={xmlContent}
        onRightClickMarked={() => null}
      />
    );
  }, [xmlContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Searchbox– fix */}
      <Box
        sx={{
          height: SEARCH_HEIGHT,
          flexShrink: 0,
          overflow: 'auto',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderBottom: '2px solid #999',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Brief für Leseansicht auswählen
        </Typography>
        <Grid container sx={{ mt: 3, mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <Autocomplete<EditorLetter>
              options={autocompleteOptions}
              value={autocompleteLetter}
              onChange={(_, newValue) => void onValueChange(newValue)}
              onInputChange={(_, inputValue, reason) => {
                if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
                  void onInputChange(inputValue);
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option?.name ?? ''}
              filterOptions={(options, { inputValue }) =>
                options.filter((o) => o.name.toLowerCase().includes(inputValue.toLowerCase()))
              }
              renderOption={(props, option, { inputValue }) => (
                <li {...props}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: MiscUtils.stringHandling.highlightText(option.name, inputValue),
                    }}
                  />
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={autocompleteRef}
                  label="Briefname oder -titel eingeben"
                  variant="outlined"
                />
              )}
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>

      {/* XML-View– takes the rest space */}
      <Box sx={{ flex: 1, overflow: 'auto', padding: '8px', backgroundColor: '#ffffff' }}>
        <div className="letter-xml" id="onlyReadletterXml" style={{ fontSize: `${stateLetterFontSize}%` }}>
          <div id="onlyReadletterXmlContent" style={{ padding: 20 }}>
            {parserXmlMemo}
          </div>
        </div>
      </Box>

    </Box>
  );
};

export default OnlyReadEditorPanel;
