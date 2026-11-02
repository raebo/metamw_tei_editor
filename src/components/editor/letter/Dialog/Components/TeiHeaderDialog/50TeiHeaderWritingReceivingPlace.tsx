import { TeiHeaderWritingReceivingPlaceProps } from '../ManageTeiHeaderDialog';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import React, { useEffect, useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { EditorConstants, EntityType } from '@src/constants/editor';
import HighlightedText from '@src/components/support/HighlightedText';
import { Autocomplete, TextField } from '@mui/material';
import { searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';
import { EditorUtils } from '@src/utils/editor';
import { fetchMetamwEntityData } from '@src/services/auto_anno/apiMetaMw.service';

const TeiHeaderWritingReceivingPlace = (props: TeiHeaderWritingReceivingPlaceProps) => {
  const completionState = props.completionState;
  const selectedOption: SnippetEntity | null =
    props.dialogType === 'writing' ? completionState.writingPlace : completionState.receivingPlace;
  const [places, setPlaces] = useState<SnippetEntity[]>([]);
  const { teiHeader, onChange, dialogType } = props;

  const setAutocmplSelectedOption = (settlement: SnippetEntity | null) => {
    if (settlement !== null && settlement.entityKey !== null) {
      fetchMetamwEntityData(settlement.entityKey).then((data) => {
        if (data !== null) {
          settlement.entityName = typeof data.name === 'string' ? data.name : '';
          settlement.entityPlaceCountryName = typeof data.country_name === 'string' ? data.country_name : '';
        }
      });
    }

    if (settlement && dialogType === 'writing') {
      onChange({ writingPlace: settlement });
    } else if (settlement && dialogType === 'receiving') {
      onChange({ receivingPlace: settlement });
    }
  };

  useEffect(() => {
    const fetchDefaultPlaces = async () => {
      try {
        const defaultPlaces: SnippetEntity[] | undefined = await searchEditortEntities(null, EntityType.SETTLEMENT);

        if (defaultPlaces === undefined) {
          enqueueSnackbar('No places found', { variant: 'error' });
        } else {
          setPlaces(defaultPlaces);
        }
      } catch {
        enqueueSnackbar('Error fetching places', { variant: 'error' });
      }
    };

    const assignedWritingPlace = async () => {
      if (!teiHeader) {
        // No TEI header available (e.g. when creating a new letter) -> nothing to extract;
        // a selection already made in completionState must not be touched here.
        return;
      }

      const { name, key } = EditorUtils.teiHeaderContent.extractWritingPlace(teiHeader);

      if (name && key) {
        const place: SnippetEntity[] | undefined = await searchEditortEntities(key, EntityType.SETTLEMENT);
        if (place && place[0]) {
          onChange({ writingPlace: place[0], writingPlaceAutoAvailable: true });
        }
      }
    };

    const assignedReceivingPlace = async () => {
      if (!teiHeader) {
        // No TEI header available (e.g. when creating a new letter) -> nothing to extract;
        // a selection already made in completionState must not be touched here.
        return;
      }

      const { name, key } = EditorUtils.teiHeaderContent.extractReceivingPlace(teiHeader);

      if (name && key) {
        const place: SnippetEntity[] | undefined = await searchEditortEntities(key, EntityType.SETTLEMENT);
        if (place && place[0]) {
          onChange({ receivingPlace: place[0], receivingPlaceAutoAvailable: true });
        }
      }
    };

    void fetchDefaultPlaces();
    if (dialogType === 'writing') {
      void assignedWritingPlace();
    } else if (dialogType === 'receiving') {
      void assignedReceivingPlace();
    }
  }, [teiHeader, onChange, dialogType]);

  const searchForPlacess = async (inputValue: string) => {
    try {
      const responsePlacess = await searchEditortEntities(inputValue, EntityType.SETTLEMENT);

      if (responsePlacess) {
        setPlaces(responsePlacess);
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
        variant: 'error',
      });
    }
  };

  const debouncedSearchForPlacess = useMemo(
    () => debounce(searchForPlacess, 300), // 300ms delay
    [],
  );

  const autoCompleteAvailable = (): boolean => {
    if (props.dialogType === 'writing') {
      return !completionState.writingPlaceAutoAvailable;
    } else if (props.dialogType === 'receiving') {
      return !completionState.receivingPlaceAutoAvailable;
    } else {
      throw new Error('Receiving place auto not available');
    }
  };

  return (
    <>
      <div className="autoSnippetFormRow" style={{ marginTop: '35px', width: '98%' }}>
        <Autocomplete
          disabled={autoCompleteAvailable()}
          options={places}
          value={selectedOption}
          isOptionEqualToValue={(option, value) => option.entityId === value.entityId}
          onChange={(_, newValue) => setAutocmplSelectedOption(newValue)}
          onInputChange={(_, inputValue, reason) => {
            if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
              void debouncedSearchForPlacess(inputValue);
            }
          }}
          getOptionLabel={(option) => option.entityName || ''}
          filterOptions={(serverOptions) => serverOptions}
          renderOption={(props, option, { inputValue }) => {
            return (
              <li {...props}>
                <div>
                  <HighlightedText text={option.entityName} query={inputValue} matchIndividualTerms />
                </div>
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label={props.textFieldValue} variant="outlined" />}
          fullWidth
        />
      </div>
    </>
  );
};

export default TeiHeaderWritingReceivingPlace;
