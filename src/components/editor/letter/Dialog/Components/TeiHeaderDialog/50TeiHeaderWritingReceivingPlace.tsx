import { TeiHeaderWritingReceivingPlaceProps } from '../ManageTeiHeaderDialog';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React, { useEffect, useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { EditorConstants, EntityType } from '../../../../../../constants/editor';
import { MiscUtils } from '../../../../../../utils/misc';
import { Autocomplete, TextField } from '@mui/material';
import { searchEditortEntities } from '../../../../../../services/editor/apiLetterRequest.service';
import {EditorUtils} from "../../../../../../utils/editor";
import {fetchMetamwEntityData} from "../../../../../../services/auto_anno/apiMetaMw.service";


const TeiHeaderWritingReceivingPlace = (props: TeiHeaderWritingReceivingPlaceProps) => {

  const completionState = props.completionState
  const [selectedOption, setSelectedOption] = useState<SnippetEntity | null>(null)
  const [places, setPlaces] = useState<SnippetEntity[]>([]);

  const setAutocmplSelectedOption = (settlement: SnippetEntity | null) => {
		if (settlement !== null && settlement.entityKey !== null) {
			fetchMetamwEntityData(settlement.entityKey).then((data) => {
				if (data !== null ) {
					settlement.entityName = data.name || '';
					settlement.entityPlaceCountryName = data.country_name || '';
				}
			})
		}

    if (settlement && props.dialogType === 'writing') {
      props.onChange({ writingPlace: settlement })
    } else if (settlement && props.dialogType === 'receiving') {
      props.onChange({ receivingPlace: settlement })
    }
  }

  useEffect(() => {
		const setInitialSelectedOption = async () => {
			setSelectedOption(props.dialogType === 'writing' ? props.completionState.writingPlace : props.completionState.receivingPlace)
		}

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

		const assignedWritingPlace = async () => {
			const { name, key } = EditorUtils.teiHeaderContent.extractWritingPlace(props.teiHeader)

			if (name && key) {
				const place: SnippetEntity[] | undefined = await searchEditortEntities(key, EntityType.SETTLEMENT)
				if (place && place[0]) {
					setSelectedOption(place[0]);
					props.onChange( { writingPlace: place[0], writingPlaceAutoAvailable: true } )
				}
			}
		}

		const assignedReceivingPlace = async () => {
			const { name, key } = EditorUtils.teiHeaderContent.extractReceivingPlace(props.teiHeader)

			if (name && key) {
				const place: SnippetEntity[] | undefined = await searchEditortEntities(key, EntityType.SETTLEMENT)
				if (place && place[0]) {
					setSelectedOption(place[0]);
					props.onChange( { receivingPlace: place[0], receivingPlaceAutoAvailable: true } )
				}
			}
		}

		void setInitialSelectedOption()
    void fetchDefaultPlaces();
		if (props.dialogType === 'writing') {
			void assignedWritingPlace()
		} else if (props.dialogType === 'receiving') {
			void assignedReceivingPlace()
		}
  }, [props.teiHeader]);

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
      <div className="autoSnippetFormRow" style={ { marginTop: "35px", width: "98%" } }>
        <Autocomplete
          disabled={autoCompleteAvailable()}
          options={places}
          value={selectedOption}
          isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
          onChange={(_, newValue) => setAutocmplSelectedOption(newValue)}
          onInputChange={(_, inputValue, reason) => {
            if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
              void debouncedSearchForPlacess(inputValue);
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
