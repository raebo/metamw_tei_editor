import React, { useEffect, useMemo } from 'react';
import { SelectCompleteOption } from '@src/services/mappings/editorMappings';
import { Autocomplete, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PlaceKindAutocompleteProps {
  isDisabled: boolean;
  afterSelectHandler: (kindName: string) => void;
  selectedOption: SelectCompleteOption | null;
  allOptions: SelectCompleteOption[];
}

function isValidOption(option: any): option is SelectCompleteOption {
  return option && typeof option === 'object' && 'value' in option && 'label' in option;
}

const PlaceKindAutocomplete = (props: PlaceKindAutocompleteProps) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = React.useState<SelectCompleteOption | null>(
    props.selectedOption,
  );

  useEffect(() => {
    if (isValidOption(props.selectedOption)) {
      setSelectedOption(props.selectedOption);
    } else {
      setSelectedOption(null);
    }
  }, [props.selectedOption]);

  const allOptions = useMemo(() => {
    return props.allOptions;
  }, [props.allOptions]);

  const handleChange = (kind: SelectCompleteOption | null) => {
    if (kind !== null) {
      setSelectedOption(kind);
      props.afterSelectHandler?.(kind.label);
    }
  };

  return (
    <>
      <Autocomplete
        freeSolo
        disabled={props.isDisabled}
        options={allOptions}
        getOptionLabel={(option) => {
          return typeof option === 'string' ? option : option.label;
        }}
        value={selectedOption ?? undefined}
        onChange={(event, newValue) => {
          if (typeof newValue === 'string') {
            // User typed a custom value
            handleChange({ label: newValue, value: newValue });
          } else if (newValue) {
            handleChange(newValue);
          } else {
            handleChange(null);
          }
        }}
        isOptionEqualToValue={(option, value) => {
          if (!value) return false;
          return option.value === value.value;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('editor:dialog.placeContainer.addPlaceDialog.label.chooseReference')}
            variant="outlined"
          />
        )}
        disableClearable
      />
    </>
  );
};

export default PlaceKindAutocomplete;
