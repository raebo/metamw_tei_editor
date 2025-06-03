import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/redux.store';
import { MarkupCreationData } from '../../../../../services/mappings/editorMappings';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../redux/thunks/editor.letter.thunk';
import {
  Badge,
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack, TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EntityAuthorAutocomplete from './EntityAuthorAutocomplete';
import { fetchEntityKey } from '../../../../../services/editor/apiLetterRequest.service';
import { enqueueSnackbar } from 'notistack';
import { EntityType } from '../../../../../constants/editor';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import EntityExistingCreation from './EntityExistingCreation';
import { backendService } from '../../../../../utils/editor/backendService';
import EntityNewCreation from './EntityNewCreation';
import { EditorContainerProps } from '../../../../pages/editor/ShowEditor';
import { setReloadLetterContent } from '../../../../../redux/slices/editor.letter.slice';
import { EditorUtils } from '../../../../../utils/editor';


type SelectActionAuthorOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';
type SelectActionCreationOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';

export interface FormAuthorData {
  key: null | string
  firstName: null | string
  lastName: null | string
  isNewEntry: boolean
}

export interface FormCreationData {
  key: null | string
  name: null | string
  kind: null | string
  isNewEntry: boolean
}

const EntityCreationContainer = (props: EditorContainerProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [addedCreationEntries, setAddedCreationEntries] = useState<MarkupCreationData[]>([]);

  const [creationFormData, setCreationFormData] = React.useState<FormCreationData>({
    key: null,
    name: null,
    kind: null,
    isNewEntry: false
  })

  const [authorFormData, setAuthorFormData] = React.useState<FormAuthorData>({
    key: null,
    firstName: null,
    lastName: null,
    isNewEntry: false
  })
  const [authorFormDisabled, setAuthorFormDisabled] = useState(true);

  const [selectedAuthorOption, setSelectedAuthorOption] = useState<SelectActionAuthorOption>("EXISTING_ENTRY");
  const [selectedCreationOption, setSelectedCreationOption] = useState<SelectActionCreationOption>(null);

  const [authorAutocompleteDisabled, setAuthorAutocompleteDisabled] = useState(false);
  const [authorCreations, setAuthorCreations] = useState<SnippetEntity[]>([]); //creations of the selected author

  const [selectCreationOptionDisabled, setSelectCreationOptionDisabled] = useState<boolean>(true);
  const [creationKinds, setCreationKinds] = useState<string[]>([]);

  const [resetCreationCmp, setResetCreationCmp] = useState<number>(0); // used to reset the creation form when a new author is selected


  useEffect(() => {
    backendService.fetchCreationKinds()
      .then((result) => {
        setCreationKinds(result);
      })
      .catch(error => {
        enqueueSnackbar(`Could not fetch creation kinds: "${error.message}", please try again`, {
          variant: 'error',
        });
      });
  }, []); // empty array = run once on mount

  const handleAuthorOptionChange = (option: SelectActionAuthorOption) => {
    resetAuthorFormData()
    resetCreationFormData()
    setSelectCreationOptionDisabled(true)
    setSelectedAuthorOption(option);

    if (option === 'EXISTING_ENTRY') {
      setSelectedCreationOption('EXISTING_ENTRY')
      setAuthorFormDisabled(true);
      setAuthorAutocompleteDisabled(false)
    }
    if (option === 'NEW_ENTRY') {
      fetchAndSetNewAuthorKey()
      fetchAndSetNewCreationKey()
      setAuthorFormDisabled(false);
      setAuthorAutocompleteDisabled(true)
      setAuthorCreations([])
      setSelectedCreationOption('NEW_ENTRY')
    }
  }

  const handleCreationOptionChange = (option: SelectActionCreationOption) => {
    resetCreationFormData()
    setSelectedCreationOption(option);

    if (option === 'EXISTING_ENTRY') {
    }
    if (option === 'NEW_ENTRY') {
      fetchAndSetNewCreationKey()
    }
  }

  const callResetCreationCmp = () => {
    setResetCreationCmp((prev) => prev + 1);
  }

  const resetAuthorFormData = () => {
    setAuthorFormData({ key: null, firstName: null, lastName: null, isNewEntry: false });
  }

  const resetCreationFormData = () => {
    setCreationFormData({ key: null, name: null, kind: null, isNewEntry: false });
  }

  const fetchAndSetAuthorCreations = (authorKey: string) => {
    backendService.fetchAuthorCreations(authorKey).then((result) => {
      setAuthorCreations(result);
    }).catch(error => {
      enqueueSnackbar(`Could not fetch creations for author "${authorKey}": "${error.message}", please try again"`, { variant: 'error' });
    })
  }

  const fetchAndSetNewAuthorKey = () => {
    fetchEntityKey(EntityType.PERSON).then((key: string) => {
      setAuthorFormData((prevState) => ({
        ...prevState,
        key: key,
      }))
    }).catch((error) => {
      enqueueSnackbar(`Could not fetch a valid new key for a Author: "${error.message}", please try again"`, { variant: 'error' });
    })
  }
  const fetchAndSetNewCreationKey = () => {
    fetchEntityKey(EntityType.CREATION).then((key: string) => {
      setCreationFormData((prevState) => ({
        ...prevState,
        key: key,
        isNewEntry: true
      }))
    }).catch((error) => {
      enqueueSnackbar(`Could not fetch a valid new key for a Creation: "${error.message}", please try again"`, { variant: 'error' });
    })
  }

  const removeExistingEntry = (clickedEntry: MarkupCreationData) => {
    setAddedCreationEntries((prevEntries) => prevEntries.filter((entry: MarkupCreationData) => {
        return (entry.creation !== null && entry.creation.key !== clickedEntry.creation?.key)
      }
    )
    )
  }

  const handleCancelButtonClick = () => {
    dispatch(
      setEditorMarkedAndContentLeftRightThunk({
        textIsMarked: false,
        contentLeft: null,
        contentRight: null,
      }),
    );
  };

  const isValidFormData = () : boolean => {
   return (
     authorFormData.key !== null &&
     (
       ( authorFormData.isNewEntry && authorFormData.firstName !== null && authorFormData.lastName !== null )
       ||
       ( !authorFormData.isNewEntry &&
         ( authorFormData.firstName !== null || authorFormData.lastName !== null )
       )
     ) &&
       creationFormData.key !== null && creationFormData.name  !== null && creationFormData.kind !== null
   )
  }

  const buttonAddNewCreationEntry = () => {
    if (isValidFormData()) {
      addedCreationEntries.push({
        author: {
          key: authorFormData.key!,
          firstName: authorFormData.firstName ?? '',
          lastName: authorFormData.lastName ?? '',
          isNewEntry: authorFormData.isNewEntry,
        },
        creation: {
          key: creationFormData.key!,
          name: creationFormData.name!,
          kind: creationFormData.kind!,
          isNewEntry: creationFormData.isNewEntry,
        }
      });

      resetAuthorFormData()
      resetCreationFormData()
      setAuthorCreations([])
      setSelectCreationOptionDisabled(true)
      callResetCreationCmp()
      setSelectedCreationOption(null)
    }
  }

  const handleSubmitButtonClick = async () => {
    try {
      if (props.xmlRef.current === null) {
        throw new Error('XML reference is null');
      }

      const letterElement = props.xmlRef.current.querySelector('#letterXmlContent');
      if (!letterElement) { throw new Error('No letter element found!'); }

      if (stateEditorLetter.id === null || stateEditorLetter.name === null) {
        throw new Error('No letter id or name found!');
      }

      await EditorUtils.creationDataService.handleCreationDataEntries(
        letterElement,
        { id: stateEditorLetter.id!, name: stateEditorLetter.name },
        addedCreationEntries
      )

      enqueueSnackbar('Creation markup was added successfully', { variant: 'success' });

    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
    } finally {
    dispatch(setReloadLetterContent( { reloadLetterContent: true } ))
    dispatch(setEditorMarkedAndContentLeftRightThunk({
      textIsMarked: false,
      contentLeft: null,
      contentRight: null
    }));
    }
  }

  return (
    <div>
      <Box component="form" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Werk Auszeichnen und Hinzufügen
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            { addedCreationEntries.filter((entry) => { return entry.creation !== null && entry.author !== null}).map((entry) => (
              <Box
                key={entry.creation !== null ? entry.creation.key : ''}
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
                    { `(${entry.creation?.key}) ${entry.creation?.name}` }
                  </Typography>
                  <Typography variant="body2">
                    { `${entry.author?.firstName ?? ''} ${entry.author?.lastName ?? ''} (${entry.author?.key})` }
                  </Typography>
                </Box>
                <IconButton edge="end" onClick={() => removeExistingEntry(entry)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Box>
            )) }
          </Stack>
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={selectedAuthorOption} onChange={(e) => handleAuthorOptionChange(e.target.value as SelectActionAuthorOption)}>
            <FormControlLabel value={"EXISTING_ENTRY"} control={<Radio />} label="Vorhandener Autor" />
            <FormControlLabel value={"NEW_ENTRY"} control={<Radio />} label="Neuer Autor" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <EntityAuthorAutocomplete
              isDisabled={ authorAutocompleteDisabled }
              afterSelectHandler={ (entry) => {

                fetchAndSetAuthorCreations(entry.entityKey)
                setSelectedCreationOption('EXISTING_ENTRY')
                setSelectCreationOptionDisabled(false)
                setAuthorFormData((prevState) => ({
                  ...prevState,
                  key: entry.entityKey,
                  firstName: entry.entityFirstName !== undefined ? entry.entityFirstName : null,
                  lastName: entry.entityLastName !== undefined ? entry.entityLastName : null,
                }))
                }
              }
            />
          </Grid>
          <Grid size={{ xs: 4, md: 4, lg: 4 }}>
            <TextField
              variant="outlined"
              label="Key"
              value={authorFormData.key ?? ''}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={true} />
          </Grid>
          <Grid size={{ xs: 8, md: 8, lg: 8 }}>
            <TextField
              variant="outlined"
              label="Vorname"
              value={authorFormData.firstName ?? ''}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => {
                setAuthorFormData((prevState) => ({
                  ...prevState,
                  firstName: event.target.value,
                  isNewEntry: true
                }))
              }}
              disabled={authorFormDisabled} />
          </Grid>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <TextField
              variant="outlined"
              label="Nachname"
              value={authorFormData.lastName ?? ''}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => {
                setAuthorFormData((prevState) => ({
                  ...prevState,
                  lastName: event.target.value,
                  isNewEntry: true
                }))
              }}
              disabled={authorFormDisabled} />
          </Grid>
        </Grid>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={selectedCreationOption} onChange={(e) => handleCreationOptionChange(e.target.value as SelectActionCreationOption)}>
            <FormControlLabel value={"EXISTING_ENTRY"} control={<Radio />} disabled={selectCreationOptionDisabled} label="Vorhandene Werk" />
            <FormControlLabel value={"NEW_ENTRY"} control={<Radio />} disabled={selectCreationOptionDisabled} label="Neues Werk" />
          </RadioGroup>
        </FormControl>

        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          { (selectedCreationOption === 'EXISTING_ENTRY' || selectedCreationOption === null) && (

            <EntityExistingCreation
              creationList={authorCreations}
              creationAutocompleteDisabled={selectedCreationOption !== 'EXISTING_ENTRY'}
              creationKinds={creationKinds}
              resetSignal={resetCreationCmp}
              afterEntitySelected={(entity) => {
              setCreationFormData((prevState) => ({
                ...prevState,
                key: entity.entityKey,
                name: entity.entityName,
                kind: entity.entityKind ?? null,
                isNewEntry: false
               }))
              }
            }
          />
          ) }
          { (selectedCreationOption === 'NEW_ENTRY') && (
            <EntityNewCreation
              creationKinds={creationKinds}
              newCreationKey={creationFormData.key}
              afterEntitySelected={(entity) => {
                setCreationFormData((prevState) => ({
                  ...prevState,
                  key: entity.entityKey,
                  name: entity.entityName,
                  kind: entity.entityKind ?? null,
                  isNewEntry: true
                }))
              }}
            />
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={buttonAddNewCreationEntry} disabled={!isValidFormData()} startIcon={<AddIcon />}>
            Werk Hinzufügen
          </Button>

          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={addedCreationEntries.length === 0}>
            <Badge badgeContent={addedCreationEntries.length} color="secondary">
              Werk Auszeichnen
            </Badge>
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            Abbrechen
          </Button>
        </Box>
      </Box>
      <div>
        <pre>{JSON.stringify(authorFormData, null, 2)}</pre>
        <pre>{JSON.stringify(creationFormData, null, 2)}</pre>
      </div>
    </div>
  );
}

export default EntityCreationContainer;
