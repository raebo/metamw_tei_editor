import React, { useEffect, useRef, useState } from 'react';
import { EditorContainerProps } from '../../../../pages/editor/ShowEditor';
import {
  Badge,
  Box,
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
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppDispatch } from '../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/redux.store';
import { MarkupPlaceData, SelectCompleteOption } from '../../../../../services/mappings/editorMappings';
import EntityPlaceAutocomplete from './EntityPlaceAutocomplete';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../redux/thunks/editor.letter.thunk';
import { enqueueSnackbar } from 'notistack';
import { EntityType } from '../../../../../constants/editor';
import PlaceCountryAutocomplete from './PlaceCountryAutocomplete';
import { EditorUtils } from '../../../../../utils/editor';
import { MiscUtils } from '../../../../../utils/misc';
import PlaceKindAutocomplete from './PlaceKindAutocomplete';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';

type SelectTypeOption = null | EntityType.SETTLEMENT | EntityType.INSTITUTION | EntityType.SIGHT;

type SelectActionOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';


export interface PlaceFormData {
  id?: string | null;
  key: string | null;
  name: string | null;
  placeType: string | null;
  country: SelectCompleteOption | null;
  kind: string | null;
  settlement?: string | null;
}

const requiredPlaceFormFields: (keyof PlaceFormData)[] = ['key', 'placeType', 'name', 'country', 'kind'];
const allRequiredFieldsPresent = (placeFormData: PlaceFormData): placeFormData is Required<MarkupPlaceData> => {
  return requiredPlaceFormFields.every((field) => placeFormData[field] !== null && placeFormData[field] !== undefined);
};

const blankPlaceFormData: PlaceFormData = { key: '', name: '', placeType: '', country: { label: '', value: '' }, kind: '', settlement: ''}


