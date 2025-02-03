import { ButtonGroup, Divider } from "@mui/material";
import Button from "@mui/material/Button";
import SnippetFormDialog from "./SnippetFormDialog";
import React, { useState } from "react";
import { SnippetDialogType } from "../../../services/mappings/autoAnnoMappings";
import {
  autoAnnoReplaceDomNodeContent,
  removeMarkedSpans,
  removeSnippetEntityFromDom,
  transformLetterXmlForExport
} from "../../../utils/auto_anno/domHandling";
import {
  fetchAutoAnnoSnippetEntityData,
  setAutoAnnoSnippetStatus,
  updateAnnoLetterContent
} from "../../../services/auto_anno/apiAutoAnno.service";
import { enqueueSnackbar } from "notistack";
import {
  clearSnippetState,
  setAutoAnnoLetter,
  setAutoSnippetFormContainer
} from "../../../redux/slices/auto.letter.snippet.slice";
import { useAppDispatch } from "../../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";

interface Props {
  autoJobLetterId: number
}

const ShowButtons = (props: Props) => {
  const dispatch = useAppDispatch();
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SnippetDialogType>("ACCEPT");
  const [dialogSubmitFunction, setDialogSubmitFunction] = useState<() => void>(() => {});


  const activateEditMode = () => {
    dispatch(setAutoSnippetFormContainer({ snippetFormContainer: { form: "EDIT_FORM", buttons: "EDIT_BUTTONS", actionButtonDisabled: true} }))
  }

  const handleRejectSnippet = () => {
    const xmlLetterNode: Element|null = document.querySelector("#letterXml")

    try {
      if (!sharedSnippet?.id) { throw new Error("no snippet id given") }
      if (xmlLetterNode === null) { throw new Error("xmlNodeContent is null") }

      removeSnippetEntityFromDom(sharedSnippet?.xmlId)
      updateAnnoLetterContent(
        props.autoJobLetterId,
        transformLetterXmlForExport(
          removeMarkedSpans(
            xmlLetterNode
          ).innerHTML
        )
      ).then(() => {
        enqueueSnackbar("Die Auszeichnung wurde entfernt", { variant: "success" })

      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, {variant: "error"})
      });

      setAutoAnnoSnippetStatus(props.autoJobLetterId, sharedSnippet?.id, "REJECTED").then((response) => {
        if (response) {
          dispatch(setAutoAnnoLetter(
            { letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true, contentChanged: true } }
          ))
          dispatch(clearSnippetState())
        }
      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, {variant: "error"})
      })

    } catch (error) {
      enqueueSnackbar("error during setting data: " + error, {variant: "error"})
    }
    setDialogOpen(false)
  }

  const handleAcceptSnippet = () => {
    const xmlLetterNode: Element|null = document.querySelector("#letterXml")
    let hasError: boolean = false
    let xmlContent: string = ""

    try {
      if (!sharedSnippet?.id) { throw new Error("no snippet id given") }

      if (xmlLetterNode === null) { throw new Error("xmlNodeContent is null") }

      fetchAutoAnnoSnippetEntityData(props.autoJobLetterId, sharedSnippet?.id, sharedSnippet?.referenceKey, sharedSnippet?.referenceType).then((data) => {
        autoAnnoReplaceDomNodeContent(sharedSnippet?.xmlId, sharedSnippet?.referenceType, data)

        // needed this extra line call because otherwise it would not recognize the updated xml
        xmlContent = transformLetterXmlForExport(removeMarkedSpans(xmlLetterNode).innerHTML)

        updateAnnoLetterContent(
          props.autoJobLetterId,
          xmlContent
        ).catch((error) => {
          enqueueSnackbar("error during updating of letter content: " + error, { variant: "error" })
          hasError = true
        })

      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
        hasError = true
      })

      if (hasError) { throw new Error("Updating of xml content failed") }

      // const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      // sleep(2000);

      setAutoAnnoSnippetStatus(props.autoJobLetterId, sharedSnippet?.id, "ACCEPTED").then((response) => {
        dispatch(setAutoAnnoLetter({letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true} }))
        dispatch(clearSnippetState())

        enqueueSnackbar("Die Auszeichnung wurde akzeptiert", { variant: "success" })
      }).catch((error) => {

        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
        hasError = true
      })
      if (hasError) { throw new Error("setting dom Snippet Data") }

    } catch (error) {
      enqueueSnackbar("error during setting data: " + error, { variant: "error" })
    }
    setDialogOpen(false);
  }


  const handleOpenDialog = (type: SnippetDialogType, handleClickSubmit: () => void) => {
    setDialogType(type);
    setDialogSubmitFunction(() => handleClickSubmit);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="autoSnippetFormRow">
        <Divider sx={{ my: 2 }} />

        <div className="form-item form-item--buttons">
          <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
            <Button color="info" onClick={() => activateEditMode()}>Anpassen</Button>
            <Button color="info" onClick={() => handleOpenDialog("REJECT", handleRejectSnippet)}>Löschen</Button>
            <Button color="primary" disabled={sharedSnippet?.referenceKeyChanged ? false : true} onClick={() => handleOpenDialog("ACCEPT", handleAcceptSnippet)}>Übernehmen</Button>
          </ButtonGroup>
        </div>
        <SnippetFormDialog
          open={dialogOpen}
          dialogType={dialogType}
          handleClickSubmit={dialogSubmitFunction}
          handleClose={() => setDialogOpen(false)}
        />
      </div>
    </>
  )
}

export default ShowButtons;
