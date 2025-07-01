import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { searchEditortEntities } from '../../../../../services/editor/apiLetterRequest.service';
import { EditorConstants, EntityType } from '../../../../../constants/editor';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { Autocomplete, TextField } from '@mui/material';
import { MiscUtils } from '../../../../../utils/misc';
import { MarkupPersonData } from '../../../../../services/mappings/editorMappings';

interface EntityPersonAutocompleteProps {
  isDisabled: boolean;
  afterSelectHandler: (entry: SnippetEntity) => void;
  addedPersonEntries: MarkupPersonData[];
}

const EntityPersonAutocomplete = (props: EntityPersonAutocompleteProps) => {

  const [autocompletePeople, setAutocompletePeople] = useState<SnippetEntity[]>([]);
  const entriesToExclude = useMemo(() => {
    return new Set(props.addedPersonEntries.map(item => item.key));
  }, [props.addedPersonEntries]);

  useEffect(() => {
    const fetchDefaultPeople = async () => {
      try {
        const defaultPeople: SnippetEntity[] | undefined = await searchEditortEntities(null, EntityType.PERSON)

        if (defaultPeople === undefined) {
          enqueueSnackbar("No people found", { variant:"error" });
        } else {
          setAutocompletePeople(defaultPeople.filter(item => !entriesToExclude.has(item.entityKey)));
        }
      } catch (error) {
        enqueueSnackbar("Error fetching people", { variant:"error" });
      }
    };

    fetchDefaultPeople();
  }, []);

  const searchForPeople = useCallback(
    debounce(async (inputValue: string) => {
      try {
        const responsePeoples: SnippetEntity[] | undefined = await searchEditortEntities(inputValue, EntityType.PERSON);

        if (responsePeoples) {
          const excludeKeys = new Set(props.addedPersonEntries.map(item => item.key));
          setAutocompletePeople(responsePeoples.filter(item => !excludeKeys.has(item.entityKey)));
        }
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
      }
    }, 300),
    [props.addedPersonEntries]
  );

  const setAutoCompletePerson = (entry: SnippetEntity | null) => {
    if (entry) {
      props.afterSelectHandler(entry)
    }
  }

  return (
    <>
      <Autocomplete
        disabled={ props.isDisabled }
        options={ autocompletePeople }
        isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
        onChange={(_, newValue) => setAutoCompletePerson(newValue)}
        onInputChange={(_, inputValue, reason) => {
          if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
            searchForPeople(inputValue)
          }
        }}
        getOptionLabel={() => ''}
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
  );
}

export default EntityPersonAutocomplete;