const EntityPlaceContainer = (props: EditorContainerProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [placeFormData, setPlaceFormData] = useState<PlaceFormData>({
    key: null,
    name: null,
    placeType: null,
    country: { label: '', value: '' },
    kind: null,
    settlement: null
  });

  const [selectedPlace, setSelectedPlace] = useState<SnippetEntity | null>(null);

  const handleResetPlace = () => {
    setSelectedPlace(null);
  };

  const [autoCmplNameDisabled, setAutoCmplNameDisabled] = useState(true);
  const [autoCmplCountryDisabled, setAutoCmplCountryDisabled] = useState(true);
  const [autoCmplKindDisabled, setAutoCmplKindDisabled] = useState(true);
  const [selectedTypeOption, setSelectedTypeOption] = useState<SelectTypeOption>(null);
  const [selectedActionOption, setSelectedActionOption] = useState<SelectActionOption>(null);

  const [addedPlaceEntries, setAddedPlaceEntries] = useState<MarkupPlaceData[]>([]);

  const [formIsDisabled, setFormIsDisabled] = useState(true);

  const [countryOptions, setCountryOptions] = useState<SelectCompleteOption[]>([]);
  const [kindOptions, setKindOptions] = useState<SelectCompleteOption[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countries = await EditorUtils.backendService.fetchCountryEntries();
        if (countries) {
          const options = countries.map((country) => ({
            label: country.name,
            value: String(country.id),
          }));
          setCountryOptions(options);
        } else {
          throw new Error("No countries found");
        }
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
        setCountryOptions([]);
      }
    };


    const fetchKindOptions= async () => {
      try {
        const kindEntries= await EditorUtils.backendService.fetchKindEntries();
        if (kindEntries) {
          const kindOptions = kindEntries.map((kindName) => ({
            label: kindName,
            value: kindName
          }));
          setKindOptions(kindOptions);
        } else {
          throw new Error("No countries found");
        }
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
        setCountryOptions([]);
      }
    };

    if (countryOptions.length === 0) { fetchCountries(); }
    if (kindOptions.length === 0) { fetchKindOptions(); }
  }, []);

  const handleSelectTypeOption = (option: SelectTypeOption) => {

    setPlaceFormData(blankPlaceFormData)
    handleResetPlace()
    setSelectedTypeOption(option);
    setSelectedActionOption('EXISTING_ENTRY');
    setAutoCmplNameDisabled(false);

    if (option === EntityType.SIGHT) {

    } else if (option === EntityType.SETTLEMENT) {

    } else if (option === EntityType.INSTITUTION) {

    }
  };

  const handleSelectActionOption = (option: SelectActionOption) => {
    setSelectedActionOption(option);

    if (option === 'EXISTING_ENTRY') {
    } else if (option === 'NEW_ENTRY') {
      setPlaceFormData(blankPlaceFormData)
      handleResetPlace();
      setAutoCmplCountryDisabled(false)
    }
  };

  const removeExistingEntry = (key: string) => {
    setAddedPlaceEntries((prevEntries) => prevEntries.filter((entry: MarkupPlaceData) => entry.key !== key));
  };

  const addNewPlaceEntry = (entry: MarkupPlaceData) => {
    setAddedPlaceEntries((prevEntries) => [...prevEntries, entry]);
  };

  const buttonAddNewPlaceEntry = () => {
    if (allRequiredFieldsPresent(placeFormData)) {
      // TypeScript now knows: placeFormData.key is string, not string | null
      addNewPlaceEntry({
        id: null,
        key: placeFormData.key,
        placeType: placeFormData.placeType,
        name: placeFormData.name,
        settlement: null,
        country: placeFormData.country,
        kind: placeFormData.kind,
        isNewEntry: false,
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

  const handleSubmitButtonClick = async () => {
    try {
      if (props.xmlRef.current === null) {
        throw new Error('XML reference is null');
      }

      // const letterElement = props.xmlRef.current.querySelector('#letterXmlContent');
      //
      // if (!letterElement) { throw new Error('No letter element found!'); }
      //
      // const { xmlId, contentChanged } = EditorUtils.markupGeneration.addPersonMarkup(letterElement, addedPersonEntries);
      //
      // if (!contentChanged) {
      //   enqueueSnackbar('No changes were made to the letter content', { variant: 'info' });
      //   return;
      // }
      //
      // const response = await EditorUtils.backendService.patchContent(letterElement.innerHTML, stateEditorLetter.id, EditorConstants.changeTypes.person.ADDED, xmlId)
      //
      // if (response) {
      //   dispatch(setReloadLetterContent( { reloadLetterContent: true } ))
      //   dispatch(setEditorMarkedAndContentLeftRightThunk({
      //     textIsMarked: false,
      //     contentLeft: null,
      //     contentRight: null
      //   }));
      //   enqueueSnackbar('Person markup was added successfully', { variant: 'success' });
      // }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
    }
  };

  return (
    <div>
      <Box component="form" sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Ortschaften/Instit./Sehenswürd. Auszeichnen und Hinzufügen
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            {addedPlaceEntries.map((entry) => (
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
                  <Typography variant="body2" fontWeight="bold">
                    {entry.key}
                  </Typography>
                  <Typography variant="body2">{entry.name}</Typography>
                </Box>
                <IconButton edge="end" onClick={() => removeExistingEntry(entry.key)} aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={selectedTypeOption} onChange={(e) => handleSelectTypeOption(e.target.value as SelectTypeOption)}>
            <FormControlLabel value={EntityType.SETTLEMENT} control={<Radio />} label="Ortschaft" />
            <FormControlLabel value={EntityType.INSTITUTION} control={<Radio />} label="Institution" />
            <FormControlLabel value={EntityType.SIGHT} control={<Radio />} label="Sehenswürdigkeit" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={selectedActionOption} onChange={(e) => handleSelectActionOption(e.target.value as SelectActionOption)}>
            <FormControlLabel disabled={selectedTypeOption === null} value="EXISTING_ENTRY" control={<Radio />} label="Vorhandener Eintrag" />
            <FormControlLabel disabled={selectedTypeOption === null} value="NEW_ENTRY" control={<Radio />} label="Neuer Eintrag" />
          </RadioGroup>
        </FormControl>

        <Grid container spacing={2} sx={{ marginTop: 3, mb: 3 }}>
          <Grid size={12}>
            { (selectedActionOption === 'EXISTING_ENTRY' || selectedActionOption === null ) && (
              <EntityPlaceAutocomplete
                isDisabled={autoCmplNameDisabled}
                value={selectedPlace}
                placeType={selectedTypeOption}
                addedPlaceEntries={addedPlaceEntries}
                onValueChange={setSelectedPlace}
                afterSelectHandler={(entry) => {
                  setPlaceFormData(entry)

                  switch (selectedTypeOption) {
                    case EntityType.SIGHT:
                      break;
                    case EntityType.SETTLEMENT:
                      break
                    case EntityType.INSTITUTION:
                      setAutoCmplKindDisabled(false)
                      break;
                  }
                }}
              />
              )
            }

            { selectedActionOption === 'NEW_ENTRY' && (
              <TextField
                variant="outlined"
                label="Name"
                value={placeFormData.name}
                fullWidth
                slotProps={{ inputLabel: { shrink: true}} }
                disabled={false}
                onChange={(event) => {
                  setPlaceFormData((prev) => ({
                      ...prev,
                      name: event.target.value,
                    })
                  )
                }}
              />
            ) }

          </Grid>
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              variant="outlined"
              label="Key"
              value={placeFormData.key}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={true} />
          </Grid>
          <Grid size={8}>
            <PlaceCountryAutocomplete
              isDisabled={autoCmplCountryDisabled}
              selectedOption={placeFormData.country !== null && placeFormData.country !== undefined ? placeFormData.country : { label: '', value: ''}}
              allOptions={countryOptions}
              afterSelectHandler={(entry) => {

              }}
            />
          </Grid>
          <Grid size={12}>
            { selectedActionOption === 'EXISTING_ENTRY' && (
              <TextField
                label="Ortschaft"
                variant="outlined"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={placeFormData.settlement}
                disabled={formIsDisabled}
                onChange={(event) => {
                  setPlaceFormData((prev) => ({
                    ...prev,
                    settlement: event.target.value,
                  }));
                }}
              />
            )}
            { selectedActionOption === 'NEW_ENTRY' && selectedTypeOption !== "SETTLEMENT" && (
                <EntityPlaceAutocomplete
                  isDisabled={autoCmplNameDisabled}
                  value={selectedPlace}
                  placeType={"SETTLEMENT"}
                  addedPlaceEntries={addedPlaceEntries}
                  onValueChange={setSelectedPlace}
                  afterSelectHandler={(entry) => {

                    switch (selectedTypeOption) {
                      case EntityType.SIGHT:
                        break;
                      case EntityType.INSTITUTION:
                        break;
                    }
                  }}
                />
            )}
          </Grid>

          <Grid size={12}>
              <PlaceKindAutocomplete
                isDisabled={autoCmplKindDisabled}
                selectedOption={placeFormData.kind !== null && placeFormData.kind !== undefined ? { label: placeFormData.kind, value: placeFormData.kind } : { label: '', value: ''}}
                allOptions={kindOptions}
                afterSelectHandler={(entry) => {
                }}
              />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={buttonAddNewPlaceEntry} disabled={false} startIcon={<AddIcon />}>
            Ort Hinzufügen
          </Button>

          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={addedPlaceEntries.length === 0}>
            <Badge badgeContent={addedPlaceEntries.length} color="secondary">
              Orte Auszeichnen
            </Badge>
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            Abbrechen
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default EntityPlaceContainer;
