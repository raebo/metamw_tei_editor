import React, { useEffect, useMemo } from 'react';
import { CountryOption } from '@src/services/mappings/editorMappings';
import { Autocomplete, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PlaceCountryAutocompleteProps {
  isDisabled: boolean;
  afterSelectHandler: (entryData: CountryOption) => void;
  selectedOption: CountryOption | null;
  allOptions: CountryOption[];
}

const PlaceCountryAutocomplete = (props: PlaceCountryAutocompleteProps) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = React.useState<CountryOption | null>(
    props.selectedOption,
  );

  useEffect(() => {
    setSelectedOption(props.selectedOption);
  }, [props.selectedOption]);

  const allOptions = useMemo(() => {
    return props.allOptions;
  }, [props.allOptions]);

  const handleChange = (country: CountryOption | null) => {
    if (country) {
      setSelectedOption(country);
      props.afterSelectHandler(country);
    }
  };

  return (
    <>
      <Autocomplete
        disabled={props.isDisabled}
        options={allOptions}
        getOptionLabel={(country) => country.name ?? ''}
        value={selectedOption ?? undefined}
        onChange={(event, country) => handleChange(country)}
        isOptionEqualToValue={(option, value) => {
          return option.id === value.id;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('editor:dialog.placeContainer.addPlaceDialog.label.chooseCountry')}
            variant="outlined"
          />
        )}
        disableClearable
      />
    </>
  );
};

export default PlaceCountryAutocomplete;
