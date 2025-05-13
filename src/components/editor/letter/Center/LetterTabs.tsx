import React, { useEffect, useState } from "react";
import { Tabs, Tab, Box, IconButton } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from '@mui/icons-material/Add';
import { fetchPinnedLetters, setLetterPinStatus } from "../../../../services/editor/apiPinnedLettersRequest.service";
import { useSelector } from "react-redux";
import {
  setEditorLetter,
  setEditorPinnedLetters,
} from "../../../../redux/slices/editor.letter.slice";
import { RootState } from "../../../../redux/redux.store";
import { enqueueSnackbar } from "notistack";
import { PinnedLetter } from "../../../../services/mappings/editorMappings";
import {
  setEditorTabAndPinnedLettersThunk,
  setEditorTabAndPinnedLetterThunk
} from "../../../../redux/thunks/editor.letter.thunk";
import { useAppDispatch } from "../../../../redux/hooks";

const updatePinnedLetterStatus = (
  pinnedLetters: PinnedLetter[],
  letterId: number,
  isPinned: boolean
): PinnedLetter[] => {
  return pinnedLetters.map((letter) =>
    letter.id === letterId ? { ...letter, isPinned: isPinned } : letter
  );
};

const removePinnedLetter = (
  pinnedLetters: PinnedLetter[],
  letterId: number,
): PinnedLetter[] => {
  return pinnedLetters.filter((letter) => letter.id !== letterId);
};

const newTabNumber = (tabNumber: number): number => {
  return tabNumber - 1;
}

const LetterTabs = () => {
  const dispatch = useAppDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const changeLetterViewMode = useSelector((state: RootState) => state.editorLetter.changeLetterViewMode);
  const stateActiveTab = useSelector((state: RootState) => state.editorLetter.tabNumber);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (statePinnedLetters.length === 0) {
      fetchPinnedLetters().then((pinnedLetters) => {
        dispatch(setEditorPinnedLetters({ pinnedLetters }))
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (statePinnedLetters.length > 0 && !changeLetterViewMode) {
      dispatch(setEditorLetter(
          { letter: { id: statePinnedLetters[0].id, name: statePinnedLetters[0].name, viewMode: statePinnedLetters[0].viewMode }
        }))
      stateActiveTab === null ? setActiveTab(0) : setActiveTab(stateActiveTab);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statePinnedLetters]);

  const handleTabChange = (_: React.SyntheticEvent, newTabValue: number) => {
    dispatch(
      setEditorTabAndPinnedLetterThunk({
        letter: { id: statePinnedLetters[newTabValue].id, name: statePinnedLetters[newTabValue].name, viewMode: statePinnedLetters[newTabValue].viewMode },
        tabNumber: newTabValue,
      })
    )
    setActiveTab(newTabValue);
  }

  const handleCloseTab = async (pinnedLetter: PinnedLetter, tabIndex: number) => {
    try {
      const success = await setLetterPinStatus(pinnedLetter, false);

      if (success) {
        dispatch(
          setEditorTabAndPinnedLettersThunk({
            pinnedLetters: removePinnedLetter(statePinnedLetters, pinnedLetter.id),
            tabNumber: newTabNumber(tabIndex),
          })
        )
      }
    } catch (err) {
      enqueueSnackbar(`Failed to pin letter: ${err}`, { variant: "error" });
    }
  }

  const addToPinned = async (pinnedLetter: PinnedLetter) => {
    try {
      const success = await setLetterPinStatus(pinnedLetter, true);

      if (success) {
        dispatch(setEditorPinnedLetters({pinnedLetters: updatePinnedLetterStatus(statePinnedLetters, pinnedLetter.id, true)}));
      }
    } catch (err) {
      enqueueSnackbar(`Failed to pin letter: ${err}`, { variant: "error" });
    }
  }

  return (
    <>
      <Box sx={{ maxWidth: { xs: 320, sm: 840, lg: 960, xl: 1024 }, bgcolor: 'background.paper' }}>
        <Tabs
          value={ activeTab }
          onChange={ handleTabChange }
          variant="scrollable"
          scrollButtons = "auto"
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
              }
            }}
        >
          { statePinnedLetters.map((pinnedLetter, index) => (
            <Tab
              key={pinnedLetter.id}
              label={
                <Box display="flex" alignItems="center">
                  {pinnedLetter.name}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the tab click event
                      if (pinnedLetter.isPinned) {
                        handleCloseTab(pinnedLetter, index); // Call handleCloseTab if pinned
                      } else {
                        addToPinned(pinnedLetter); // Call addToPinned if not pinned
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

}

export default LetterTabs;
