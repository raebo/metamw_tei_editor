import Box from "@mui/material/Box";
import {useAppDispatch} from "../../../../redux/hooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../../redux/redux.store";
import React from "react";
import {setReloadLetterContent} from "../../../../redux/slices/editor.letter.slice";

const StateInfo = () => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)
  
  React.useEffect(() => {
    if (!stateTeiXml) {
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      return;
    }
  }, [stateTeiXml]);
  
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          width: '20vh',
          top: 150,
          left: 16,
          backgroundColor: 'background.paper',
          padding: 1,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        { stateEditorLetter.name }
      </Box>
      <Box
        sx={{
          position: 'fixed',
          width: '20vh',
          top: 210,
          left: 16,
          backgroundColor: 'background.paper',
          padding: 1,
          borderRadius: 1,
          boxShadow: 1,
          maxHeight: '70vh',   // or use e.g. '70vh'
          overflowY: 'auto'
        }}
      >
        { stateTeiXml }
      </Box>
    </>
  )
}

export default StateInfo
