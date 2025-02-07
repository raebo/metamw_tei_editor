import { ButtonGroup, Divider } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useEffect } from "react";
import { useAppDispatch } from "../../../redux/hooks";
import {
  clearSnippetState,
  setAutoAnnoLetter,
  setAutoSnippetFormContainer
} from "../../../redux/slices/auto.letter.snippet.slice";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { enqueueSnackbar } from "notistack";
import {
  fetchAutoAnnoSnippetEntityData, setAnnoSnippetEntity, setAutoAnnoSnippetStatus,
  updateAnnoLetterContent
} from "../../../services/auto_anno/apiAutoAnno.service";
import {
  autoAnnoReplaceDomNodeContent,
  removeMarkedSpans,
  transformLetterXmlForExport
} from "../../../utils/auto_anno/domHandling";

interface Props {
  autoJobLetterId: number,
  cancelClickedCallback: () => void
}

const EditButtons = (props: Props) => {
  const dispatch = useAppDispatch();

  const [saveDisabled, setSaveDisabled] = React.useState(true);
  const snippetFormContainer = useSelector((state: RootState) => state.autoLetterSnippet.snippetFormContainer)
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);

  useEffect(() => {
    const setButtonDisabled = () => {
      if (snippetFormContainer && snippetFormContainer.actionButtonDisabled !== undefined) {
        setSaveDisabled(snippetFormContainer.actionButtonDisabled)
      }
    }
    setButtonDisabled()
  }, [snippetFormContainer]);

  const saveSnippetReference = () => {
    setSaveDisabled(true)
    const xmlLetterNode: Element|null = document.querySelector("#letterXml")
    let xmlContent: string = ""
    let hasError = false

    try {
      if (!sharedSnippet?.id) {
        enqueueSnackbar("no snippet id given", { variant: "error" })
        return }
      if (xmlLetterNode === null) {
        enqueueSnackbar("xmlNodeContent is null", {variant: "error"})
        return }

      setAnnoSnippetEntity(props.autoJobLetterId, sharedSnippet?.id, sharedSnippet?.referenceTypeChanged, sharedSnippet?.referenceKeyChanged).then(() => {

      }).catch(() => {
        throw new Error("error during setAnnoSnippetEntity")
      })
      fetchAutoAnnoSnippetEntityData(props.autoJobLetterId, sharedSnippet?.id, sharedSnippet?.referenceKeyChanged, sharedSnippet?.referenceTypeChanged).then((data) => {
        autoAnnoReplaceDomNodeContent(sharedSnippet?.xmlId, sharedSnippet?.referenceTypeChanged, data)
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

      if (hasError) {
        enqueueSnackbar("error during setting data: ",  { variant: "error" })
        return }

      setAnnoSnippetEntity(props.autoJobLetterId, sharedSnippet?.id, sharedSnippet?.referenceTypeChanged, sharedSnippet?.referenceKeyChanged).then(() => {
      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
        hasError = true
      })

      if (hasError) {
        enqueueSnackbar("error during setting data: ",  { variant: "error" })
        return }

      setAutoAnnoSnippetStatus(props.autoJobLetterId, sharedSnippet?.id, "ACCEPTED").then(() => {
        dispatch(setAutoAnnoLetter({letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true} }))
        dispatch(clearSnippetState())
      }).catch((error) => {
        enqueueSnackbar("error during setting status of snippet: " + error, { variant: "error" })
      })

    } catch (error) {
      enqueueSnackbar("error during saving of data " + error, { variant: "error" })
    }

    dispatch(setAutoSnippetFormContainer({ snippetFormContainer: { form: "BLANK_FORM", buttons: "BLANK_BUTTONS", actionButtonDisabled: true} }))
  }

  return (
    <>
      <div className="autoSnippetFormRow">
        <Divider sx={{ my: 2 }} />

        <div className="form-item form-item--buttons">
          <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
            <Button disabled={false} onClick={() => props.cancelClickedCallback() }>Abbruch</Button>
            <Button disabled={saveDisabled} onClick={() => saveSnippetReference()}>Speichern</Button>
          </ButtonGroup>
        </div>
      </div>
    </>
  )
}

export default EditButtons;
