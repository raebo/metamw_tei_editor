import React, { useEffect, useState } from "react";
import { Tabs, Tab, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import { PinnedLetter } from "../../../../services/mappings/editorMappings";
import { fetchPinnedLetters } from "../../../../services/editor/apiPinnedLettersRequest.service";
import { useDispatch, useSelector } from "react-redux";
import {
  setEditorPinnedLetters,
  setEditorTabLetter,
} from "../../../../redux/slices/editor.letter.slice";
import { RootState } from "../../../../redux/redux.store";

interface letterTabProps {
  letterId: number,
  letterName: string,
  activeTab: number,
}

const LetterTabs = (props: letterTabProps) => {
  const dispatch = useDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const [tabLetters, setTabLetters] = useState<PinnedLetter[]>([]);
  const [activeTab, setActiveTab] = useState<number>(props.activeTab);

  useEffect(() => {
    const loadPinnedLetters = async () => {
      fetchPinnedLetters().then((letters) => {
        dispatch(setEditorPinnedLetters({ pinnedLetters: letters }));
        letters.unshift({id: props.letterId, name: props.letterName});
        setTabLetters(letters)
      })
    }

    if (statePinnedLetters.length === 0) {
      loadPinnedLetters();
    } else {
      let pinnedLetters = [...statePinnedLetters]

      pinnedLetters.unshift({id: props.letterId, name: props.letterName});
      setTabLetters(pinnedLetters);
    }
  }, [])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    dispatch(setEditorTabLetter({ tabLetter: { id: tabLetters[newValue].id, name: tabLetters[newValue].name }, tabNumber: newValue }));
    setActiveTab(newValue);
  };

  const handleCloseTab = (index: number) => {
    setTabLetters((prevDocs) => prevDocs.filter((_, i) => i !== index));

    if (activeTab === index && index > 0) {
      setActiveTab(index - 1);
    } else if (activeTab === index && index === 0 && tabLetters.length > 1) {
      setActiveTab(0);
    } else if (activeTab > index) {
      setActiveTab(activeTab - 1);
    }
  }

  return (
    <>
      <Tabs value={activeTab} onChange={handleTabChange}>
        {tabLetters.map((doc, index) => (
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
      {/*<Box sx={{ p: 2 }}>*/}
      {/*  <div className="letter-view-container">*/}
      {/*    <div className="container-fmbc-letter">*/}
      {/*      <div className="box-1">*/}
      {/*        {tabLetters[activeTab]?.xmlContent ? (*/}
      {/*          <Typography>*/}
      {/*            <pre>{tabLetters[activeTab].xmlContent}</pre>*/}
      {/*          </Typography>*/}
      {/*        ) : (*/}
      {/*          <Typography>Loading...</Typography>*/}
      {/*        )}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*</Box>*/}
    </>
  );

}

export default LetterTabs;
