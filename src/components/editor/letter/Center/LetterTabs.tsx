import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Box, Tooltip, IconButton, Typography, type Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
  fetchPinnedLetters,
  setLetterPinStatus,
} from '@src/services/editor/apiPinnedLettersRequest.service';
import { useSelector } from 'react-redux';
import {
  setDialogType,
  setEditorLetter,
  setEditorPinnedLetters,
  setTabToCloseId,
} from '@src/redux/slices/editor.letter.slice';
import { RootState } from '@src/redux/redux.store';
import { enqueueSnackbar } from 'notistack';
import { PinnedLetter } from '@src/services/mappings/editorMappings';
import { setEditorTabAndPinnedLetterThunk } from '@src/redux/thunks/editor.letter.thunk';
import { useAppDispatch } from '@src/redux/hooks';
import { fetchLetterData } from '@src/services/editor/apiLettersRequest.service';
import { MiscUtils } from '@src/utils/misc';
import { EditorUtils } from '@src/utils/editor';
import { EditorConstants } from '@src/constants/editor';

function getTabTextColor(
  theme: Theme,
  { isPinned, isActive }: { isPinned: boolean; isActive: boolean },
) {
  const tabGroup = isPinned
    ? theme.palette.editorTabs.savedTab
    : theme.palette.editorTabs.unsavedTab;
  return isActive ? tabGroup.active.color : tabGroup.inactive.color;
}

const LetterTabs = () => {
  const dispatch = useAppDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const changeLetterViewMode = useSelector(
    (state: RootState) => state.editorLetter.changeLetterViewMode,
  );
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
        textIsMarked: false,
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
        EditorUtils.letterTabs.removeStateTab(
          dispatch,
          statePinnedLetters,
          tabPinnedLetter,
          tabIndex,
        );
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
            pinnedLetters: EditorUtils.letterTabs.updatePinnedLetterStatus(
              statePinnedLetters,
              pinnedLetter.id,
              true,
            ),
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
          aria-label="file tabs"
          sx={{
            '& .MuiTabs-scrollButtons': {
              backgroundColor: '#f0f0f0',
              fontWeight: 'bold',
              color: '#2639d0',
              '&.Mui-disabled': {
                opacity: 0.3,
              },
            },
          }}
        >
          {statePinnedLetters.map((pinnedLetter, index) => (
            <Tab
              key={pinnedLetter.id}
              label={
                <Tooltip title={pinnedLetter.name} arrow>
                  <Box display="flex" alignItems="center">
                    {!pinnedLetter.isPinned && (
                      <RadioButtonUncheckedIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'warning.main' }}
                      />
                    )}

                    <Typography
                      variant="body2"
                      sx={(theme) => ({
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontStyle: pinnedLetter.isPinned ? 'normal' : 'italic',
                        color: getTabTextColor(theme, {
                          isPinned: pinnedLetter.isPinned,
                          isActive: index === activeTab,
                        }),
                        fontWeight: index === activeTab ? 'bold' : 'normal',
                      })}
                    >
                      {pinnedLetter.name}
                    </Typography>

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
                      sx={{ ml: 0.5 }}
                      title={pinnedLetter.isPinned ? 'Close tab' : 'Save to workspace'}
                    >
                      {pinnedLetter.isPinned ? (
                        <CloseIcon fontSize="small" />
                      ) : (
                        <BookmarkAddIcon
                          fontSize="small"
                          sx={(theme) => ({
                            color: theme.palette.editorTabs.unsavedTab.bookmarkIconColor,
                          })}
                        />
                      )}
                    </IconButton>
                  </Box>
                </Tooltip>
              }
              sx={{
                backgroundColor: pinnedLetter.isPinned
                  ? 'transparent'
                  : (theme) => theme.palette.editorTabs.unsavedTab.background,
                borderBottom: pinnedLetter.isPinned
                  ? '2px solid transparent'
                  : (theme) => `2px solid ${theme.palette.editorTabs.unsavedTab.border}`,
              }}
            />
          ))}
        </Tabs>
      </Box>
    </>
  );
};

export default LetterTabs;
