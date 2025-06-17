import { DefaultDialogProps } from '../../EditorFormDialog';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import { useAppDispatch } from '../../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../redux/redux.store';
import React, { useEffect, useState } from 'react';
import { EditorUtils } from '../../../../../../utils/editor';
import { enqueueSnackbar } from 'notistack';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../../redux/thunks/editor.letter.thunk';
import { setReloadLetterContent } from '../../../../../../redux/slices/editor.letter.slice';
import { Box, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AssignLetterAuthorAutocomplete from './AssignLetterAuthorAutocomplete';
import Button from '@mui/material/Button';

interface AssignedLetterData {
  receiver: SnippetEntity | null
  letter: SnippetEntity | null
}

const ChooseProtagLetterDialog = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [assignedLetterFormData, setAssignedLetterFormData] = useState<AssignedLetterData>({
    receiver: null,
    letter: null,
  })

  const [letterAutoCmplDisabled, setLetterAutoCmplDisabled] = useState(true);
  const isAuthor = false

  const [letterReceivers, setLetterReceivers] = useState<SnippetEntity[]>([]);
  const [receiverLetters, setReceiverLetters] = useState<SnippetEntity[]>([]);

  const fetchLetterReceivers = async (searchValue : string | null) => {
    try {
      const receivers: SnippetEntity[] = await EditorUtils.backendService.fetchLetterAuthorsSenders(searchValue, isAuthor);
      setLetterReceivers(receivers);
    } catch (error) {
      console.error("Error fetching letter receivers:", error);
      enqueueSnackbar("Error fetching receivers ", { variant:"error" });
    }
  }
  useEffect(() => {
    fetchLetterReceivers(null)
  }, []);

  const fetchReceiverLetters = async (receiver: SnippetEntity, searchValue : string | null) => {
    try {
      const letters: SnippetEntity[] = await EditorUtils.backendService.fetchAuthorSenderLetters(receiver, isAuthor, searchValue);
      setReceiverLetters(letters);
    } catch (error) {
      console.error("Error fetching receiver letters:", error);
      enqueueSnackbar("Error fetching letters for receiver", { variant:"error" });
    }
  }

  const receiverSearchChange = async (inputValue: string) => {
    setReceiverLetters([])
    fetchLetterReceivers(inputValue);
  }

  const letterSearchChange = async (inputValue: string) => {
    if (assignedLetterFormData.receiver) {
      await fetchReceiverLetters(assignedLetterFormData.receiver, inputValue);
    } else {
      enqueueSnackbar("Please select an receiver first", { variant: "warning" });
    }
  }

  const setAutocompleteReceiver = async (entry: SnippetEntity | null) => {
    if (entry) {
      setAssignedLetterFormData((prevData) => ({
          ...prevData,
          receiver: entry
        })
      )
      await fetchReceiverLetters(entry, null)
      setLetterAutoCmplDisabled(false)
    }
  }

  const setAutocompleteLetter = async (entry: SnippetEntity | null) => {
    if (entry) {
      setAssignedLetterFormData((prevData) => ({
          ...prevData,
          letter: entry
        })
      )
    }
  }

  const handleCancelButtonClick = () => {
    dispatch(setEditorMarkedAndContentLeftRightThunk({
      textIsMarked: false,
      contentLeft: null,
      contentRight: null
    }));
  }

  const handleSubmitButtonClick = async () => {
    if (assignedLetterFormData.receiver && assignedLetterFormData.letter) {
      if (props.xmlRef.current === null) {
        throw new Error('XML reference is null');
      }     try {

        const letterElement = props.xmlRef.current.querySelector('#letterXmlContent');
        if (!letterElement) { throw new Error('No letter element found!'); }

        if (stateEditorLetter.id === null || stateEditorLetter.name === null) {
          throw new Error('No letter id or name found!');
        }

        const letter = assignedLetterFormData.letter;

        await EditorUtils.markupGeneration.addProtagLetterMarkup(letterElement,
          { id: stateEditorLetter.id!, name: stateEditorLetter.name },
          { letterKey: letter.entityKey, letterName: letter.entityName
          })

        enqueueSnackbar('Letter markup was added successfully', { variant: 'success' });

      } catch (error) {
        console.error("Error submitting letter:", error);
        enqueueSnackbar("Fehler beim Auszeichnen des Briefs", { variant: "error" });
      } finally {
        dispatch(setReloadLetterContent( { reloadLetterContent: true } ))
        dispatch(setEditorMarkedAndContentLeftRightThunk({
          textIsMarked: false,
          contentLeft: null,
          contentRight: null
        }));
        props.onClose();
      }
    } else {
      enqueueSnackbar("Bitte wählen Sie einen Empfänger und einen Brief aus", { variant: "warning" });
    }
  }

  return (
    <>
      <Box component="form" sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Brief von FMB Auszeichnen
        </Typography>
        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              disabled={false}
              options={ letterReceivers }
              onValueChange={(receiver) => setAutocompleteReceiver(receiver)}
              onInputChangeHandler={(inputValue) => receiverSearchChange(inputValue) }
              inputPlaceHolder={ "Empfänger auswählen oder suchen" }
            />
          </Grid>
          <Divider sx={{ my: 3 }} />

          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              disabled={ letterAutoCmplDisabled }
              options={ receiverLetters }
              onValueChange={ (letter) => setAutocompleteLetter(letter) }
              onInputChangeHandler={ (inputValue) => letterSearchChange(inputValue) }
              inputPlaceHolder={ "Brief auswählen oder suchen" }
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={ assignedLetterFormData.receiver === null || assignedLetterFormData.letter === null } >
            Brief Auszeichnen
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            Abbrechen
          </Button>
        </Box>
      </Box>
      <div>
        <pre>{JSON.stringify(assignedLetterFormData, null, 2)}</pre>
      </div>
    </>
  )
}

export default ChooseProtagLetterDialog;

// choose letter from autocomplete lettter list with letter title and receiver and incipit
// <title>läßt sich Alles<name type="receiver" key="PSN0000001" style="hidden"
// >Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix
//   (1809-1847)</name><name type="letter" key="fmb-1821-03-22-01"
//                           style="hidden">Felix Mendelssohn Bartholdy an Gustav Adolf Harald
//   Stenzel in Breslau; Berlin, 22. März 1821</name></title>
