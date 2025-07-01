import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch } from '../../../../../redux/hooks';
import { RootState } from '../../../../../redux/redux.store';
import { useSelector } from 'react-redux';
import {
  Badge,
  Box,
  Divider,
  FormControl,
  FormControlLabel, IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityPersonAutocomplete from './EntityPersonAutocomplete';
import { fetchEntityKey } from '../../../../../services/editor/apiLetterRequest.service';
import { EditorConstants } from '../../../../../constants/editor';
import { enqueueSnackbar } from 'notistack';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../redux/thunks/editor.letter.thunk';
import { MarkupPersonData } from '../../../../../services/mappings/editorMappings';
import { EditorContainerProps } from '../../../../pages/editor/ShowEditor';
import { EditorUtils } from '../../../../../utils/editor';
import { setReloadLetterContent } from '../../../../../redux/slices/editor.letter.slice';
import {SnippetEntity} from "../../../../../services/mappings/autoAnnoMappings";

type SelectOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';

interface PersonFormData {
  key: string | null,
  nameFull: string | null
  nameLast: string | null,
  nameFirst: string | null,
}

const EntityPersonContainer = (props: EditorContainerProps) => {
  const dispatch = useAppDispatch();
  const isMounted = useRef(false);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [personFormData, setPersonFormData] = useState<PersonFormData>({
    key: null, nameFull: null, nameLast: null, nameFirst: null,
  });

  const [autocompleteDisabled, setAutocompleteDisabled] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption>(null);

  const [addedPersonEntries, setAddedPersonEntries] = useState<MarkupPersonData[]>([]);

  const [formIsDisabled, setFormIsDisabled] = useState(true);

  const removeExistingEntry = (key: string) => {
    setAddedPersonEntries((prevEntries) => prevEntries.filter((entry: MarkupPersonData) => entry.key !== key));
  }

  const addNewPersonEntry = (entry: MarkupPersonData) => {
    setAddedPersonEntries((prevEntries) => [...prevEntries, entry])
  }

  const buttonAddNewPersonEntry = () => {
    if (personFormData.key !== null) {
      addNewPersonEntry({
        id: null,
        key: personFormData.key,
        nameDisplay: personFormData.nameFull ?? `${personFormData.nameFirst ?? ''} ${personFormData.nameLast ?? ''}`,
        nameLast: null,
        nameFirst: null,
        isNewEntry: false
      })

      setPersonFormData({
        key: null,
        nameFull: null,
        nameLast: null,
        nameFirst: null
      });
    }
  }

  const handleSelectOption = (option: SelectOption) => {
    if (option === 'EXISTING_ENTRY' ) {
      setPersonFormData((prevState) => ({
        ...prevState,
        key: null,
        nameFull: null,
        nameLast: null,
        nameFirst: null
      }))
      setSelectedOption('EXISTING_ENTRY')
      setAutocompleteDisabled(false);
      setFormIsDisabled(true);

    } else if (option === 'NEW_ENTRY' ) {
      fetchEntityKey(EditorConstants.ENTITY_TYPES.PERSON).then((key: string) => {
        setPersonFormData((prevState) => ({
          ...prevState,
          key: key,
          nameFull: null,
          nameLast: null,
          nameFirst: null
        }))

        setSelectedOption('NEW_ENTRY')
        setAutocompleteDisabled(true);
        setFormIsDisabled(false);
      }).catch((error: Error) => {
        enqueueSnackbar(`Could not fetch a valid new key for a Person: "${error.message}", please try again"`, { variant: 'error' });
      })
    }
  }

  useEffect(() => {
    if(!isMounted.current) {
      handleSelectOption('EXISTING_ENTRY')
      isMounted.current = true;
    }
  }, []);

  const allowPersonAdding = useMemo(() => {
    if (selectedOption === 'NEW_ENTRY') {
      return (
        personFormData.nameFirst?.trim() &&
        personFormData.nameLast?.trim() &&
        personFormData.key !== null
      )
    } else if (selectedOption === 'EXISTING_ENTRY') {
      return (
        personFormData.key !== null &&
        (
          personFormData.nameLast?.trim() || personFormData.nameFirst?.trim()
        )
      )
    } else {
      return false;
    }
  }, [selectedOption, personFormData]);

  const handleCancelButtonClick = () => {
    dispatch(setEditorMarkedAndContentLeftRightThunk({
      textIsMarked: false,
      contentLeft: null,
      contentRight: null
    }));
  }

  const handleSubmitButtonClick = async () => {
    try {
      if (props.xmlRef.current === null) { throw new Error('XML reference is null'); }

      const letterElement = props.xmlRef.current.querySelector('#letterXmlContent');

      if (!letterElement) { throw new Error('No letter element found!'); }

      for (const person of addedPersonEntries.filter(entry => entry.isNewEntry)) {
        await EditorUtils.backendService.createEntity(person, EditorConstants.ENTITY_TYPES.PERSON);
      }

      const { xmlId, contentChanged } = EditorUtils.markupGeneration.addPersonMarkup(letterElement, addedPersonEntries);

      if (!contentChanged) {
        enqueueSnackbar('No changes were made to the letter content', { variant: 'info' });
        return;
      }

      const response = await EditorUtils.backendService.patchContent(letterElement.innerHTML, stateEditorLetter.id, EditorConstants.changeTypes.person.ADDED, xmlId)

      if (response) {
        dispatch(setReloadLetterContent( { reloadLetterContent: true } ))
        dispatch(setEditorMarkedAndContentLeftRightThunk({
          textIsMarked: false,
          contentLeft: null,
          contentRight: null
        }));

        const newPeopleCount =  addedPersonEntries.filter(entry => entry.isNewEntry).length

        enqueueSnackbar(`Person markup was added successfully. ${newPeopleCount} new people has been created`, { variant: 'success' });
      }

    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
    }
  }

  return (
    <div>
      <Box component="form" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Person Auszeichnen und Hinzufügen
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            {addedPersonEntries.map((entry) => (
              <Box
                key={entry.key}
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
                  <Typography variant="body2" fontWeight="bold">{entry.key}</Typography>
                  <Typography variant="body2">{entry.nameDisplay}</Typography>
                </Box>
                <IconButton edge="end" onClick={() => removeExistingEntry(entry.key)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={selectedOption} onChange={(e) => handleSelectOption(e.target.value as SelectOption)}>
            <FormControlLabel value="EXISTING_ENTRY" control={<Radio/>} label="Vorhandenen Eintrag" />
            <FormControlLabel disabled={false} value="NEW_ENTRY" control={<Radio/>} label="Neuer Eintrag" />
          </RadioGroup>
        </FormControl>

        <EntityPersonAutocomplete
          isDisabled={ autocompleteDisabled }
          addedPersonEntries={addedPersonEntries}
          afterSelectHandler={ (entry: SnippetEntity) => {
            setPersonFormData((prev) => ({
              ...prev,
              id: entry.entityId,
              key: entry.entityKey,
              nameFull: entry.entityName,
              nameLast: entry.entityLastName ?? null,
              nameFirst: entry.entityFirstName ?? null,
              isNewEntry: selectedOption === 'NEW_ENTRY',
            }))
          }
        }
        />
        <Grid container spacing={2} sx={{ marginTop: 3,  mb: 3 }}>
          <Grid spacing={{ xs: 3, md: 3, lg: 3 }}>
            <TextField
              variant="outlined"
              value={personFormData.key ?? ''}
              fullWidth disabled={ true }
            />
          </Grid>
          <Grid spacing={{ xs: 12, md: 9, lg: 9 }}>
            <TextField
              label="Vorname"
              variant="outlined"
              fullWidth value={personFormData.nameFirst ?? ''}
              disabled={ formIsDisabled }
              onChange={(event) => {
                setPersonFormData((prev) => ({
                  ...prev,
                  nameFirst: event.target.value,
                }))
              }} />
          </Grid>
          <Grid spacing={{ xs: 12, md: 12, lg: 12 }}>
            <TextField
              label="Nachname"
              variant="outlined"
              fullWidth value={personFormData.nameLast ?? ''}
              sx={{ mb: 3 }}
              disabled={ formIsDisabled }
              onChange={(event) => {
                setPersonFormData((prev) => ({
                  ...prev,
                  nameLast: event.target.value
                }))
              }} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={buttonAddNewPersonEntry} disabled={!allowPersonAdding} startIcon={<AddIcon />}>
            Person Hinzufügen
          </Button>

          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={ addedPersonEntries.length === 0 } >
            <Badge badgeContent={addedPersonEntries.length} color="secondary">
              Personen Auszeichnen
            </Badge>
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            Abbrechen
          </Button>
        </Box>
      </Box>
      <div>
        <pre>{JSON.stringify(personFormData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default EntityPersonContainer;
