import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Button from "@mui/material/Button";
import { setAutoAnnoSnippet, setAutoAnnoLetter } from "../../redux/slices/auto.letter.snippet.slice";
import { Box, ButtonGroup, FormControl, InputLabel, MenuItem, Select, styled, TextField } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import SnippetFormAutocomplete from "./snippet_form/SnippetFormAutocomplete";
import {
  fetchAutoAnnoSnippetEntityData,
  setAutoAnnoSnippetStatus,
  updateAnnoLetterContent
} from "../../services/autoAnno.service";
import {
  autoAnnoReplaceDomNodeContent,
  removeSnippetEntityFromDom,
  transformLetterXmlForExport
} from "../../utils/auto_anno/domHandling";
import { enqueueSnackbar } from "notistack";
import SnippetFormDialog from "./snippet_form/SnippetFormDialog";
import { SnippetDialogType } from "../../services/mappings/autoAnnoMappings";

interface AutoAnnoSnippetFormProps {
  autoJobLetterId: number
}

const AutoAnnoSnippetForm = (props: AutoAnnoSnippetFormProps) => {
  const dispatch = useDispatch();
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);


  const formSubmit = () => {
    dispatch(setAutoAnnoLetter({ letter: { id: props.autoJobLetterId, reloadStatus: true } } ))
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SnippetDialogType>("ACCEPT");
  const [dialogSubmitFunction, setDialogSubmitFunction] = useState<() => void>(() => {});
  const [formEntityType, setFormEntityType] = useState(sharedSnippet?.referenceType ? sharedSnippet?.referenceType : "");
  const[formEntityKey, setFormEntityKey] = useState(sharedSnippet?.referenceKey ? sharedSnippet?.referenceKey : "");
  const[formFieldReferenceName, setFormFieldReferenceName] = useState(sharedSnippet?.referenceName ? sharedSnippet?.referenceName : "");
  const[hideFormButtons, setHideFormButtons] = useState(true);
  const[formElementsDisabled, setFormElementsDisabled] = useState(false);

  let childReferenceKey = formEntityKey
  let childReferenceType = formEntityType
  let menuTypeItems = []

  if (sharedSnippet && formElementsDisabled) { setFormElementsDisabled(false) }
  if (!sharedSnippet && !formElementsDisabled) { setFormElementsDisabled(true) }

  const activateEditMode = () => {
    setHideFormButtons(false);
    setFormEntityType(sharedSnippet?.referenceType ? sharedSnippet?.referenceType : "");
    setFormEntityKey("")
  }
  const cancelEditMode = () => {
    setHideFormButtons(true);
    setFormEntityKey(sharedSnippet?.referenceKey ? sharedSnippet?.referenceKey : "");
    setFormEntityType(sharedSnippet?.referenceType ? sharedSnippet?.referenceType : "");
  }

  const saveSnippet = () => {
    setFormElementsDisabled(true)

    const xmlLetterNode: Element|null = document.querySelector("#letterXml")

    try {
      if (!sharedSnippet?.id) { throw new Error("no snippet id given") }
      if (xmlLetterNode === null) { throw new Error("xmlNodeContent is null") }

      fetchAutoAnnoSnippetEntityData(props.autoJobLetterId, sharedSnippet?.id, childReferenceKey, childReferenceType).then((data) => {
        autoAnnoReplaceDomNodeContent(sharedSnippet?.xmlId, childReferenceKey, childReferenceType, data)

        setFormEntityType(data.entityType)
        setFormEntityKey(data.entityKey)
        setFormFieldReferenceName(data.entityDisplayName)
      }).then(() => {
        setFormElementsDisabled(false)
      }).catch((error) => {
          enqueueSnackbar("error during setting data: " + error, { variant: "error" })
          setFormElementsDisabled(false)
      });

      updateAnnoLetterContent(
        props.autoJobLetterId,
        transformLetterXmlForExport(xmlLetterNode.innerHTML)
      ).then(() => {

      }).catch((error) => {
        enqueueSnackbar("error during updating of letter content: " + error, { variant: "error" })
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

      setAutoAnnoSnippetStatus(props.autoJobLetterId, sharedSnippet?.id, "REJECTED").then((response) => {
        if (response) {
          dispatch(setAutoAnnoSnippet({ snippet: { ...sharedSnippet, status: "REJECTED" } }))
        }
        removeSnippetEntityFromDom(sharedSnippet?.xmlId)

      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, {variant: "error"})
      })

      updateAnnoLetterContent(
        props.autoJobLetterId,
        transformLetterXmlForExport(xmlLetterNode.innerHTML)
      ).then(() => {
        dispatch(setAutoAnnoLetter({letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true} }))
        enqueueSnackbar("Die Auszeichnung wurde entfernt", { variant: "success" })
      }).then(() => {

        })
        .catch((error) => {
          enqueueSnackbar("error during setting data: " + error, {variant: "error"})
          setFormElementsDisabled(false)

        });
    } catch (error) {
      enqueueSnackbar("error during setting data: " + error, {variant: "error"})
    }
    setDialogOpen(false)
  }

  const handleAcceptSnippet = () => {
    try {
      if (!sharedSnippet?.id) { throw new Error("no snippet id given") }

      setAutoAnnoSnippetStatus(props.autoJobLetterId, sharedSnippet?.id, "ACCEPTED").then((response) => {
        if (response) {
          dispatch(setAutoAnnoSnippet({ snippet: { ...sharedSnippet, status: "ACCEPTED" } }))
        }
      }).then(() => {
        dispatch(setAutoAnnoLetter({letter: {id: props.autoJobLetterId, reloadStatus: true, reloadSnippetsStatus: true} }))
        enqueueSnackbar("Die Auszeichnung wurde akzeptiert", { variant: "success" })

      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
        setFormElementsDisabled(false)
      })

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
  };

  if (childReferenceKey.length === 0 && sharedSnippet?.referenceKey) {
    childReferenceKey = sharedSnippet?.referenceKey
  } else if (!childReferenceKey) {
    childReferenceKey = ""
  }

  if (childReferenceType.length === 0 && sharedSnippet?.referenceType) {
    childReferenceType = sharedSnippet?.referenceType
  } else if (!childReferenceType) {
    childReferenceType = ""
  }

  if (childReferenceType === "Person") {
    menuTypeItems.push({value: "Person", label: "Person"})
  } else {
    menuTypeItems.push({value: "Institution", label: "Institution"})
    menuTypeItems.push({value: "Settlement", label: "Ort"})
    menuTypeItems.push({value: "sight", label: "Sehenswürdigkeit"})
  }


  return (
    <>
      <Paper>
        <div className="autoSnippetFormBox">
          <div className="autoSnippetFormRow">
            <div className="form-item form-item--key">
              <TextField
                disabled
                id="outlined-disabled"
                label=""
                value={!formEntityKey ? sharedSnippet?.referenceKey : formEntityKey}
                sx={{m: 1, width: '100%'}}
              />
            </div>
            {hideFormButtons ? (
              <div className="form-item form-item--type">
                <TextField
                  disabled
                  id="outlined-disabled"
                  label=""
                  value={!formEntityType ? sharedSnippet?.referenceType : formEntityType}
                  sx={{m: 1, width: '100%'}}
                />
              </div>
              ) : (
                <div className="form-item form-item--type">
                  <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
                    <InputLabel id="auto-anno-snippet-reference-type">Referenz Type</InputLabel>
                  <Select
                    defaultValue={childReferenceType}
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
              )}
          </div>
        { hideFormButtons ? (
          <div className="autoSnippetFormRow">
            <div className="form-item form-item--name">
              <TextField
                disabled
                id="outlined-disabled"
                label=""
                value={!formFieldReferenceName ? sharedSnippet?.referenceName : formFieldReferenceName}
                sx={{m: 1, width: '100%'}}
              />
            </div>
          </div>
        ) : (
          <>
            <SnippetFormAutocomplete
              isDisabled={formElementsDisabled}
              entityType={childReferenceType}
              entityKey={childReferenceKey}
              autoJobLetterId={props.autoJobLetterId}
              setFormEntityKey={setFormEntityKey}
              setFormEntityType={setFormEntityType}/>
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
                  <Button disabled={formElementsDisabled} onClick={() => saveSnippet()}>Speichern</Button>
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