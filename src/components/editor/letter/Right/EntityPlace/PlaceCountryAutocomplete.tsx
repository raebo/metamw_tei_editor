import React, { useEffect, useMemo } from 'react';
import { SelectCompleteOption } from '../../../../../services/mappings/editorMappings';
import { Autocomplete, TextField } from '@mui/material';

interface PlaceCountryAutocompleteProps {
  isDisabled: boolean
  afterSelectHandler: (entryData: {}) => void;
  selectedOption: SelectCompleteOption | null
  allOptions: SelectCompleteOption[]
}

function isValidOption(option: any): option is SelectCompleteOption {
  return option && typeof option === "object" && "value" in option && "label" in option;
}

const PlaceCountryAutocomplete = (props: PlaceCountryAutocompleteProps) => {

  const [selectedOption, setSelectedOption] = React.useState<SelectCompleteOption | null>(props.selectedOption);

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


  const handleChange = ( country: SelectCompleteOption | null) => {
    setSelectedOption(country);
    props.afterSelectHandler?.(country ?? {});
  }

  return (
    <>
      <Autocomplete
        disabled={props.isDisabled}
        options={allOptions}
        getOptionLabel={(option) => {
          return option.label
        }}
        value={selectedOption ?? undefined}
        onChange={(event, country) => handleChange(country)}
        isOptionEqualToValue={(option, value) => {
          return option.value === value.value;
        }}
        renderInput={(params) => <TextField {...params} label="Auswahl Land" variant="outlined" />}
        disableClearable
      />
    </>
  )
}

export default PlaceCountryAutocomplete
