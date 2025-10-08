import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { fetchPinnedLetters, setLetterPinStatus } from '@src/services/editor/apiPinnedLettersRequest.service';
import { useSelector } from 'react-redux';
import { setDialogType, setEditorLetter, setEditorPinnedLetters, setTabToCloseId } from '@src/redux/slices/editor.letter.slice';
import { RootState } from '@src/redux/redux.store';
import { enqueueSnackbar } from 'notistack';
import { PinnedLetter } from '@src/services/mappings/editorMappings';
import { setEditorTabAndPinnedLettersThunk, setEditorTabAndPinnedLetterThunk } from '@src/redux/thunks/editor.letter.thunk';
import { useAppDispatch } from '@src/redux/hooks';
import { fetchLetterData } from '@src/services/editor/apiLettersRequest.service';
import { MiscUtils } from '@src/utils/misc';
import { EditorUtils } from '@src/utils/editor';
import { EditorConstants } from '@src/constants/editor';

const updatePinnedLetterStatus = (pinnedLetters: PinnedLetter[], letterId: number, isPinned: boolean): PinnedLetter[] => {
  return pinnedLetters.map((letter) => (letter.id === letterId ? { ...letter, isPinned: isPinned } : letter));
};

const LetterTabs = () => {
  const dispatch = useAppDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const changeLetterViewMode = useSelector((state: RootState) => state.editorLetter.changeLetterViewMode);
  const stateActiveTab = useSelector((state: RootState) => state.editorLetter.tabNumber);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (statePinnedLetters.length === 0) {
      try {
        fetchPinnedLetters().then((pinnedLetters) => {
          dispatch(setEditorPinnedLetters({ pinnedLetters }));
        });
      } catch (err) {
        enqueueSnackbar(`Failed to fetch pinned letters: ${MiscUtils.misc.getErrorMessage(err)}`, {
          variant: 'error',
        });
      }
    }
  }, [dispatch, statePinnedLetters.length]);

  useEffect(() => {
    if (statePinnedLetters.length > 0 && !changeLetterViewMode) {
      dispatch(
        setEditorLetter({
          letter: {
            id: statePinnedLetters[0].id,
            name: statePinnedLetters[0].name,
            viewMode: statePinnedLetters[0].viewMode,
          },
        }),
      );
      if (stateActiveTab === null) {
        setActiveTab(0);
      } else {
        setActiveTab(stateActiveTab);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statePinnedLetters]);

  const handleTabChange = (_: React.SyntheticEvent, newTabValue: number) => {
    const newPinnedLetter = statePinnedLetters[newTabValue];
    let newXmlContent: string | null = null;

    fetchLetterData(newPinnedLetter.id)
      .then((letter) => {
        if (!letter) {
          enqueueSnackbar(`Failed to fetch letter data for letter ID: ${newPinnedLetter.id}`, {
            variant: 'error',
          });
          return;
        }
        newXmlContent = letter.xmlContent;
      })
      .catch((err) => {
        enqueueSnackbar(`Failed to fetch letter data: ${MiscUtils.misc.getErrorMessage(err)}`, {
          variant: 'error',
        });
      });

    dispatch(
      setEditorTabAndPinnedLetterThunk({
        letter: {
          id: newPinnedLetter.id,
          name: newPinnedLetter.name,
          viewMode: newPinnedLetter.viewMode,
          xmlContent: newXmlContent,
        },
        tabNumber: newTabValue,
      }),
    );
    setActiveTab(newTabValue);
  };

  const handleCloseTab = async (tabPinnedLetter: PinnedLetter, tabIndex: number) => {
    const openCommitCloseTabPanel = (tabLetterId: number): void => {
      dispatch(setTabToCloseId({ tabToCloseId: tabLetterId }));
      dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.CLOSE_TAB_WITH_CONTENT }));
      return;
    };

    try {
      if (EditorUtils.letterTabs.hasUnsavedChanges(tabPinnedLetter)) {
        openCommitCloseTabPanel(tabPinnedLetter.id);
        return;
      }

      const success = await setLetterPinStatus(tabPinnedLetter, false);

      if (success) {
        EditorUtils.letterTabs.removeStateTab(dispatch, statePinnedLetters, tabPinnedLetter, tabIndex);
      }
    } catch (err) {
      enqueueSnackbar(`Failed to close pinned letter: ${err}`, { variant: 'error' });
    }
  };

  const addToPinned = async (pinnedLetter: PinnedLetter) => {
    try {
      const success = await setLetterPinStatus(pinnedLetter, true);

      if (success) {
        dispatch(
          setEditorPinnedLetters({
            pinnedLetters: updatePinnedLetterStatus(statePinnedLetters, pinnedLetter.id, true),
          }),
        );
      }
    } catch (err) {
      enqueueSnackbar(`Failed to pin letter: ${err}`, { variant: 'error' });
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: { xs: 320, sm: 840, lg: 960, xl: 1024 }, bgcolor: 'background.paper' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="scrollable force tabs example"
          sx={{
            '& .MuiTabs-scrollButtons': {
              backgroundColor: '#f0f0f0', // Background color of the scroll buttons
              fontWeight: 'bold', // Font weight of the scroll buttons
              color: '#2639d0', // Color of the arrow icons
              '&.Mui-disabled': {
                opacity: 0.3, // Style for disabled scroll buttons
              },
            },
          }}
        >
          {statePinnedLetters.map((pinnedLetter, index) => (
            <Tab
              key={pinnedLetter.id}
              label={
                <Box display="flex" alignItems="center">
                  {pinnedLetter.name}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pinnedLetter.isPinned) {
                        void handleCloseTab(pinnedLetter, index);
                      } else {
                        void addToPinned(pinnedLetter);
                      }
                    }}
                    sx={{ ml: 1 }}
                  >
                    {pinnedLetter.isPinned ? (
                      <CloseIcon fontSize="small" /> // Show CloseIcon if pinned
                    ) : (
                      <AddIcon fontSize="small" /> // Show AddIcon if not pinned
                    )}
                  </IconButton>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>
    </>
  );
};

export default LetterTabs;
