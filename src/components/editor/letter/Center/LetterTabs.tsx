import React, { useEffect, useState } from "react";
import { Tabs, Tab, Box, IconButton } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import { fetchPinnedLetters } from "../../../../services/editor/apiPinnedLettersRequest.service";
import { useDispatch, useSelector } from "react-redux";
import {
  setEditorLetter,
  setEditorPinnedLetters,
} from "../../../../redux/slices/editor.letter.slice";
import { RootState } from "../../../../redux/redux.store";

const LetterTabs = () => {
  const dispatch = useDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (statePinnedLetters.length === 0) {
      fetchPinnedLetters().then((pinnedLetters) => {
        dispatch(setEditorPinnedLetters({ pinnedLetters }))
      })
    }
  }, []);


  useEffect(() => {
    if (statePinnedLetters.length > 0) {
      dispatch(setEditorLetter({ letter: { id: statePinnedLetters[0].id, name: statePinnedLetters[0].name }}))
      setActiveTab(0);
    }
  }, [statePinnedLetters]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    dispatch(setEditorLetter({ letter: { id: statePinnedLetters[newValue].id, name: statePinnedLetters[newValue].name }}))
    setActiveTab(newValue);
  }

  const handleCloseTab = (index: number) => {
  //   if (activeTab === index && index > 0) {
  //     setActiveTab(index - 1);
  //   } else if (activeTab === index && index === 0 && tabLetters.length > 1) {
  //     setActiveTab(0);
  //   } else if (activeTab > index) {
  //     setActiveTab(activeTab - 1);
  //   }
  }

  return (
    <>
      <Tabs value={activeTab} onChange={handleTabChange}>
        {statePinnedLetters.map((doc, index) => (
          <Tab
            key={doc.id}
            label={
              <Box display="flex" alignItems="center">
                {doc.name}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the tab click event
                    handleCloseTab(index);
                  }}
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          />
        ))}
      </Tabs>
    </>
  );

}

export default LetterTabs;
