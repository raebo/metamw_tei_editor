import React, { useEffect, useState } from "react";
import { Box, ButtonGroup } from "@mui/material";
import Button from "@mui/material/Button";
import { fetchAutoAnnoLetter, fetchAutoAnnoLetterSnippets } from "../../services/autoAnno.service";
import { Statuses } from "../../utils/entityStatuses";
import { AppDispatch, RootState } from "../../redux/redux.store";
import { useDispatch, useSelector } from "react-redux";
import { setAutoAnnoLetter } from "../../redux/slices/auto.letter.snippet.slice";

interface AutoAnnoLetterHandleProps {
  autoJobLetterId: number
}

const AutoAnnoLetterHandle = (props: AutoAnnoLetterHandleProps) => {

  const dispatch = useDispatch<AppDispatch>();
  const [finalSaveDisabled, setFinalSaveDisabled] = useState(true);

  const reloadLetterStatus= useSelector((state: RootState) =>
    state.autoLetterSnippet.letter?.reloadStatus?? false
  );

  useEffect(() => {
    const getAutoAnnoLetterData = async () => {
      if (reloadLetterStatus) {
        const result = await fetchAutoAnnoLetter(String(props.autoJobLetterId));

        console.log("+ + + + + + + + + + + + +  + + reload letter status", result)

        if (result && result.status === Statuses.AutoAnnoLetter.CHECKED_WITH_SUCCESS) {
          setFinalSaveDisabled(false)
        }
        dispatch(setAutoAnnoLetter({letter: {id: props.autoJobLetterId, reloadStatus: false} }))
      }
    }
    getAutoAnnoLetterData()

  }, [reloadLetterStatus]);


  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          '& > *': {
            m: 1,
          },
        }}
      >
        <ButtonGroup variant="outlined" aria-label="Basic button group">
          <Button variant={"contained"} disabled={finalSaveDisabled} color={"success"}>Inhalt in Datei schreiben</Button>
          <Button variant={"text"} color={"primary"}>Stand Speichern</Button>
          <Button variant={"text"} color={"warning"}>Zurücksetzen</Button>
        </ButtonGroup>
      </Box>
    </>
  )
}

export default AutoAnnoLetterHandle;