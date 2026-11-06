import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { type HiRendType, MarkupCreationData } from '@src/services/mappings/editorMappings';
import { setEditorMarkedAndContentLeftRightThunk } from '@src/redux/thunks/editor.letter.thunk';
import {
  Badge,
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EntityAuthorAutocomplete from './EntityAuthorAutocomplete';
import { fetchEntityKey } from '@src/services/editor/apiLetterRequest.service';
import { enqueueSnackbar } from 'notistack';
import { EditorConstants, EntityType } from '@src/constants/editor';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import EntityExistingCreation from './EntityExistingCreation';
import { backendService } from '@src/utils/editor/backendService';
import EntityNewCreation from './EntityNewCreation';
import { EditorContainerProps } from '@src/components/pages/editor/ShowEditor';
import { setReloadLetterContent } from '@src/redux/slices/editor.letter.slice';
import { EditorUtils } from '@src/utils/editor';
import { MiscUtils } from '@src/utils/misc';
import { useTranslation } from 'react-i18next';
import LetterEntitySuggestionList from '@src/components/editor/letter/Right/EntitySuggestions/LetterEntitySuggestionList';
import { extractLetterCreationSuggestions, LetterEntitySuggestion } from '@src/utils/editor/letterEntitySuggestions';

type SelectActionAuthorOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';
type SelectActionCreationOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';
type CreationSelectionMode = 'LETTER' | 'SEARCH' | 'NEW';

export interface FormAuthorData {
  key: null | string;
  firstName: null | string;
  lastName: null | string;
  isNewEntry: boolean;
}

export interface FormCreationData {
  key: null | string;
  name: null | string;
  kind: null | string;
  isNewEntry: boolean;
}

const EntityCreationContainer = (_props: EditorContainerProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [addedCreationEntries, setAddedCreationEntries] = useState<MarkupCreationData[]>([]);

  const [hiRendMarkup, setHiRendMarkup] = useState<HiRendType>(null);

  const [creationFormData, setCreationFormData] = React.useState<FormCreationData>({
    key: null,
    name: null,
    kind: null,
    isNewEntry: false,
  });

  const [authorFormData, setAuthorFormData] = React.useState<FormAuthorData>({
    key: null,
    firstName: null,
    lastName: null,
    isNewEntry: false,
  });
  const [authorFormDisabled, setAuthorFormDisabled] = useState(true);

  const [selectedAuthorOption, setSelectedAuthorOption] = useState<SelectActionAuthorOption>('EXISTING_ENTRY');
  const [selectedCreationOption, setSelectedCreationOption] = useState<SelectActionCreationOption>(null);
  const [selectionMode, setSelectionMode] = useState<CreationSelectionMode>('LETTER');

  const [authorAutocompleteDisabled, setAuthorAutocompleteDisabled] = useState(false);
  const [authorCreations, setAuthorCreations] = useState<SnippetEntity[]>([]); //creations of the selected author

  const [creationKinds, setCreationKinds] = useState<string[]>([]);

  const [resetCreationCmp, setResetCreationCmp] = useState<number>(0); // used to reset the creation form when a new author is selected
  const [autocompleteAuthorResetKey, setAutocompleteAuthorResetKey] = useState(0);
  const [authorCreationResetKey, setAuthorCreationResetKey] = useState(0);

  const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent);
  const [xmlDoc, setXmlDoc] = React.useState<XMLDocument | null>(null);

  const letterCreationSuggestions = useMemo(() => {
    if (!stateTeiXml) return [];

    try {
      return extractLetterCreationSuggestions(stateTeiXml);
    } catch {
      return [];
    }
  }, [stateTeiXml]);

  const addedCreationKeys = useMemo(
    () => new Set(addedCreationEntries.flatMap((entry) => (entry.creation ? [entry.creation.key] : []))),
    [addedCreationEntries],
  );

  useEffect(() => {
    if (!stateTeiXml) {
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      return;
    }

    try {
      const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
      setXmlDoc(xmlDoc);
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
      setXmlDoc(null);
    }
  }, [stateTeiXml, dispatch]);

  useEffect(() => {
    backendService
      .fetchCreationKinds()
      .then((result) => {
        setCreationKinds(result);
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch creation kinds: "${error.message}", please try again`, {
          variant: 'error',
        });
      });
  }, []); // empty array = run once on mount

  const fetchAndSetAuthorCategories = (authorKey: string) => {
    backendService
      .fetchAuthorCategories(authorKey)
      .then((result) => {
        setCreationKinds(result);
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch author categories: "${error.message}", please try again`, {
          variant: 'error',
        });
      });
  };

  const handleAuthorOptionChange = (option: SelectActionAuthorOption) => {
    resetAuthorFormData();
    resetCreationFormData();
    setSelectedAuthorOption(option);

    if (option === 'EXISTING_ENTRY') {
      setSelectedCreationOption(selectionMode === 'NEW' ? 'NEW_ENTRY' : 'EXISTING_ENTRY');
      setAuthorFormDisabled(true);
      setAuthorAutocompleteDisabled(false);
      if (selectionMode === 'NEW') fetchAndSetNewCreationKey();
    }
    if (option === 'NEW_ENTRY') {
      fetchAndSetNewAuthorKey();
      fetchAndSetNewCreationKey();
      setAuthorFormDisabled(false);
      setAuthorAutocompleteDisabled(true);
      setAuthorCreations([]);
      setSelectedCreationOption('NEW_ENTRY');
    }
  };

  const handleHiRendMarkupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setHiRendMarkup('latintype');
    } else {
      setHiRendMarkup(null);
    }
  };

  const handleSelectionModeChange = (mode: CreationSelectionMode) => {
    resetAuthorFormData();
    resetCreationFormData();
    setAuthorCreations([]);
    setSelectedAuthorOption('EXISTING_ENTRY');
    setAuthorFormDisabled(true);
    setAuthorAutocompleteDisabled(false);
    setSelectionMode(mode);
    callResetCreationCmp();
    setAutocompleteAuthorResetKey((prev) => prev + 1);

    if (mode === 'LETTER') {
      setSelectedCreationOption(null);
      return;
    }

    if (mode === 'SEARCH') {
      setSelectedCreationOption('EXISTING_ENTRY');
      return;
    }

    setSelectedCreationOption('NEW_ENTRY');
    fetchAndSetNewCreationKey();
  };

  const callResetCreationCmp = () => {
    setResetCreationCmp((prev) => prev + 1);
  };

  const resetAuthorFormData = () => {
    setAuthorFormData({ key: null, firstName: null, lastName: null, isNewEntry: false });
  };

  const resetCreationFormData = () => {
    setCreationFormData({ key: null, name: null, kind: null, isNewEntry: false });
  };

  const fetchAndSetAuthorCreations = (authorKey: string) => {
    backendService
      .fetchAuthorCreations(authorKey)
      .then((result) => {
        setAuthorCreations(result);
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch creations for author "${authorKey}": "${error.message}", please try again"`, { variant: 'error' });
      });
  };

  const fetchAndSetNewAuthorKey = () => {
    fetchEntityKey(EntityType.PERSON)
      .then((key: string) => {
        setAuthorFormData((prevState) => ({
          ...prevState,
          key: key,
        }));
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch a valid new key for a Author: "${error.message}", please try again"`, { variant: 'error' });
      });
  };
  const fetchAndSetNewCreationKey = () => {
    fetchEntityKey(EntityType.CREATION)
      .then((key: string) => {
        setCreationFormData((prevState) => ({
          ...prevState,
          key: key,
          isNewEntry: true,
        }));
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch a valid new key for a Creation: "${error.message}", please try again"`, { variant: 'error' });
      });
  };

  const removeExistingEntry = (clickedEntry: MarkupCreationData) => {
    setAddedCreationEntries((prevEntries) =>
      prevEntries.filter((entry: MarkupCreationData) => {
        return entry.creation !== null && entry.creation.key !== clickedEntry.creation?.key;
      }),
    );
  };

  const addCreationEntry = (entry: MarkupCreationData) => {
    setAddedCreationEntries((previousEntries) =>
      previousEntries.some((existingEntry) => existingEntry.creation?.key === entry.creation?.key)
        ? previousEntries
        : [...previousEntries, entry],
    );
  };

  const addLetterCreation = async (suggestion: LetterEntitySuggestion) => {
    try {
      if (!suggestion.entityKind) {
        throw new Error('Creation data is missing its kind');
      }

      const authors = await EditorUtils.creationDataService.fetchCreationAuthors(suggestion.entityKey);
      const primaryAuthor = authors[0];

      addCreationEntry({
        author: primaryAuthor
          ? {
              key: primaryAuthor.entityKey,
              firstName: primaryAuthor.entityFirstName ?? '',
              lastName: primaryAuthor.entityLastName ?? primaryAuthor.entityName,
              isNewEntry: false,
            }
          : null,
        creation: {
          key: suggestion.entityKey,
          name: suggestion.entityName,
          kind: suggestion.entityKind,
          isNewEntry: false,
        },
      });
    } catch (error) {
      enqueueSnackbar(`Could not load creation data for '${suggestion.entityKey}': ${MiscUtils.misc.getErrorMessage(error)}`, {
        variant: 'error',
      });
    }
  };

  const handleCancelButtonClick = () => {
    dispatch(
      setEditorMarkedAndContentLeftRightThunk({
        textIsMarked: false,
        contentLeft: null,
        contentRight: null,
      }),
    );
  };

  const isValidFormData = (): boolean => {
    return (
      authorFormData.key !== null &&
      ((authorFormData.isNewEntry && authorFormData.firstName !== null && authorFormData.lastName !== null) ||
        (!authorFormData.isNewEntry && (authorFormData.firstName !== null || authorFormData.lastName !== null))) &&
      creationFormData.key !== null &&
      creationFormData.name !== null &&
      creationFormData.kind !== null
    );
  };

  const buttonAddNewCreationEntry = () => {
    if (isValidFormData()) {
      addCreationEntry({
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
        },
      });

      resetAuthorFormData();
      resetCreationFormData();
      setAuthorCreations([]);
      callResetCreationCmp();
      setSelectedCreationOption(selectionMode === 'NEW' ? 'NEW_ENTRY' : 'EXISTING_ENTRY');
      setAutocompleteAuthorResetKey((prev) => prev + 1);
      if (selectionMode === 'NEW') fetchAndSetNewCreationKey();
    }
  };

  const handleSubmitButtonClick = async () => {
    try {
      if (!xmlDoc) {
        enqueueSnackbar('No valid XML document available, please try again', { variant: 'error' });
        throw new Error('No letter element found!');
      }

      if (stateEditorLetter.id === null || stateEditorLetter.name === null) {
        enqueueSnackbar('No letter element found!', { variant: 'error' });
        throw new Error('No letter id or name found!');
      }

      const xmlId: string = await EditorUtils.creationDataService.handleCreationDataEntries(xmlDoc, addedCreationEntries, hiRendMarkup);

      await EditorUtils.backendOrchestrator.patchWithDispatch(
        dispatch,
        [new XMLSerializer().serializeToString(xmlDoc), stateEditorLetter.id, EditorConstants.changeTypes.creation.ADDED, xmlId],
        {
          actionsOnSuccess: [
            setReloadLetterContent({ reloadLetterContent: true }),
            setEditorMarkedAndContentLeftRightThunk({
              textIsMarked: false,
              contentLeft: null,
              contentRight: null,
            }),
          ],
          successMessage: t('editor:dialog.creationContainer.addCreationDialog.success'),
          errorMessage: t('editor:dialog.creationContainer.addCreationDialog.errorSubmit'),
        },
      );
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
        variant: 'error',
      });

      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      dispatch(
        setEditorMarkedAndContentLeftRightThunk({
          textIsMarked: false,
          contentLeft: null,
          contentRight: null,
        }),
      );
    }
  };

  return (
    <>
      <Box component="form" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          {t('editor:dialog.creationContainer.addCreationDialog.headline')}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hiRendMarkup !== null}
                    onChange={handleHiRendMarkupChange}
                    color="primary" // options: primary, secondary, default
                  />
                }
                label={t('editor:dialog.creationContainer.addCreationDialog.label.latintype')}
              />
            </Box>

            {addedCreationEntries
              .filter((entry) => {
                return entry.creation !== null;
              })
              .map((entry) => (
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
                      {`(${entry.creation?.key}) ${entry.creation?.name}`}
                    </Typography>
                    {entry.author && (
                      <Typography variant="body2">{`${entry.author.firstName} ${entry.author.lastName} (${entry.author.key})`}</Typography>
                    )}
                  </Box>
                  <IconButton edge="end" onClick={() => removeExistingEntry(entry)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
          </Stack>
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup
            row
            value={selectionMode}
            onChange={(event) => handleSelectionModeChange(event.target.value as CreationSelectionMode)}
          >
            <FormControlLabel value="LETTER" control={<Radio />} label={t('editor:dialog.entitySelection.mode.letter')} />
            <FormControlLabel value="SEARCH" control={<Radio />} label={t('editor:dialog.entitySelection.mode.search')} />
            <FormControlLabel value="NEW" control={<Radio />} label={t('editor:dialog.entitySelection.mode.new')} />
          </RadioGroup>
        </FormControl>

        {selectionMode === 'LETTER' && (
          <LetterEntitySuggestionList
            suggestions={letterCreationSuggestions}
            excludedKeys={addedCreationKeys}
            onSelect={(suggestion) => void addLetterCreation(suggestion)}
            onOpenSearch={() => handleSelectionModeChange('SEARCH')}
          />
        )}

        {selectionMode !== 'LETTER' && (
          <>
            {selectionMode === 'NEW' && (
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <RadioGroup
                  row
                  value={selectedAuthorOption}
                  onChange={(event) => handleAuthorOptionChange(event.target.value as SelectActionAuthorOption)}
                >
                  <FormControlLabel
                    value="EXISTING_ENTRY"
                    control={<Radio />}
                    label={t('editor:dialog.creationContainer.addCreationDialog.label.existingAuthor')}
                  />
                  <FormControlLabel
                    value="NEW_ENTRY"
                    control={<Radio />}
                    label={t('editor:dialog.creationContainer.addCreationDialog.label.newAuthor')}
                  />
                </RadioGroup>
              </FormControl>
            )}

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
              <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                <EntityAuthorAutocomplete
                  key={autocompleteAuthorResetKey}
                  isDisabled={authorAutocompleteDisabled}
                  afterSelectHandler={(entry) => {
                    fetchAndSetAuthorCategories(entry.entityKey);
                    if (selectionMode === 'SEARCH') {
                      fetchAndSetAuthorCreations(entry.entityKey);
                      setSelectedCreationOption('EXISTING_ENTRY');
                    } else {
                      setSelectedCreationOption('NEW_ENTRY');
                    }
                    setAuthorCreationResetKey((prev) => prev + 1);
                    setAuthorFormData((prevState) => ({
                      ...prevState,
                      key: entry.entityKey,
                      firstName: entry.entityFirstName !== undefined ? entry.entityFirstName : null,
                      lastName: entry.entityLastName !== undefined ? entry.entityLastName : null,
                    }));
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, md: 4, lg: 4 }}>
                <TextField
                  variant="outlined"
                  label={t('editor:dialog.creationContainer.addCreationDialog.label.key')}
                  value={authorFormData.key ?? ''}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={true}
                />
              </Grid>
              <Grid size={{ xs: 8, md: 8, lg: 8 }}>
                <TextField
                  variant="outlined"
                  label={t('editor:dialog.creationContainer.addCreationDialog.label.firstName')}
                  value={authorFormData.firstName ?? ''}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(event) => {
                    setAuthorFormData((prevState) => ({
                      ...prevState,
                      firstName: event.target.value,
                      isNewEntry: true,
                    }));
                  }}
                  disabled={authorFormDisabled}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                <TextField
                  variant="outlined"
                  label={t('editor:dialog.creationContainer.addCreationDialog.label.lastName')}
                  value={authorFormData.lastName ?? ''}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(event) => {
                    setAuthorFormData((prevState) => ({
                      ...prevState,
                      lastName: event.target.value,
                      isNewEntry: true,
                    }));
                  }}
                  disabled={authorFormDisabled}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
              {(selectedCreationOption === 'EXISTING_ENTRY' || selectedCreationOption === null) && (
                <EntityExistingCreation
                  key={authorCreationResetKey}
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
                      isNewEntry: false,
                    }));
                  }}
                />
              )}
              {selectedCreationOption === 'NEW_ENTRY' && (
                <EntityNewCreation
                  creationKinds={creationKinds}
                  newCreationKey={creationFormData.key}
                  afterEntitySelected={(entity) => {
                    setCreationFormData((prevState) => ({
                      ...prevState,
                      key: entity.entityKey,
                      name: entity.entityName,
                      kind: entity.entityKind ?? null,
                      isNewEntry: true,
                    }));
                  }}
                />
              )}
            </Grid>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={buttonAddNewCreationEntry}
            disabled={!isValidFormData()}
            startIcon={<AddIcon />}
          >
            {t('editor:dialog.creationContainer.addCreationDialog.button.addCreation')}
          </Button>

          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={addedCreationEntries.length === 0}>
            <Badge badgeContent={addedCreationEntries.length} color="secondary">
              {t('editor:dialog.creationContainer.addCreationDialog.button.annotate')}
            </Badge>
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            {t('editor:dialog.buttons.cancel')}
          </Button>
        </Box>
      </Box>
      <div></div>
    </>
  );
};

export default EntityCreationContainer;
