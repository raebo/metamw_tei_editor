import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import React, { useCallback, useEffect, useState } from 'react';
import { searchEditortEntities } from '../../../../../services/editor/apiLetterRequest.service';
import { EditorConstants, EntityType } from '../../../../../constants/editor';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import { Autocomplete, TextField } from '@mui/material';
import { MiscUtils } from '../../../../../utils/misc';
import { useTranslation } from 'react-i18next';

interface EntityAuthorAutocompleteProps {
  isDisabled: boolean;
  afterSelectHandler: (entry: SnippetEntity) => void;
}

const EntityAuthorAutocomplete = (props: EntityAuthorAutocompleteProps) => {
  const { t } = useTranslation();
  const [autocompletePeople, setAutocompletePeople] = useState<SnippetEntity[]>([]);

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
          setAutocompletePeople(defaultPeople);
        }
      } catch (error) {
        enqueueSnackbar('Error fetching people', { variant: 'error' });
      }
    };

    fetchDefaultPeople();
  }, []);

  const searchForPeople = useCallback(
    debounce(async (inputValue: string) => {
      try {
        const responsePeoples: SnippetEntity[] | undefined = await searchEditortEntities(
          inputValue,
          EntityType.PERSON,
        );

        if (responsePeoples) {
          setAutocompletePeople(responsePeoples);
        }
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
          variant: 'error',
        });
      }
    }, 300),
    [],
  );

  const setAutoCompletePerson = (entry: SnippetEntity | null) => {
    if (entry) {
      props.afterSelectHandler(entry);
    }
  };

  return (
    <>
      <Autocomplete
        disabled={props.isDisabled}
        options={autocompletePeople}
        isOptionEqualToValue={(option, value) => option.entityId === value.entityId}
        onChange={(_, newValue) => setAutoCompletePerson(newValue)}
        onInputChange={(_, inputValue, reason) => {
          if (
            inputValue &&
            reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION
          ) {
            searchForPeople(inputValue);
          }
        }}
        getOptionLabel={() => ''}
        filterOptions={(options, { inputValue }) =>
          options.filter((option) =>
            option.entityName.toLowerCase().includes(inputValue.toLowerCase()),
          )
        }
        renderOption={(props, option, { inputValue }) => {
          return (
            <li {...props}>
              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: MiscUtils.stringHandling.highlightText(option.entityName, inputValue),
                  }}
                />
              </div>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('editor:dialog.autocomplete.chooseEntry')}
            variant="outlined"
          />
        )}
        fullWidth
      />
    </>
  );
};

export default EntityAuthorAutocomplete;
