import { SnippetDialogType} from "../../../services/mappings/autoAnnoMappings"
import React, { useEffect, useRef, useState } from "react"
import {
  Box,
  ButtonGroup,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography
} from "@mui/material"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import {
  clearSnippetState,
  setAutoAnnoLetter, setSnippetEntityInfo, setSnippetReferenceFormActive,
  setSnippetReferences
} from "../../../redux/slices/auto.letter.snippet.slice";
import { useAppDispatch } from "../../../redux/hooks";
import SnippetFormDialog from "./SnippetFormDialog";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { enqueueSnackbar } from "notistack";
import {
  fetchAutoAnnoSnippetEntityData, setAnnoSnippetEntity, setAutoAnnoSnippetStatus,
  updateAnnoLetterContent
} from "../../../services/auto_anno/apiAutoAnno.service";
import {
  autoAnnoReplaceDomNodeContent, markSpanAndScrollToId, referenceTypeForXmlId,
  removeMarkedSpans, removeSnippetEntityFromDom,
  transformLetterXmlForExport
} from "../../../utils/auto_anno/domHandling";
import { AnnoSnippetStatus } from "../../../constants/snack";
import { setAutoAnnoSnippetAndShow } from "../../../redux/thunks/auto.snippet.thunks";
import InfoIcon from "@mui/icons-material/Info";

interface Reference {
  key: string
  name: string
}

interface SnippetReferenceListProps {
  autoAnnoLetterId: number
  references: Reference[]
}

