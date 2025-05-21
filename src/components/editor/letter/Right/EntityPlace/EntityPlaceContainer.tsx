import React, { useEffect, useState } from 'react';
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
import {
  CountryOption,
  MarkupPlaceData,
  MarkupPlaceSettlement,
  SelectCompleteOption
} from '../../../../../services/mappings/editorMappings';
import EntityPlaceAutocomplete from './EntityPlaceAutocomplete';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { setEditorMarkedAndContentLeftRightThunk } from '../../../../../redux/thunks/editor.letter.thunk';
import { enqueueSnackbar } from 'notistack';
import { EntityType} from '../../../../../constants/editor';
import PlaceCountryAutocomplete from './PlaceCountryAutocomplete';
import { EditorUtils } from '../../../../../utils/editor';
import { MiscUtils } from '../../../../../utils/misc';
import PlaceKindAutocomplete from './PlaceKindAutocomplete';
import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import { fetchEntityKey } from '../../../../../services/editor/apiLetterRequest.service';
import {setReloadLetterContent} from "../../../../../redux/slices/editor.letter.slice";

type SelectTypeOption = null | EntityType.SETTLEMENT | EntityType.INSTITUTION | EntityType.SIGHT;

type SelectActionOption = null | 'EXISTING_ENTRY' | 'NEW_ENTRY';



export interface PlaceFormData {
  id?: number | null;
  key: string | null;
  name: string | null;
  placeType: string | null;
  country: CountryOption | null;
  kind: string | null;
  settlement: MarkupPlaceSettlement | null;
  isNewEntry: boolean;
}

const requiredPlaceFormFields: (keyof PlaceFormData)[] = ['key', 'placeType', 'name', 'isNewEntry'];
const allRequiredFieldsPresent = (placeFormData: PlaceFormData): placeFormData is Required<MarkupPlaceData> => {
  return requiredPlaceFormFields.every((field) => placeFormData[field] !== null && placeFormData[field] !== undefined && placeFormData[field] !== '');
};

const blankPlaceFormData: PlaceFormData = { key: '', name: '', placeType: '', country: { id: null, name: null }, kind: '', settlement: null, isNewEntry: false };


