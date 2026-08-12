import { Autocomplete, TextField } from '@mui/material';
import { EditorConstants, EntityType } from '@src/constants/editor';
import HighlightedText from '@src/components/support/HighlightedText';
import React, { useEffect, useMemo, useState } from 'react';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { NewLetterDialogProps } from '../AddNewLetterDialog';

const TeiHeaderWritingPerson = (props: NewLetterDialogProps) => {
  const completionState = props.completionState;
  const selectedOption: SnippetEntity | null = completionState.writerEntity;
  const [people, setPeople] = useState<SnippetEntity[]>([]);

  const setSelectedOption = (value: SnippetEntity | null) => {
    if (value) {
      props.onChange({ writerEntity: value });
    }
  };

  useEffect(() => {
    const fetchDefaultPeople = async () => {
      try {
        const defaultPeople: SnippetEntity[] | undefined = await searchEditortEntities(
          null,
          EntityType.PERSON,
        );

        if (defaultPeople === undefined) {
          enqueueSnackbar('No people found', { variant: 'error' });
        } else {
          setPeople(defaultPeople);
        }
      } catch {
        enqueueSnackbar('Error fetching people', { variant: 'error' });
      }
    };

    void fetchDefaultPeople();
  }, []);

  const searchForPeople = async (inputValue: string) => {
    try {
      const responsePeoples = await searchEditortEntities(inputValue, EntityType.PERSON);

      if (responsePeoples) {
        setPeople(responsePeoples);
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
        variant: 'error',
      });
    }
  };

  const debouncedSearchForPeople = useMemo(
    () => debounce(searchForPeople, 300), // 300ms delay
    [],
  );

  return (
    <>
      <div className="autoSnippetFormRow" style={{ marginTop: '25px', width: '98%' }}>
        <Autocomplete
          disabled={completionState.isFmbLetter}
          options={people}
          value={selectedOption}
          isOptionEqualToValue={(option, value) => option.entityId === value.entityId}
          onChange={(_, newValue) => setSelectedOption(newValue)}
          onInputChange={(_, inputValue, reason) => {
            if (
              inputValue &&
              reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION
            ) {
              void debouncedSearchForPeople(inputValue);
            }
          }}
          getOptionLabel={(option) => option.entityName || ''}
          filterOptions={(options, { inputValue }) =>
            options.filter((option) =>
              option.entityName.toLowerCase().includes(inputValue.toLowerCase()),
            )
          }
          renderOption={(props, option, { inputValue }) => {
            return (
              <li {...props}>
                <div>
                  <HighlightedText text={option.entityName} query={inputValue} />
                </div>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label={'Schreiber Auswählen'} variant="outlined" />
          )}
          fullWidth
        />
      </div>
    </>
  );
};

export default TeiHeaderWritingPerson;
