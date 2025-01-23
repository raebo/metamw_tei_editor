import React, { useState } from "react";
import {  useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Button from "@mui/material/Button";
import { setAutoAnnoSnippet, setAutoAnnoLetter, clearSnippetState } from "../../redux/slices/auto.letter.snippet.slice";
import { ButtonGroup, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import Paper from "@mui/material/Paper";
import SnippetFormAutocomplete from "./snippet_form/SnippetFormAutocomplete";
import {
  fetchAutoAnnoSnippetEntityData, setAnnoSnippetEntity,
  setAutoAnnoSnippetStatus,
  updateAnnoLetterContent
} from "../../services/autoAnno.service";
import {
  autoAnnoReplaceDomNodeContent, removeMarkedSpans,
  removeSnippetEntityFromDom,
  transformLetterXmlForExport
} from "../../utils/auto_anno/domHandling";
import { enqueueSnackbar } from "notistack";
import SnippetFormDialog from "./snippet_form/SnippetFormDialog";
import { SnippetDialogType } from "../../services/mappings/autoAnnoMappings";
import { useAppDispatch } from "../../redux/hooks";

interface AutoAnnoSnippetFormProps {
  autoJobLetterId: number
}

const AutoAnnoSnippetForm = (props: AutoAnnoSnippetFormProps) => {
  const dispatch = useAppDispatch();

  let menuTypeItems = []
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);
  const sharedSnippetShow = useSelector((state: RootState) => state.autoLetterSnippet.snippetShow);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SnippetDialogType>("ACCEPT");
  const [dialogSubmitFunction, setDialogSubmitFunction] = useState<() => void>(() => {});
  const[hideFormButtons, setHideFormButtons] = useState(true);
  const[formElementsDisabled, setFormElementsDisabled] = useState(true);
  const[autoCompleteSaveDisabled, setAutocompleteSaveDisabled] = useState(true);


  if (sharedSnippet && formElementsDisabled) { setFormElementsDisabled(false) }
  if (!sharedSnippet && !formElementsDisabled) { setFormElementsDisabled(true) }

  const activateEditMode = () => {
    setHideFormButtons(false);
  }

  // Cancel the edit mode and reset the form to the original values
  const cancelEditMode = () => {
    dispatch(setAutoAnnoSnippet(
      {snippet:
          { referenceTypeChanged: sharedSnippet?.referenceType, referenceKeyChanged: sharedSnippet?.referenceKey, referenceNameChanged: sharedSnippet?.referenceName }
      }
     ))
    setHideFormButtons(true);
    setAutocompleteSaveDisabled(true)
  }

  // Save the snippet data - user has choosen a new autocomplete value
  const saveSnippet = () => {
    setFormElementsDisabled(true)

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

      fetchAutoAnnoSnippetEntityData(props.autoJobLetterId, sharedSnippet?.id, sharedSnippet?.referenceKeyChanged, sharedSnippet?.referenceTypeChanged).then((data) => {
        autoAnnoReplaceDomNodeContent(sharedSnippet?.xmlId, sharedSnippet?.referenceTypeChanged, data)

        // needed this extra line call because otherwise it would not recognize the updated xml
        xmlContent = transformLetterXmlForExport(removeMarkedSpans(xmlLetterNode).innerHTML)

        updateAnnoLetterContent(
          props.autoJobLetterId,
          xmlContent
        ).catch((error) => {
          enqueueSnackbar("error during updating of letter content: " + error, { variant: "error" })
          hasError = true
        })


      }).then(() => {
        setFormElementsDisabled(false)
      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
        setFormElementsDisabled(false)
        hasError = true
      });

      if (hasError) {
        enqueueSnackbar("error during setting data: ",  { variant: "error" })
        return }


      setAnnoSnippetEntity(props.autoJobLetterId, sharedSnippet?.id, sharedSnippet?.referenceTypeChanged, sharedSnippet?.referenceKeyChanged).then((response) => {
      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
        setFormElementsDisabled(false)
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
        setFormElementsDisabled(false)
      })

    } catch (error) {
      enqueueSnackbar("error during saving of data " + error, { variant: "error" })
    }
    setHideFormButtons(true)
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
        setHideFormButtons(true)
        enqueueSnackbar("Die Auszeichnung wurde entfernt", { variant: "success" })

      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, {variant: "error"})
        setFormElementsDisabled(false)
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
        setFormElementsDisabled(false)
      })
      if (hasError) { throw new Error("setting dom Snippet Data") }

    } catch (error) {
      enqueueSnackbar("error during setting data: " + error, { variant: "error" })
      setFormElementsDisabled(false)
    }
    setDialogOpen(false);
  }

  const handleOpenDialog = (type: SnippetDialogType, handleClickSubmit: () => void) => {
    setDialogType(type);
    setDialogSubmitFunction(() => handleClickSubmit);
    setDialogOpen(true);
    setAutocompleteSaveDisabled(false)
  };

  // click handler for the autocomplete
  const setAutocompleteResult = (entityKey: string) => {
    dispatch(setAutoAnnoSnippet({snippet: { referenceKeyChanged: entityKey}}))
  }

  // from select box
  const setFormEntityType = (entityType: string) => {
    dispatch(setAutoAnnoSnippet({snippet: { referenceTypeChanged: entityType}}))
  }

  if (sharedSnippet?.referenceType=== "Person") {
    menuTypeItems.push({value: "Person", label: "Person"})
  } else if (sharedSnippet) {
    menuTypeItems.push({value: "Institution", label: "Institution"})
    menuTypeItems.push({value: "Settlement", label: "Ort"})
    menuTypeItems.push({value: "Sight", label: "Sehenswürdigkeit"})
  }


  return (
    <>
      <Paper>
        <div className="autoSnippetFormBox">
            {hideFormButtons ? (
                <div className="autoSnippetFormRow">
                    <div className="form-item form-item--key">
                      <TextField
                        disabled
                        id="outlined-disabled"
                        label=""
                        value={sharedSnippetShow ? sharedSnippetShow.referenceKey : ""}
                        sx={{m: 1, width: '100%'}}
                      />
                    </div>
                    <div className="form-item form-item--type">
                      <TextField
                        disabled
                        id="outlined-disabled"
                        label=""
                        value={sharedSnippetShow ? sharedSnippetShow?.referenceType : sharedSnippet?.referenceType}
                        sx={{m: 1, width: '100%'}}
                      />
                    </div>
                </div>
                  ) : (
              <div className="autoSnippetFormRow">
                <div className="form-item form-item--key">
                  <TextField
                    disabled
                    id="outlined-disabled"
                    label=""
                    value={sharedSnippet? sharedSnippet.referenceKeyChanged : ""}
                    sx={{m: 1, width: '100%'}}
                  />
                </div>
                <div className="form-item form-item--type">
                  <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
                    <InputLabel id="auto-anno-snippet-reference-type">Referenz Type</InputLabel>
                    <Select
                      defaultValue={sharedSnippet?.referenceTypeChanged}
                      disabled={formElementsDisabled}
                      labelId="demo-simple-select-filled-label"
                      id="demo-simple-select-filled"
                      onChange={(event) => setFormEntityType(event.target.value)}
                    >
                      {menuTypeItems.map((item) => (
                        <MenuItem value={item.value}>{item.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
            )}
          {
            hideFormButtons ? (
              <div className="autoSnippetFormRow">
                <div className="form-item form-item--name">
                  <TextField
                    disabled
                    id="outlined-disabled"
                    label=""
                    value={sharedSnippetShow ? sharedSnippetShow.referenceName : ""}
                sx={{m: 1, width: '100%'}}
              />
            </div>
          </div>
        ) : (
          <>
            <SnippetFormAutocomplete
              isDisabled={formElementsDisabled}
              entityType={sharedSnippet?.referenceTypeChanged}
              entityKey={sharedSnippet?.referenceKeyChanged}
              autoJobLetterId={props.autoJobLetterId}
              setFormEntityKey={setAutocompleteResult}
              setSaveButtonDisabled={setAutocompleteSaveDisabled}
            />
          </>
        )}

        <div className="autoSnippetFormRow">
          <div className="form-item form-item--buttons">
            {hideFormButtons ? (
              <>
                <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
                  <Button disabled={formElementsDisabled} onClick={() => handleOpenDialog("ACCEPT", handleAcceptSnippet)}>Übernehmen</Button>
                  <Button disabled={formElementsDisabled} onClick={() => activateEditMode()}>Anpassen</Button>
                  <Button disabled={formElementsDisabled} onClick={() => handleOpenDialog("REJECT", handleRejectSnippet)}>Löschen</Button>
                </ButtonGroup>
                <SnippetFormDialog
                  open={dialogOpen}
                  dialogType={dialogType}
                  handleClickSubmit={dialogSubmitFunction}
                  handleClose={() => setDialogOpen(false)}
                />
              </>
            ) : (
              <div className="form-item form-item--buttons" hidden={hideFormButtons}>
                <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
                  <Button disabled={autoCompleteSaveDisabled} onClick={() => saveSnippet()}>Speichern</Button>
                  <Button disabled={formElementsDisabled} onClick={() => cancelEditMode()}>Abbruch</Button>
                </ButtonGroup>
              </div>
            )}
          </div>
        </div>
      </div>
      </Paper>
    </>
  );
};

export default AutoAnnoSnippetForm;
