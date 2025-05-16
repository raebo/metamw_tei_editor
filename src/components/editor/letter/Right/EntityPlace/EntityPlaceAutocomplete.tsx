import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import { MarkupPlaceData } from '../../../../../services/mappings/editorMappings';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { searchEditortEntities } from '../../../../../services/editor/apiLetterRequest.service';
import { debounce } from 'lodash';
import { EditorConstants, EntityType } from '../../../../../constants/editor';
import { Autocomplete, TextField } from '@mui/material';
import { MiscUtils } from '../../../../../utils/misc';
import { fetchMetamwEntityData } from '../../../../../services/auto_anno/apiMetaMw.service';
import { PlaceFormData } from './EntityPlaceContainer';

interface EntityPlaceAutocompleteProps {
  isDisabled: boolean
  placeType: null | "SIGHT" | "INSTITUTION" | "SETTLEMENT"
  isNewEntry: boolean
  value: SnippetEntity | null
  afterSelectHandler: (entryData: PlaceFormData) => void;
  addedPlaceEntries: MarkupPlaceData[]
  onValueChange: (value: SnippetEntity | null) => void;
}

const EntityPlaceAutocomplete = (props: EntityPlaceAutocompleteProps) => {

  const latestProps = useRef(props);
  const [isNewEntry, setIsNewEntry] = useState(props.isNewEntry);
  const [autocompletePlaces, setAutocompletePlaces] = useState<SnippetEntity[]>([]);
  const entriesToExclude = useMemo(() => {
    return new Set(props.addedPlaceEntries.map(item => item.key))
  }, [props.addedPlaceEntries, props.placeType]);

  useEffect(() => {
    const fetchDefaultPlaces = async (placeType: "SIGHT" | "INSTITUTION" | "SETTLEMENT") => {
      try {
        const defaultPlaces: SnippetEntity[] | undefined = await searchEditortEntities(null, placeType)

        if (defaultPlaces === undefined) {
          enqueueSnackbar("No places found", { variant:"error" });
        } else {
          setAutocompletePlaces(defaultPlaces.filter(item => !entriesToExclude.has(item.entityKey)));
        }
      } catch (error) {
        enqueueSnackbar("Error fetching places", { variant:"error" });
      }
    }

    latestProps.current = props; // keep ref up to date

    if (latestProps.current.placeType !== null) {
      fetchDefaultPlaces(latestProps.current.placeType)
    }
    setIsNewEntry(latestProps.current.isNewEntry)
  }, [props]);

  const searchForPlaces = useCallback(
    debounce(async (inputValue: string) => {
      const currentProps = latestProps.current;
      try {
        if (currentProps.placeType === null) {
          throw new Error("Place type is null");
        }

        const responsePlaces: SnippetEntity[] | undefined = await searchEditortEntities(inputValue, currentProps.placeType);

        if (responsePlaces) {
          const excludeKeys = new Set(props.addedPlaceEntries.map(item => item.key));
          setAutocompletePlaces(responsePlaces.filter(item => !excludeKeys.has(item.entityKey)));
        }
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
      }
    }, 300),
    [props.addedPlaceEntries]
  );

  const setAutoCompletePlace = async (entry: SnippetEntity | null) => {
    if (entry) {
      try {
        const response = await fetchMetamwEntityData(entry.entityKey)

        if (!response) {
          enqueueSnackbar("No data found", { variant:"error" });
          return;
        }

        switch (latestProps.current.placeType) {
          case EntityType.SETTLEMENT:
            props.afterSelectHandler({
              id: response.id,
              key: response.key,
              name: response.name,
              placeType: latestProps.current.placeType,
              country: { label: response?.country_name, value: response?.country_id },
              kind: null,
              settlement: null,
              isNewEntry: isNewEntry
            })
            break
          case EntityType.SIGHT:
            props.afterSelectHandler({
              id: response.id,
              key: response.key,
              name: response.name,
              placeType: latestProps.current.placeType,
              country: { label: response?.country_name, value: response?.country_id },
              kind: null,
              settlement: response.misc_only_settlement_name,
              isNewEntry: isNewEntry
            })
            break
          case EntityType.INSTITUTION:

            console.log("response country_id: ", response)

            props.afterSelectHandler({
              id: response.id,
              key: response.key,
              name: response.name,
              placeType: latestProps.current.placeType,
              country: { label: response?.country_name, value: response?.country_id },
              kind: response?.kind,
              settlement: response.misc_only_settlement_name,
              isNewEntry: isNewEntry
            })
            break;
          default:
            throw new Error('Place type is not supported')

        }
      } catch (error) {
        enqueueSnackbar(`Error fetching place data for '${entry.entityKey}'`, { variant:"error" });
      }
    }
  }

  return (
    <>
      <Autocomplete
        disabled={ props.isDisabled }
        value={props.value}
        options={ autocompletePlaces }
        isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
        onChange={(_, newValue) => {
          props.onValueChange(newValue);
          setAutoCompletePlace(newValue)
        }}
        onInputChange={(_, inputValue, reason) => {
          if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
            searchForPlaces(inputValue)
          }
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option?.entityName ?? '';
        }}
        filterOptions={(options, { inputValue }) =>
          options.filter((option) =>
            option.entityName.toLowerCase().includes(inputValue.toLowerCase())
          )
        }
        renderOption={(props, option, { inputValue }) => {
          return (
            <li {...props}>
              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: MiscUtils.stringHandling.highlightText(option.entityName, inputValue)
                  }}
                />
              </div>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField {...params} label={ "Eintrag Auswählen"} variant="outlined" />
        )}
        fullWidth
      />
    </>
  )
}

export default EntityPlaceAutocomplete
