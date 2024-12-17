import React, { useEffect, useState } from "react";
import { Box, ButtonGroup } from "@mui/material";
import Button from "@mui/material/Button";
import {
  fetchAutoAnnoLetter,
  resetAnnoLetter,
  writeAnnoLetter
} from "../../services/autoAnno.service";
import { Statuses } from "../../utils/entityStatuses";
import { AppDispatch, RootState } from "../../redux/redux.store";
import { useDispatch, useSelector } from "react-redux";
import { clearSnippetState, setAutoAnnoLetter } from "../../redux/slices/auto.letter.snippet.slice";
import { SnippetDialogType } from "../../services/mappings/autoAnnoMappings";
import SnippetFormDialog from "./snippet_form/SnippetFormDialog";
import { Simulate } from "react-dom/test-utils";
import { enqueueSnackbar } from "notistack";
import { Link, useNavigate } from "react-router-dom";

interface AutoAnnoLetterHandleProps {
  autoJobId: number
  autoJobLetterId: number
}

const AutoAnnoLetterHandle = (props: AutoAnnoLetterHandleProps) => {

  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SnippetDialogType>("RESET_LETTER");
  const [dialogSubmitFunction, setDialogSubmitFunction] = useState<() => void>(() => {});

  const dispatch = useDispatch<AppDispatch>();
  const [finalSaveDisabled, setFinalSaveDisabled] = useState(true);

  const reloadLetterStatus= useSelector((state: RootState) =>
    state.autoLetterSnippet.letter?.reloadStatus?? false
  );

  const [resetButtonDisabled, setDisableResetButton]= useState(true);

  const handleOpenDialog = (type: SnippetDialogType, handleClickSubmit: () => void) => {
    setDialogType(type);
    setDialogSubmitFunction(() => handleClickSubmit)
    setDialogOpen(true);
  }

  const handleResetLetter = () => {
    resetAnnoLetter(props.autoJobLetterId).then((data) => {
      dispatch(
        setAutoAnnoLetter(
          { letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true, contentChanged: false} }
        ))

      dispatch(clearSnippetState())
      setDisableResetButton(true)
      setFinalSaveDisabled(true)

      enqueueSnackbar("Der Brief wurde erfolgreich zurückgesetzt", {variant: "success"})
    }).catch((err) => {

      enqueueSnackbar("error during resetting Letter: " + err, {variant: "error"})
    })
    setDialogOpen(false)
  }

  const handleWriteLetter = () => {
    setDialogOpen(false)
    writeAnnoLetter(props.autoJobLetterId).then((data) => {
      dispatch(
        setAutoAnnoLetter(
          {letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true, contentChanged: false}}
        )
      )

      setFinalSaveDisabled(true)
      enqueueSnackbar("Der Brief wurde erfolgreich geschrieben", {variant: "success"})

    }).catch((err) => {
      enqueueSnackbar("error during writing Letter: " + err, {variant: "error"})
    })

    setDialogOpen(false)
  }

  useEffect(() => {
    const getAutoAnnoLetterData = async () => {
      if (reloadLetterStatus) {
        const result = await fetchAutoAnnoLetter(String(props.autoJobLetterId));

        if (result && result.status === Statuses.AutoAnnoLetter.CHECKED_WITH_SUCCESS) {
          setFinalSaveDisabled(false)
        }

        if (result?.content_changed) {
          setDisableResetButton(false)
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
          <Button variant={"contained"} disabled={finalSaveDisabled} color={"success"} onClick={() => handleOpenDialog("WRITE_LETTER", handleWriteLetter)}>Brief in Datei schreiben</Button>
          <Button variant={"contained"} disabled={resetButtonDisabled} color={"warning"} onClick={() => handleOpenDialog("RESET_LETTER", handleResetLetter)}>Zurücksetzen</Button>
          <Button
            component={Link}
            to={"/automatic_annotations/" + props.autoJobId} // Replace '/target-page' with your desired path
            variant="contained"
            color="primary"
          >
            Stand Speichern
          </Button>
        </ButtonGroup>
        <SnippetFormDialog
          open={dialogOpen}
          dialogType={dialogType}
          handleClickSubmit={dialogSubmitFunction}
          handleClose={
            ()=>setDialogOpen(false)}
        />
      </Box>
    </>
  )
}

export default AutoAnnoLetterHandle;