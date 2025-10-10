import type { EditorKeyHandleItem } from '@src/services/mappings/editorMappings';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, store } from '@src/redux/redux.store';
import { RootState } from '@src/redux/redux.store';
import {
  Box,
  Divider,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  allTimesAvailableKeyHandleDefinitions,
  contentMarkedKeyHandleDefinitions,
  generateKeyHandleAction,
} from '@src/components/editor/letter/Center/lib/keyHandlerDefinitions';
import { enqueueSnackbar } from 'notistack';
import { runOncePerAction } from '@src/utils/misc/stateHandling';

const HelpShortcutsContainer = () => {
  const allShortcutsArray: EditorKeyHandleItem[] = Object.values(
    allTimesAvailableKeyHandleDefinitions,
  );
  const markedShortcutsArray: EditorKeyHandleItem[] = Object.values(
    contentMarkedKeyHandleDefinitions,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const stateLetterContent = useSelector((state: RootState) => state.editorLetter.content);
  const { textIsMarked } = stateLetterContent;

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically focus when component mounts
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const activeShortcuts = useMemo(() => {
    const all = [...allShortcutsArray, ...(textIsMarked ? markedShortcutsArray : [])];
    return all.sort((a, b) => a.description.localeCompare(b.description));
  }, [textIsMarked]);

  const filteredShortcuts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return activeShortcuts.filter(
      (s) =>
        (s.description.toLowerCase().includes(term) || s.key.toLowerCase().includes(term)) &&
        s.skipForHelp !== true,
    );
  }, [searchTerm, activeShortcuts]);

  const handleExecute = async (keyHandleDefinition: EditorKeyHandleItem) => {
    try {
      const action = generateKeyHandleAction(keyHandleDefinition);

      if (!action) {
        enqueueSnackbar('Fehler bei der Tastenkombination: Aktion nicht gefunden', {
          variant: 'error',
        });
        return;
      }
      runOncePerAction(keyHandleDefinition.key, async () => {
        try {
          await action(dispatch, () => store.getState());
        } catch (error) {
          enqueueSnackbar('Fehler bei der Tastenkombination: ' + (error as Error).message, {
            variant: 'error',
          });
        }
      });
    } catch (e) {
      enqueueSnackbar('Fehler bei der Ausführung der Tastenkombination.', { variant: 'error' });
    }
  };

  return (
    <>
      <Box
        sx={{
          p: 2,
          width: '95%',
          maxHeight: '60vh',
          minHeight: '200',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Keyboard Shortcuts
        </Typography>

        <TextField
          size="small"
          fullWidth
          placeholder="Search shortcuts…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          inputRef={searchInputRef}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />

        <List dense disablePadding>
          {filteredShortcuts.map((shortcut, idx) => (
            <React.Fragment key={`${shortcut.key}-${idx}`}>
              <ListItemButton
                onClick={() => handleExecute(shortcut)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecute(shortcut);
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={500}>
                        {shortcut.description}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 2, fontFamily: 'monospace' }}>
                        {shortcut.key}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
              {idx < filteredShortcuts.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}

          {filteredShortcuts.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No shortcuts found.
            </Typography>
          )}
        </List>
      </Box>
    </>
  );
};

export default HelpShortcutsContainer;
