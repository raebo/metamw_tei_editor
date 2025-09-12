import {DefaultDialogProps} from '../../EditorFormDialog';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React, { useEffect, useState } from 'react';
import { EditorUtils } from '../../../../../../utils/editor';
import Grid from '@mui/material/Grid';
import { enqueueSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import AssignLetterAuthorAutocomplete from './AssignLetterAuthorAutocomplete';
import {Badge, Box, Divider, IconButton, Stack, Typography} from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {EditorConstants} from "../../../../../../constants/editor";

interface AssignedLetterData {
  writer: SnippetEntity | null
  letter: SnippetEntity | null
  authors: SnippetEntity[]
}

const ChooseGbLetterDialog = (props: DefaultDialogProps) => {
  const [letterDialogResetKey, setLetterDialogResetKey] = useState(0);
	const xmlDoc = props.xmlDoc

  const [assignedLetterFormData, setAssignedLetterFormData] = useState<AssignedLetterData>({
    writer: null,
    letter: null,
    authors: []
  })

  const senderType = 'WRITER'
  const [addedLetters, setAddedLetters] = useState<AssignedLetterData[]>([]);
  const [letterAuthors, setLetterAuthors] = useState<SnippetEntity[]>([]);
  const [writerLetters, setAuthorLetters] = useState<SnippetEntity[]>([]);

  const fetchLetterAuthors = async (searchValue : string | null) => {
    try {
      const writers: SnippetEntity[] = await EditorUtils.backendService.fetchLetterAuthorsSenders(searchValue, senderType);
      setLetterAuthors(writers);
    } catch (error) {
      console.error("Error fetching letter writers:", error);
      enqueueSnackbar("Error fetching writers ", { variant:"error" });
    }
  }

  useEffect(() => {
    void fetchLetterAuthors(null)
  }, []);

  const removeExistingEntry = (entry: AssignedLetterData) => {
    setAddedLetters((prevEntries) => prevEntries.filter((e) => e.letter?.entityKey !== entry.letter?.entityKey));
  }

  const isValidFormData = () => {
    return assignedLetterFormData.letter !== null;
  }

  const buttonAddNewLetter = () => {
    if (assignedLetterFormData.letter) {
      const newEntry: AssignedLetterData = {
        writer: assignedLetterFormData.writer,
        letter: assignedLetterFormData.letter,
        authors: assignedLetterFormData.authors
      };
      setAddedLetters((prevEntries) => [...prevEntries, newEntry]);
      setAssignedLetterFormData({ writer: null, letter: null, authors: [] });
      setLetterAuthors([])
      setAuthorLetters([])
      setLetterDialogResetKey((prevKey) => prevKey + 1);
    } else {
      enqueueSnackbar("Bitte wählen Sie einen Autor und einen Brief aus", { variant: "warning" });
    }
  }

  const fetchAuthorLetters = async (writer: SnippetEntity, searchValue : string | null) => {
    try {
      const letters: SnippetEntity[] = await EditorUtils.backendService.fetchAuthorSenderLetters(writer, senderType, searchValue);
      setAuthorLetters(letters);
    } catch (error) {
      console.error("Error fetching writer letters:", error);
      enqueueSnackbar("Error fetching letters for writer", { variant:"error" });
    }
  }

  const fetchSenderReceiverLetters = async (searchValue: string | null) => {
    try {
      const letters: SnippetEntity[] = await EditorUtils.backendService.searchSenderReceiverLetters(searchValue, senderType);
      setAuthorLetters(letters);
    } catch (error) {
      enqueueSnackbar("Error fetching sending receiver letters", { variant:"error" });
    }
  }


  const writerSearchChange = async (inputValue: string) => {
    setAuthorLetters([])
    if (assignedLetterFormData.writer) {
      await fetchLetterAuthors(inputValue);
    }
  }

  const letterSearchChange = async (inputValue: string) => {
    if (assignedLetterFormData.writer) {
      await fetchAuthorLetters(assignedLetterFormData.writer, inputValue);
    } else {
      await fetchSenderReceiverLetters(inputValue)
    }
  }

  const setAutocompleteAuthor = async (entry: SnippetEntity | null) => {
    if (entry) {
      setAssignedLetterFormData((prevData) => ({
        ...prevData,
        writer: entry
      })
      )
      await fetchAuthorLetters(entry, null)
    }
  }

  const setAutocompleteLetter = async (entry: SnippetEntity | null) => {
    if (entry) {
      const authors: SnippetEntity[] = await EditorUtils.backendService.fetchLetterAuthors(entry.entityKey)
      setAssignedLetterFormData((prevData) => ({
          ...prevData,
          letter: entry,
          authors: authors
        })
      )
    }
  }

  const handleSubmitButtonClick = async () => {
		try {
			const markedContent = xmlDoc.querySelectorAll('span.marked')[0];
			if (!markedContent) {
				enqueueSnackbar('No marked content found! Please mark the content you want to annotate.', { variant: "error" } );
				return
			}

      EditorUtils.markupGeneration.addGbLetterMarkup(
				markedContent,
        addedLetters.map((entry) => {
          return { letterKey: entry.letter?.entityKey, letterName: entry.letter?.entityName, authors: entry.authors }
        } ) as [{ letterKey: string, letterName: string, authors: SnippetEntity[] }],
      )

			props.onSave(xmlDoc, EditorConstants.changeTypes.misc.GB_LETTER_ADDED, "Briefe wurden dem markierten Text zugewiesen", null)
    } catch (error) {
      enqueueSnackbar("Fehler beim Auszeichnen des Briefs", { variant: "error" });
			props.onClose();
    }
  }

  return (
    <>
      <Box component="form" sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Brief an FMB Auszeichnen
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            { addedLetters.map((entry, index) => (
              <Box
                key={(entry.letter !== null && entry.letter.entityKey !== null) ? entry.letter.entityKey: ''}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    { entry.letter?.entityKey }
                  </Typography>
                  <Typography variant="body2">
                    { entry.letter?.entityDisplayName }
                  </Typography>
                </Box>
                <IconButton edge="end" onClick={() => removeExistingEntry(entry)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>

        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              key={letterDialogResetKey}
              disabled={false}
              options={ letterAuthors }
              onValueChange={(writer) => setAutocompleteAuthor(writer)}
              onInputChangeHandler={(inputValue) => writerSearchChange(inputValue) }
              inputPlaceHolder={ "Autor auswählen oder suchen" }
            />
          </Grid>
          <Divider sx={{ my: 3 }} />

          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              key={letterDialogResetKey}
              disabled={ false }
              options={ writerLetters }
              onValueChange={ (letter) => setAutocompleteLetter(letter) }
              onInputChangeHandler={ (inputValue) => letterSearchChange(inputValue) }
              inputPlaceHolder={ "Brief auswählen oder suchen" }
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={buttonAddNewLetter} disabled={!isValidFormData()} startIcon={<AddIcon />}>
            Brief Hinzufügen
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={ addedLetters.length === null } >
            <Badge badgeContent={addedLetters.length} color="secondary">
              Brief Auszeichnen
            </Badge>
          </Button>
        </Box>
      </Box>
      {/*<div>*/}
      {/*  <pre>{JSON.stringify(assignedLetterFormData, null, 2)}</pre>*/}
      {/*</div>*/}
    </>
  )
}

export default ChooseGbLetterDialog;
