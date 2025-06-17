import { DefaultDialogProps } from '../../EditorFormDialog';
import { useAppDispatch } from '../../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../redux/redux.store';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React, { useEffect, useState } from 'react';
import { EditorUtils } from '../../../../../../utils/editor';
import Grid from '@mui/material/Grid';
import { enqueueSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../../redux/thunks/editor.letter.thunk';
import { setReloadLetterContent } from '../../../../../../redux/slices/editor.letter.slice';
import AssignLetterAuthorAutocomplete from './AssignLetterAuthorAutocomplete';
import { Box, Divider, Typography } from '@mui/material';

interface AssignedLetterData {
  author: SnippetEntity | null
  letter: SnippetEntity | null
}

const ChooseGbLetterDialog = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [assignedLetterFormData, setAssignedLetterFormData] = useState<AssignedLetterData>({
    author: null,
    letter: null,
  })

  const [letterAutoCmplDisabled, setLetterAutoCmplDisabled] = useState(true);
  const isSender = true

  const [letterAuthors, setLetterAuthors] = useState<SnippetEntity[]>([]);
  const [authorLetters, setAuthorLetters] = useState<SnippetEntity[]>([]);

  const fetchLetterAuthors = async (searchValue : string | null) => {
    try {
      const authors: SnippetEntity[] = await EditorUtils.backendService.fetchLetterAuthorsSenders(searchValue, isSender);
      setLetterAuthors(authors);
    } catch (error) {
      console.error("Error fetching letter authors:", error);
      enqueueSnackbar("Error fetching authors ", { variant:"error" });
    }
  }
  useEffect(() => {
    fetchLetterAuthors(null)
  }, []);

  const fetchAuthorLetters = async (author: SnippetEntity, searchValue : string | null) => {
    try {
      const letters: SnippetEntity[] = await EditorUtils.backendService.fetchAuthorSenderLetters(author, isSender, searchValue);
      setAuthorLetters(letters);
    } catch (error) {
      console.error("Error fetching author letters:", error);
      enqueueSnackbar("Error fetching letters for author", { variant:"error" });
    }
  }

  const authorSearchChange = async (inputValue: string) => {
    setAuthorLetters([])
    fetchLetterAuthors(inputValue);
  }

  const letterSearchChange = async (inputValue: string) => {
    if (assignedLetterFormData.author) {
      await fetchAuthorLetters(assignedLetterFormData.author, inputValue);
    } else {
      enqueueSnackbar("Please select an author first", { variant: "warning" });
    }
  }

  const setAutocompleteAuthor = async (entry: SnippetEntity | null) => {
    if (entry) {
      setAssignedLetterFormData((prevData) => ({
        ...prevData,
        author: entry
      })
      )
      await fetchAuthorLetters(entry, null)
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
    if (assignedLetterFormData.author && assignedLetterFormData.letter) {
      if (props.xmlRef.current === null) {
        throw new Error('XML reference is null');
      }     try {

        const letterElement = props.xmlRef.current.querySelector('#letterXmlContent');
        if (!letterElement) { throw new Error('No letter element found!'); }

        if (stateEditorLetter.id === null || stateEditorLetter.name === null) {
          throw new Error('No letter id or name found!');
        }

        const author = assignedLetterFormData.author;
        const letter = assignedLetterFormData.letter;

        await EditorUtils.markupGeneration.addGbLetterMarkup(letterElement,
          { id: stateEditorLetter.id!, name: stateEditorLetter.name },
          {
          authorKey: author.entityKey,
          authorName: author.entityDisplayName,
          letterKey: letter.entityKey,
          letterName: letter.entityName
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
      enqueueSnackbar("Bitte wählen Sie einen Autor und einen Brief aus", { variant: "warning" });
    }
  }

  return (
    <>
      <Box component="form" sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Brief an FMB Auszeichnen
        </Typography>
        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              disabled={false}
              options={ letterAuthors }
              onValueChange={(author) => setAutocompleteAuthor(author)}
              onInputChangeHandler={(inputValue) => authorSearchChange(inputValue) }
              inputPlaceHolder={ "Autor auswählen oder suchen" }
            />
          </Grid>
          <Divider sx={{ my: 3 }} />

          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <AssignLetterAuthorAutocomplete
              disabled={ letterAutoCmplDisabled }
              options={ authorLetters }
              onValueChange={ (letter) => setAutocompleteLetter(letter) }
              onInputChangeHandler={ (inputValue) => letterSearchChange(inputValue) }
              inputPlaceHolder={ "Brief auswählen oder suchen" }
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={ assignedLetterFormData.author === null || assignedLetterFormData.letter === null } >
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

export default ChooseGbLetterDialog;
