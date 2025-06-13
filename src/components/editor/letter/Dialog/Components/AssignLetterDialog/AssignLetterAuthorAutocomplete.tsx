import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { EditorConstants } from '../../../../../../constants/editor';
import { MiscUtils } from '../../../../../../utils/misc';

interface AssignLetterAuthorAutocompleteProps {
  disabled: boolean,
  options: SnippetEntity[],
  onValueChange: (author: SnippetEntity | null) => void,
  onInputChangeHandler: (value: string) => void,
  inputPlaceHolder: string,
}

const AssignLetterAuthorAutocomplete = (props: AssignLetterAuthorAutocompleteProps) => {

  const onValueChange = (entity: SnippetEntity | null) => {
    props.onValueChange(entity);
  }

  const onInputChange = (input: string) => {
    props.onInputChangeHandler(input);
  }

  return (
    <>
      <Autocomplete
        disabled={ props.disabled }
        options={ props.options }
        isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
        onChange={(_, newValue) => onValueChange(newValue)}
        onInputChange={(_, inputValue, reason) => {
          if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
            onInputChange(inputValue)
          }
        }}
        getOptionLabel={(option) => option?.entityDisplayName || ''}
        filterOptions={(options, { inputValue }) =>
          options.filter((option) =>
            option.entityDisplayName.toLowerCase().includes(inputValue.toLowerCase())
          )
        }
        renderOption={(props, option, { inputValue }) => {
          return (
            <li {...props}>
              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: MiscUtils.stringHandling.highlightText(option.entityDisplayName, inputValue)
                  }}
                />
              </div>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField {...params} label={ props.inputPlaceHolder } variant="outlined" />
        )}
        fullWidth
      />

    </>
  );
}

export default AssignLetterAuthorAutocomplete;