const EntityPlaceContainer = (props: EditorContainerProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [placeFormData, setPlaceFormData] = useState<PlaceFormData>({
    key: null,
    name: null,
    placeType: null,
    country: { id: null, name: null },
    kind: null,
    settlement: null,
    isNewEntry: false,
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

  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [kindOptions, setKindOptions] = useState<SelectCompleteOption[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countries = await EditorUtils.placeDataService.fetchCountries();
        setCountryOptions(countries);
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
        setCountryOptions([]);
      }
    };

    const fetchKindOptions= async () => {
      try {
        const kindEntries= await EditorUtils.placeDataService.fetchKindEntries();
        setKindOptions(kindEntries);
      } catch (error) {
        enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
        setCountryOptions([]);
      }
    };

    if (countryOptions.length === 0) { fetchCountries(); }
    if (kindOptions.length === 0) { fetchKindOptions(); }
  }, []);

  const fetchAndSetNewKey = (entityType: SelectTypeOption) => {
    if (entityType === null) {
      return;
    }
    fetchEntityKey(entityType).then((key: string) => {
      setPlaceFormData((prevState) => ({
        ...prevState,
        key: key,
      }))
    }).catch((error) => {
      enqueueSnackbar(`Could not fetch a valid new key for a Place: "${error.message}", please try again"`, { variant: 'error' });
    })
  }

  const handleSelectTypeOption = (option: SelectTypeOption) => {
    setPlaceFormData(blankPlaceFormData)
    handleResetPlace()
    setSelectedTypeOption(option);
    setSelectedActionOption('EXISTING_ENTRY');
    setAutoCmplNameDisabled(false);
    setAutoCmplCountryDisabled(true)

    if (option === EntityType.SIGHT) {
      setAutoCmplKindDisabled(true)

    } else if (option === EntityType.SETTLEMENT) {
      setAutoCmplKindDisabled(true)

    } else if (option === EntityType.INSTITUTION) {
      setAutoCmplKindDisabled(false)
    }
  };

  const handleSelectActionOption = (option: SelectActionOption) => {
    setSelectedActionOption(option);

    if (option === 'NEW_ENTRY') {
      fetchAndSetNewKey(selectedTypeOption)
      setPlaceFormData({...blankPlaceFormData, placeType: selectedTypeOption, isNewEntry: true})
      handleResetPlace();
      setAutoCmplCountryDisabled(true)
    }
    if (selectedTypeOption === EntityType.SETTLEMENT) {
      setPlaceFormData((prev) => ({
        ...prev, kind: ''
      }))
      setAutoCmplCountryDisabled(false)
    }
  };

  const isValidFormData = () : boolean => {
    const validKey = placeFormData.key !== null && placeFormData.key !== undefined && placeFormData.key.length > 0;
    const validName = placeFormData.name !== null && placeFormData.name !== undefined && placeFormData.name.length > 0;
    const validCountry = placeFormData.country !== null && placeFormData.country !== undefined && placeFormData.country.id !== null && placeFormData.country.name !== null;
    const validSettlement = placeFormData.settlement !== null && placeFormData.settlement !== undefined
    const validKind = placeFormData.kind !== null && placeFormData.kind !== undefined && placeFormData.kind.length > 0;

    if ( !validKey || !validName || !validCountry ) {
      return false
    }

    switch (selectedTypeOption) {
      case EntityType.INSTITUTION:
        return (validSettlement)
      case EntityType.SIGHT:
       return (validSettlement)
     case EntityType.SETTLEMENT:
        return true
      default:
        return true
    }
  }

  const removeExistingEntry = (key: string) => {
    setAddedPlaceEntries((prevEntries) => prevEntries.filter((entry: MarkupPlaceData) => entry.key !== key));
  };

  const addNewPlaceEntry = (entry: MarkupPlaceData) => {
    setAddedPlaceEntries((prevEntries) => [...prevEntries, entry]);
  };

  const buttonAddNewPlaceEntry = () => {
    if (isValidFormData() && allRequiredFieldsPresent(placeFormData)) {
      addNewPlaceEntry({
        key: placeFormData.key,
        placeType: placeFormData.placeType,
        name: placeFormData.name,
        country: placeFormData.country,
        kind: checkNewKind(),
        isNewEntry: placeFormData.isNewEntry,
        settlement: placeFormData.settlement
      });

      handleResetPlace()
      setPlaceFormData(blankPlaceFormData);
    }
  };
  
  const checkNewKind = (): string | null => {
    switch (placeFormData.placeType) {
      case EntityType.SIGHT:
        return placeFormData.kind
      case EntityType.INSTITUTION:
        return placeFormData.kind
      case EntityType.SETTLEMENT:
        return 'locality'
      default:
        return null
    }
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
      
      await EditorUtils.placeDataService.handlePlaceDataEntries(
        letterElement,
        {
          id: stateEditorLetter.id!,  // ← assert non-null
          name: stateEditorLetter.name!
        },
        addedPlaceEntries
      )
      
      enqueueSnackbar('Place markup was added successfully', { variant: 'success' });
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
                isNewEntry={false}
                placeType={selectedTypeOption}
                addedPlaceEntries={addedPlaceEntries}
                onValueChange={setSelectedPlace}
                afterSelectHandler={(entry) => {
                  const settlement = entry.settlement

                  switch (selectedTypeOption) {
                    case EntityType.SIGHT:
                      if (settlement !== undefined && settlement !== null) {
                        setPlaceFormData((prevState) => ({
                          ...prevState,
                          placeType: entry.placeType,
                          key: entry.key,
                          name: entry.name,
                          settlement: { key: settlement.key, name: settlement.name, type: settlement.type },
                          country: entry.country,
                        }))
                      }
                      break;
                    case EntityType.SETTLEMENT:
                      setPlaceFormData((prevState) => ({
                        ...prevState,
                        placeType: entry.placeType,
                        key: entry.key,
                        name: entry.name,
                        settlement: { key: entry.key, name: entry.name, type: entry.kind },
                        country: entry.country,
                      }))
                      break
                    case EntityType.INSTITUTION:
                      if (settlement !== undefined && settlement !== null) {
                        setPlaceFormData((prevState) => ({
                          ...prevState,
                          placeType: entry.placeType,
                          key: entry.key,
                          name: entry.name,
                          settlement: { key: settlement.key, name: settlement.name, type: settlement.type },
                          country: entry.country,
                        }))
                        setAutoCmplKindDisabled(false)
                      }
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
              selectedOption={placeFormData.country !== null && placeFormData.country !== undefined ? placeFormData.country : { id: null, name: null }}
              allOptions={countryOptions}
              afterSelectHandler={(entry) => {
                setPlaceFormData((prev) => ({
                  ...prev,
                  country: entry
                }));
              }}
            />
          </Grid>
          <Grid size={12}>
            { ( selectedActionOption === 'EXISTING_ENTRY' || selectedActionOption === null ) && (
              <TextField
                label="Ortschaft"
                variant="outlined"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={ placeFormData.settlement !== null && placeFormData.settlement !== undefined ? placeFormData.settlement.name : '' }
                disabled={true}
              />
            )}
            { selectedActionOption === 'NEW_ENTRY' && selectedTypeOption !== "SETTLEMENT" && (
                <EntityPlaceAutocomplete
                  isDisabled={autoCmplNameDisabled}
                  value={selectedPlace}
                  isNewEntry={true}
                  placeType={"SETTLEMENT"}
                  addedPlaceEntries={addedPlaceEntries}
                  onValueChange={setSelectedPlace}
                  afterSelectHandler={(entry) => {
                    setPlaceFormData((prev) => ({
                      ...prev,
                      settlement: { key: entry.key, name: entry.name, type: entry.kind },
                      country: entry.country
                    }))
                  }}
                />
            )}
          </Grid>

          <Grid size={12}>
              <PlaceKindAutocomplete
                isDisabled={autoCmplKindDisabled}
                selectedOption={placeFormData.kind !== null && placeFormData.kind !== undefined ? { label: placeFormData.kind, value: placeFormData.kind } : { label: '', value: ''}}
                allOptions={kindOptions}
                afterSelectHandler={(kindName: string) => {
                  setPlaceFormData((prev) => ({
                    ...prev,
                    kind: kindName
                  }));
                }}
              />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={buttonAddNewPlaceEntry} disabled={!isValidFormData()} startIcon={<AddIcon />}>
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
      <div>
        <pre>{JSON.stringify(placeFormData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default EntityPlaceContainer;
