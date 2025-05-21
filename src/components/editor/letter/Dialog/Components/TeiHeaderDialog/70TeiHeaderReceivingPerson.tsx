import { TeiHeaderDialogProps } from '../AddTeiHeaderDialog';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React, { useEffect, useMemo, useState } from 'react';
import { searchEditortEntities } from '../../../../../../services/editor/apiLetterRequest.service';
import { EditorConstants, EntityType } from '../../../../../../constants/editor';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { Autocomplete, TextField } from '@mui/material';
import { MiscUtils } from '../../../../../../utils/misc';

const TeiHeaderReceivingPerson = (props: TeiHeaderDialogProps) => {

  const completionState = props.completionState
  const selectedOption: SnippetEntity | null = completionState.receiverEntity
  const [people, setPeople] = useState<SnippetEntity[]>([]);

  const setSelectedOption = (value: SnippetEntity | null) => {
    if (value) {
      props.onChange({ receiverEntity: value })
    }
  }

  useEffect(() => {
    const fetchDefaultPeople = async () => {
      try {
        const defaultPeople: SnippetEntity[] | undefined = await searchEditortEntities(null, EntityType.PERSON)

        if (defaultPeople === undefined) {
          enqueueSnackbar("No people found", { variant:"error" });
        } else {
          setPeople(defaultPeople);
        }
      } catch (error) {
        enqueueSnackbar("Error fetching people", { variant:"error" });
      }
    };

    fetchDefaultPeople();
  }, []);


  const searchForPeople = async (inputValue: string) => {
    try {
      const responsePeoples = await searchEditortEntities(inputValue, EntityType.PERSON)

      if (responsePeoples) {
        setPeople(responsePeoples);
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
    }
  }

  const debouncedSearchForPeople = useMemo(
    () => debounce(searchForPeople, 300), // 300ms delay
    []
  );

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <Autocomplete
          disabled={false}
          options={people}
          value={selectedOption}
          isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
          onChange={(_, newValue) => setSelectedOption(newValue)}
          onInputChange={(_, inputValue, reason) => {
            if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
              debouncedSearchForPeople(inputValue);
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
            <TextField {...params} label={ "Empfänger Auswählen"} variant="outlined" />
          )}
          fullWidth
        />
      </div>
    </>
  )
}

export default TeiHeaderReceivingPerson
