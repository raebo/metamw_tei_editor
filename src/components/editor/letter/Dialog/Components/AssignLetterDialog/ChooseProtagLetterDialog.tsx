import { DefaultDialogProps } from '../../EditorFormDialog';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import React, { useEffect, useState } from 'react';
import { EditorUtils } from '@src/utils/editor';
import { enqueueSnackbar } from 'notistack';
import { Badge, Box, Divider, IconButton, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AssignLetterAuthorAutocomplete from './AssignLetterAuthorAutocomplete';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { EditorConstants } from '@src/constants/editor';

interface AssignedLetterData {
  receiver: SnippetEntity | null;
  letter: SnippetEntity | null;
  authors: SnippetEntity[] | null;
}

const ChooseProtagLetterDialog = (props: DefaultDialogProps) => {
  const [letterDialogResetKey, setLetterDialogResetKey] = useState(0);
  const xmlDoc = props.xmlDoc;

  const [assignedLetterFormData, setAssignedLetterFormData] = useState<AssignedLetterData>({
    receiver: null,
    letter: null,
    authors: null,
  });

  const senderType = 'RECEIVER';

  const [addedLetters, setAddedLetters] = useState<AssignedLetterData[]>([]);
  const [letterReceivers, setLetterReceivers] = useState<SnippetEntity[]>([]);
  const [receiverLetters, setReceiverLetters] = useState<SnippetEntity[]>([]);

  const fetchLetterReceivers = async (searchValue: string | null) => {
    try {
      const receivers: SnippetEntity[] = await EditorUtils.backendService.fetchLetterAuthorsSenders(
        searchValue,
        senderType,
      );
      setLetterReceivers(receivers);
    } catch (error) {
      console.error('Error fetching letter receivers:', error);
      enqueueSnackbar('Error fetching receivers ', { variant: 'error' });
    }
  };
  useEffect(() => {
    void fetchLetterReceivers(null);
  }, []);

  const fetchReceiverLetters = async (receiver: SnippetEntity, searchValue: string | null) => {
    try {
      const letters: SnippetEntity[] = await EditorUtils.backendService.fetchAuthorSenderLetters(
        receiver,
        senderType,
        searchValue,
      );
      setReceiverLetters(letters);
    } catch (error) {
      console.error('Error fetching receiver letters:', error);
      enqueueSnackbar('Error fetching letters for receiver', { variant: 'error' });
    }
  };

  const removeExistingEntry = (entry: AssignedLetterData) => {
    setAddedLetters((prevEntries) =>
      prevEntries.filter((e) => e.letter?.entityKey !== entry.letter?.entityKey),
    );
  };

  const buttonAddNewLetter = () => {
    if (assignedLetterFormData.letter) {
      const newEntry: AssignedLetterData = {
        receiver: assignedLetterFormData.receiver,
        letter: assignedLetterFormData.letter,
        authors: assignedLetterFormData.authors,
      };
      setAddedLetters((prevEntries) => [...prevEntries, newEntry]);
      setAssignedLetterFormData({ receiver: null, letter: null, authors: null });
      setLetterReceivers([]);
      setReceiverLetters([]);
      setLetterDialogResetKey((prevKey) => prevKey + 1);
    } else {
      enqueueSnackbar('Bitte wählen Sie einen Empfänger und einen Brief aus', {
        variant: 'warning',
      });
    }
  };

  const isValidFormData = () => {
    return assignedLetterFormData.letter !== null;
  };

  const fetchSenderReceiverLetters = async (searchValue: string | null) => {
    try {
      const letters: SnippetEntity[] = await EditorUtils.backendService.searchSenderReceiverLetters(
        searchValue,
        senderType,
      );
      setReceiverLetters(letters);
    } catch (error) {
      enqueueSnackbar('Error fetching sending receiver letters', { variant: 'error' });
    }
  };

  const receiverSearchChange = async (inputValue: string) => {
    setReceiverLetters([]);
    await fetchLetterReceivers(inputValue);
  };

  const letterSearchChange = async (inputValue: string) => {
    if (assignedLetterFormData.receiver) {
      await fetchReceiverLetters(assignedLetterFormData.receiver, inputValue);
    } else {
      await fetchSenderReceiverLetters(inputValue);
    }
  };

  const setAutocompleteReceiver = async (entry: SnippetEntity | null) => {
    if (entry) {
      setAssignedLetterFormData((prevData) => ({
        ...prevData,
        receiver: entry,
      }));
      await fetchReceiverLetters(entry, null);
    }
  };

  const setAutocompleteLetter = async (entry: SnippetEntity | null) => {
    if (entry) {
      const authors: SnippetEntity[] = await EditorUtils.backendService.fetchLetterAuthors(
        entry.entityKey,
      );

      setAssignedLetterFormData((prevData) => ({
        ...prevData,
        letter: entry,
        authors: authors,
      }));
    }
  };

  const handleSubmitButtonClick = async () => {
    try {
      const markedContent = xmlDoc.querySelectorAll('span.marked')[0];
      if (!markedContent) {
        enqueueSnackbar('No marked content found! Please mark the content you want to annotate.', {
          variant: 'error',
        });
        return;
      }

      EditorUtils.markupGeneration.addProtagLetterMarkup(
        markedContent,
        addedLetters.map((entry) => {
          return {
            letterKey: entry.letter?.entityKey,
            letterName: entry.letter?.entityName,
            authors: entry.authors,
          };
        }) as [{ letterKey: string; letterName: string; authors: SnippetEntity[] }],
      );

      props.onSave(
        xmlDoc,
        EditorConstants.changeTypes.misc.PROTAG_LETTER_ADDED,
        'Briefe wurden dem markierten Text zugewiesen',
        null,
      );
    } catch (error) {
      enqueueSnackbar('Fehler beim Auszeichnen des Briefs', { variant: 'error' });
      props.onClose();
    }
  };

  return (
    <>
      <Box component="form" sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Brief von FMB Auszeichnen
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            {addedLetters.map((entry, _index) => (
              <Box
                key={
                  entry.letter !== null && entry.letter.entityKey !== null
                    ? entry.letter.entityKey
                    : ''
                }
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
                    {entry.letter?.entityKey}
                  </Typography>
                  <Typography variant="body2">{entry.letter?.entityDisplayName}</Typography>
                </Box>
                <IconButton
                  edge="end"
                  onClick={() => removeExistingEntry(entry)}
                  aria-label="delete"
                >
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
              options={letterReceivers}
              onValueChange={(receiver) => setAutocompleteReceiver(receiver)}
              onInputChangeHandler={(inputValue) => receiverSearchChange(inputValue)}
              inputPlaceHolder={'Empfänger auswählen oder suchen'}
            />
          </Grid>
          <Divider sx={{ my: 3 }} />

          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              key={letterDialogResetKey}
              disabled={false}
              options={receiverLetters}
              onValueChange={(letter) => setAutocompleteLetter(letter)}
              onInputChangeHandler={(inputValue) => letterSearchChange(inputValue)}
              inputPlaceHolder={'Brief auswählen oder suchen'}
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={buttonAddNewLetter}
            disabled={!isValidFormData()}
            startIcon={<AddIcon />}
          >
            Brief Hinzufügen
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitButtonClick}
            disabled={addedLetters.length === 0}
          >
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
  );
};

export default ChooseProtagLetterDialog;

// choose letter from autocomplete lettter list with letter title and receiver and incipit
// <title>läßt sich Alles<name type="receiver" key="PSN0000001" style="hidden"
// >Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix
//   (1809-1847)</name><name type="letter" key="fmb-1821-03-22-01"
//                           style="hidden">Felix Mendelssohn Bartholdy an Gustav Adolf Harald
//   Stenzel in Breslau; Berlin, 22. März 1821</name></title>
