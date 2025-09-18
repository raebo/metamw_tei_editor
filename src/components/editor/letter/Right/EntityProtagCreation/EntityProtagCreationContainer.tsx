import React, { useEffect, useState } from 'react';
import { backendService } from '../../../../../utils/editor/backendService';
import { enqueueSnackbar } from 'notistack';
import { MarkupProtagCreationData, ProtagCreation, ProtagCreationCategory } from '../../../../../services/mappings/editorMappings';
import { Badge, Box, Divider, FormControl, FormControlLabel, IconButton, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import ProtagCrtCatSelector from './ProtagCrtCatSelector';
import { EditorContainerProps } from '../../../../pages/editor/ShowEditor';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../redux/thunks/editor.letter.thunk';
import { useAppDispatch } from '../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import EntityExistingProtagCreation from './EntityExistingProtagCreation';
import EntityNewProtagCreation, { ProtagCreationDetail } from './EntityNewProtagCreation';
import { fetchEntityKey } from '../../../../../services/editor/apiLetterRequest.service';
import { EntityType } from '../../../../../constants/editor';
import { setReloadLetterContent } from '../../../../../redux/slices/editor.letter.slice';
import DeleteIcon from '@mui/icons-material/Delete';
import { EditorUtils } from '../../../../../utils/editor';

type SelectActionProtagCreationOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';

interface ProtagFormData {
  key: null | string;
  name: null | string;
  isNewEntry: boolean;
  mwv: null | string;
  opus: null | string;
  parentProtagCreationCategories: null | ProtagCreationCategory[];
  protagCreationCategory: null | ProtagCreationCategory;
}

const EntityProtagCreationContainer = (props: EditorContainerProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [addedProtagCreations, setAddedProtagCreations] = React.useState<MarkupProtagCreationData[]>([]);
  const [protagCreations, setProtagCreations] = React.useState<ProtagCreation[]>([]);
  const [protagCreationCategories, setProtagCreationCategories] = React.useState<ProtagCreationCategory[]>([]);

  const [selectedProtagCreationOption, setSelectedProtagCreationOption] = useState<SelectActionProtagCreationOption>('EXISTING_ENTRY');

  const [resetProtagCreationCmp, setResetProtagCreationCmp] = useState<number>(0); // used to reset the creation form when a new author is selected

  const [protagFormData, setProtagFormData] = React.useState<ProtagFormData>({
    key: null,
    name: null,
    isNewEntry: false,
    mwv: null,
    opus: null,
    parentProtagCreationCategories: null,
    protagCreationCategory: null,
  });

  useEffect(() => {
    backendService
      .fetchProtagCreationCategories(null)
      .then((result: ProtagCreationCategory[]) => {
        setProtagCreationCategories(result);
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch protag creation categories: "${error.message}", please try again`, {
          variant: 'error',
        });
      });
    backendService
      .fetchProtagCreationEntries(null)
      .then((entries: ProtagCreation[]) => {
        setProtagCreations(entries);
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch protag creation entries: "${error instanceof Error ? error.message : error}", please try again`, {
          variant: 'error',
        });
      });
  }, []); // empty array = run once on mount

  const fetchProtagCreationEntries = (protagCreationCategory: ProtagCreationCategory): void => {
    EditorUtils.backendService
      .fetchProtagCreationEntries(protagCreationCategory)
      .then((entries) => {
        setProtagCreations(entries);
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch protag creation entries: "${error instanceof Error ? error.message : error}", please try again`, {
          variant: 'error',
        });
      });
  };

  const fetchAndSetNewProtagCreationKey = () => {
    fetchEntityKey(EntityType.PROTAG_CREATION)
      .then((key: string) => {
        setProtagFormData((prevState) => ({
          ...prevState,
          key: key,
          isNewEntry: true,
        }));
      })
      .catch((error) => {
        enqueueSnackbar(`Could not fetch a valid new key for  ProtagCreation: "${error.message}", please try again"`, { variant: 'error' });
      });
  };

  const callResetProtagCreationCmp = () => {
    setResetProtagCreationCmp((prev) => prev + 1);
  };

  const handleProtagOptionChange = (option: SelectActionProtagCreationOption) => {
    setSelectedProtagCreationOption(option);
    resetProtagFormData();

    if (option === 'NEW_ENTRY') {
      fetchAndSetNewProtagCreationKey();
    }
    if (option === 'EXISTING_ENTRY') return;
  };

  const handleSubmitButtonClick = async () => {
    try {
      if (props.xmlRef.current === null) {
        throw new Error('XML reference is null');
      }

      const letterElement = props.xmlRef.current.querySelector('#letterXmlContent');
      if (!letterElement) {
        throw new Error('No letter element found!');
      }

      if (stateEditorLetter.id === null || stateEditorLetter.name === null) {
        throw new Error('No letter id or name found!');
      }

      await EditorUtils.protagCreationDataService.handleProtagCreationDataEntries(
        letterElement,
        { id: stateEditorLetter.id!, name: stateEditorLetter.name },
        addedProtagCreations,
      );

      enqueueSnackbar('ProtagCreation markup was added successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
        variant: 'error',
      });
    } finally {
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

  const isValidFormData = (): boolean => {
    return protagFormData.key !== null && protagFormData.name !== null && protagFormData.protagCreationCategory !== null;
  };

  const resetProtagFormData = () => {
    setProtagFormData({
      key: '',
      name: '',
      isNewEntry: false,
      mwv: '',
      opus: '',
      parentProtagCreationCategories: null,
      protagCreationCategory: protagFormData.protagCreationCategory ?? null,
    });
  };

  async function onProtagCreationChange(protagCreation: ProtagCreation) {
    try {
      let categoryUpdate = {};

      if (protagFormData.protagCreationCategory == null) {
        const categories = await backendService.fetchCategoriesForProtagCreation(protagCreation.id);
        categoryUpdate = {
          protagCreationCategory: categories.length > 0 ? categories[0] : null,
          parentProtagCreationCategories: categories.length > 1 ? categories.slice(1) : null,
        };
      }

      setProtagFormData((prev) => ({
        ...prev,
        key: protagCreation.key,
        name: protagCreation.name,
        mwv: protagCreation.mwv,
        opus: protagCreation.opus,
        isNewEntry: false,
        ...categoryUpdate,
      }));
    } catch (error) {
      enqueueSnackbar('Error fetching protag creation data: ' + (error instanceof Error ? error.message : String(error)), {
        variant: 'error',
      });
    }
  }

  const buttonAddNewProtagEntry = () => {
    const { key, name, mwv, opus, isNewEntry, parentProtagCreationCategories, protagCreationCategory } = protagFormData;

    if (key !== null && name !== null && protagCreationCategory !== null) {
      setAddedProtagCreations((prevState) => [
        ...prevState,
        {
          key,
          name,
          isNewEntry,
          mwv,
          opus,
          parentProtagCreations: parentProtagCreationCategories ?? [],
          protagCreationCategory,
        },
      ]);
    }

    callResetProtagCreationCmp();
    setSelectedProtagCreationOption('EXISTING_ENTRY');
    console.log('Added protag creation entry: ', {});
    resetProtagFormData();
  };

  const removeExistingEntry = (clickedEntry: MarkupProtagCreationData) => {
    setAddedProtagCreations((prevEntries) =>
      prevEntries.filter((entry: MarkupProtagCreationData) => {
        return entry.key !== clickedEntry.key;
      }),
    );
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

  return (
    <>
      <Box component="form" sx={{ p: 4, maxWidth: 600, px: '5px', mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          FMB-Werk Auszeichnen und Hinzufügen
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            {addedProtagCreations.map((entry) => (
              <Box key={entry.key ?? ''}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {`(${entry.key}) ${entry.name}`}
                  </Typography>
                  <Typography variant="body2">
                    {[
                      entry.protagCreationCategory?.name ?? '',
                      entry.mwv ? `MWV: ${entry.mwv}` : null,
                      entry.opus ? `Opus: ${entry.opus}` : null,
                    ]
                      .filter(Boolean)
                      .join(' - ')}
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
            <ProtagCrtCatSelector
              categories={protagCreationCategories}
              handleCategorySelected={(protagCategory: ProtagCreationCategory, parentCategoryChain: ProtagCreationCategory[]) => {
                setProtagFormData((prevState) => ({
                  ...prevState,
                  protagCreationCategory: protagCategory,
                  parentProtagCreationCategories: parentCategoryChain.length > 0 ? parentCategoryChain : null,
                }));
                if (selectedProtagCreationOption === 'EXISTING_ENTRY') {
                  fetchProtagCreationEntries(protagCategory);
                  callResetProtagCreationCmp();
                }
              }}
            />
          </Grid>
        </Grid>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup
            row
            value={selectedProtagCreationOption}
            onChange={(e) => handleProtagOptionChange(e.target.value as SelectActionProtagCreationOption)}
          >
            <FormControlLabel value={'EXISTING_ENTRY'} control={<Radio />} label="Vorhandenes Werk" />
            <FormControlLabel value={'NEW_ENTRY'} control={<Radio />} label="Neues Werk" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          {(selectedProtagCreationOption === 'EXISTING_ENTRY' || selectedProtagCreationOption === null) && (
            <EntityExistingProtagCreation
              resetSignal={resetProtagCreationCmp}
              protagCreations={protagCreations}
              handleProtagCreationChange={onProtagCreationChange}
            />
          )}
          {selectedProtagCreationOption === 'NEW_ENTRY' && (
            <EntityNewProtagCreation
              protagCreationKey={protagFormData.key}
              afterProtagCreationChange={(protagCreation: ProtagCreationDetail) => {
                setProtagFormData((prevState) => ({
                  ...prevState,
                  name: protagCreation.name,
                  mwv: protagCreation.mwv,
                  opus: protagCreation.opus,
                }));
              }}
            />
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={buttonAddNewProtagEntry}
            disabled={!isValidFormData()}
            startIcon={<AddIcon />}
          >
            FMB-Werk Hinzufügen
          </Button>

          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={addedProtagCreations.length === 0}>
            <Badge badgeContent={addedProtagCreations.length} color="secondary">
              FMB-Werk Auszeichnen
            </Badge>
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            Abbrechen
          </Button>
        </Box>
        <div>
          <pre>{JSON.stringify(protagFormData, null, 2)}</pre>
        </div>
      </Box>
    </>
  );
};

export default EntityProtagCreationContainer;