const SnippetReferencesList= (props: SnippetReferenceListProps) => {
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);
  const referenceFormActive = useSelector((state: RootState) => state.autoLetterSnippet.snippetReferences.referenceFormActive);

  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [selectedReferenceKey, setSelectedReferenceKey] = useState<string| null>(null)
  const [buttonsDisabled, setButtonsDisabled] = useState(true)

  const [dialogType, setDialogType] = useState<SnippetDialogType>("ACCEPT")
  const [dialogSubmitFunction, setDialogSubmitFunction] = useState<() => void>(() => {})
  const [dialogOpen, setDialogOpen] = useState(false);


  const dispatch = useAppDispatch()
  const [disabled, setDisabled] = useState(false)

  const handleSelectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value)
  }

  const isMounted = useRef(false);
  useEffect(() => {
    if(!isMounted.current && sharedSnippet) {
      markSpanAndScrollToId(sharedSnippet?.xmlId)
      isMounted.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (referenceFormActive) {
      setButtonsDisabled(false)
    } else {
      setButtonsDisabled(true)
    }
  }, [referenceFormActive]);

  const handleCancel = () => {
    setDisabled(true)
    dispatch(
      setSnippetReferences({
        references: {
          items: [],
          showReferences: false
        }
      })
    )
  }

  const handleOpenDialog = (type: SnippetDialogType, handleClickSubmit: () => void) => {
    setDialogType(type);
    setDialogSubmitFunction(() => handleClickSubmit);
    setDialogOpen(true);
  };

  const handleConfirmElement = () => {
    const xmlLetterNode: Element|null = document.querySelector("#letterXml")
    let xmlContent: string = ""

    if (!sharedSnippet?.id) {
      enqueueSnackbar("no snippet id given", { variant: "error" })
      return }
    if (xmlLetterNode === null) {
      enqueueSnackbar("xmlNodeContent is null", {variant: "error"})
      return }
    if (!selectedReferenceKey) {
      enqueueSnackbar("no reference key selected", {variant: "error"})
      return }

    fetchAutoAnnoSnippetEntityData(props.autoAnnoLetterId, sharedSnippet.id, selectedReferenceKey, sharedSnippet.referenceType).then((data) => {
      autoAnnoReplaceDomNodeContent(sharedSnippet.xmlId, sharedSnippet.referenceType, data)

      xmlContent = transformLetterXmlForExport(removeMarkedSpans(xmlLetterNode).innerHTML)

      updateAnnoLetterContent(
        props.autoAnnoLetterId,
        xmlContent
      ).catch((error) => {
        enqueueSnackbar("error during updating of letter content: " + error, {variant: "error"})
      })

      setAnnoSnippetEntity(props.autoAnnoLetterId, sharedSnippet?.id, sharedSnippet?.referenceTypeChanged, selectedReferenceKey).then(() => {
      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, { variant: "error" })
      })

      setAutoAnnoSnippetStatus(props.autoAnnoLetterId, sharedSnippet?.id, AnnoSnippetStatus.ACCEPTED).then(() => {
        dispatch(setAutoAnnoLetter({letter: {id: props.autoAnnoLetterId, reloadStatus: true, reloadSnippetsStatus: true} }))
        dispatch(clearSnippetState())
        dispatch(setSnippetReferences( { references: { showReferences: false } } ))
      }).catch((error) => {
        enqueueSnackbar("error during setting status of snippet: " + error, { variant: "error" })
      })

    }).then(() => {
      setDisabled(true)
      setDialogOpen(false)
    }).catch((err) => {
      enqueueSnackbar("error during writing ShowLetter: " + err, {variant: "error"})
    })
  }

  const handleRejectSnippet = () => {
    setDisabled(true)
    const xmlLetterNode: Element|null = document.querySelector("#letterXml")

    try {
      if (!sharedSnippet?.id) { throw new Error("no snippet id given") }
      if (xmlLetterNode === null) { throw new Error("xmlNodeContent is null") }

      removeSnippetEntityFromDom(sharedSnippet?.xmlId)
      updateAnnoLetterContent(
        props.autoAnnoLetterId,
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

      setAutoAnnoSnippetStatus(props.autoAnnoLetterId, sharedSnippet?.id, AnnoSnippetStatus.REJECTED).then((response) => {
        if (response) {
          dispatch(setAutoAnnoLetter(
            { letter: {id: props.autoAnnoLetterId, reloadStatus: true, reloadSnippetsStatus: true, contentChanged: true } }
          ))
          dispatch(clearSnippetState())
          dispatch(
            setSnippetReferences({
              references: {
                items: [],
                showReferences: false
              }
            })
          )
        }
      }).catch((error) => {
        enqueueSnackbar("error during setting data: " + error, {variant: "error"})
      })

    } catch (error) {
      enqueueSnackbar("error during setting data: " + error, {variant: "error"})
    }
  }

  const handleAddEntry = () => {
    if (!sharedSnippet) {
      enqueueSnackbar("no shared snippet found", { variant: "error" })
      return
    }
    dispatch(setSnippetReferenceFormActive({ referenceFormActive: false }))

    dispatch(setAutoAnnoSnippetAndShow({
      snippetUpdateParams: {
        snippetId: sharedSnippet.id.toString(),
        xmlId: sharedSnippet.xmlId,
        referenceName: null,
        referenceKey: null,
        referenceType: referenceTypeForXmlId(sharedSnippet.xmlId),
        snippetFormContainer: {form: "EDIT_FORM", buttons: "EDIT_BUTTONS_REFERENCE_LIST"}
      }
    })
    )
  }

  const handleInfoIconClick = (referenceKey: string) => {
    dispatch(setSnippetEntityInfo({ key: referenceKey }))
  }


  return (
    <Paper sx={{ width: 'auto', border: "1px solid #ccc", borderRadius: 2, p: 2 }}>
      <Typography variant="h6" sx={{ textAlign: 'left' }}>
        Wählen Sie einen Eintrag aus. Oder verwerfen Sie die Vorschläge
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ maxHeight: 200, overflowY: "auto", borderBottom: "1px solid #ddd", pb: 1 }}>
        <FormControl
          disabled={ disabled || buttonsDisabled}
          component="fieldset"
          sx={{
            minWidth: '60%', // Set minimum width for the FormControl
            '& fieldset': { // Target the nested fieldset element
             minWidth: '60%', // Ensure the fieldset also has the same minimum width
           },
          }}
        >
          <RadioGroup value={selectedValue} onChange={handleSelectionChange}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', maxHeight: 200 }}>
              {props.references.map((reference) => (
                <Box key={reference.key} sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: '70%' } }}>
                  <IconButton onClick={(event) => handleInfoIconClick(reference.key)} aria-label="info">
                    <InfoIcon color="primary" />
                  </IconButton>
                  <FormControlLabel
                    value={reference.key}
                    control={<Radio />}
                    label={`(${reference.key}) ${reference.name}`}
                    onClick={() => setSelectedReferenceKey(reference.key)}
                    sx={{ flex: 1 }} // Ensures FormControlLabel takes available space
                  />
                </Box>
              ))}
            </Box>
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "right", marginTop: "1%" }}>
        <ButtonGroup size="small" variant="contained">
          <Button color="info" onClick={() => handleCancel()} disabled={ buttonsDisabled }>
            Abbruch
          </Button>
          <Button color="info" onClick={() => handleOpenDialog("REJECT", handleRejectSnippet)} disabled={ buttonsDisabled }>
            Verwerfen
          </Button>
          <Button color="info" onClick={() => handleAddEntry()} disabled={ buttonsDisabled }>
            Eigener Eintrag
          </Button>

          <Button color="primary" onClick={() =>  handleConfirmElement() } disabled={ !selectedValue || buttonsDisabled }>
            Bestätigen
          </Button>
        </ButtonGroup>
      </Box>
      <SnippetFormDialog
        open={dialogOpen}
        dialogType={dialogType}
        handleClickSubmit={dialogSubmitFunction}
        handleClose={() => setDialogOpen(false)}
      />
    </Paper>
  )
}


export default SnippetReferencesList
