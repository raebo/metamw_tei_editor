import { TeiHeaderWritingReceivingPlaceProps } from '../AddTeiHeaderDialog';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React, { useEffect, useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash';
import { EditorConstants, EntityType } from '../../../../../../constants/editor';
import { MiscUtils } from '../../../../../../utils/misc';
import { Autocomplete, TextField } from '@mui/material';
import { searchEditortEntities } from '../../../../../../services/editor/apiLetterRequest.service';


const TeiHeaderWritingReceivingPlace = (props: TeiHeaderWritingReceivingPlaceProps) => {

  const completionState = props.completionState
  const selectedOption: SnippetEntity | null = props.dialogType === 'writing' ? props.completionState.writingPlace : props.completionState.receivingPlace
  const [places, setPlaces] = useState<SnippetEntity[]>([]);

  const setSelectedOption = (value: SnippetEntity | null) => {
    if (value && props.dialogType === 'writing') {
      console.log("writing place selected", value)
      props.onChange({ writingPlace: value })
    } else if (value && props.dialogType === 'receiving') {
      console.log("receiving place selected", value)
      props.onChange({ receivingPlace: value })
    }
  }

  useEffect(() => {
    const fetchDefaultPlaces = async () => {
      try {
        const defaultPlaces: SnippetEntity[] | undefined = await searchEditortEntities(null, EntityType.SETTLEMENT)

        if (defaultPlaces === undefined) {
          enqueueSnackbar("No places found", { variant:"error" });
        } else {
          setPlaces(defaultPlaces);
        }
      } catch (error) {
        enqueueSnackbar("Error fetching places", { variant:"error" });
      }
    };

    fetchDefaultPlaces();
  }, []);

  const searchForPlacess = async (inputValue: string) => {
    try {
      const responsePlacess = await searchEditortEntities(inputValue, EntityType.SETTLEMENT)

      if (responsePlacess) {
        setPlaces(responsePlacess);
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
    }
  }

  const debouncedSearchForPlacess = useMemo(
    () => debounce(searchForPlacess, 300), // 300ms delay
    []
  );

  const autoCompleteAvailable = ():boolean => {
    if (props.dialogType === 'writing') {
      return !completionState.writingPlaceAutoAvailable
    } else if (props.dialogType === 'receiving') {
      return !completionState.receivingPlaceAutoAvailable
    } else {
      throw new Error('Receiving place auto not available')
    }
  }

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Autocomplete
          disabled={autoCompleteAvailable()}
          options={places}
          value={selectedOption}
          isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
          onChange={(_, newValue) => setSelectedOption(newValue)}
          onInputChange={(_, inputValue, reason) => {
            if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
              debouncedSearchForPlacess(inputValue);
            }
          }}
          getOptionLabel={(option) => option.entityName || ''}
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
            <TextField {...params} label={ props.textFieldValue } variant="outlined" />
          )}
          fullWidth
        />
      </div>
    </>
  )
}

export default TeiHeaderWritingReceivingPlace
