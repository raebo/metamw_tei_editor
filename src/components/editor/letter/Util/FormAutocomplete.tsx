import React, { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { searchEditortEntities } from '../../../../services/editor/apiLetterRequest.service';
import { SnippetEntity } from '../../../../services/mappings/autoAnnoMappings';

interface FormAutocompleteProps {
  entityType: string
  entityKey:string | null | undefined
  isDisabled: boolean
  setFormEntityKey: (entityKey: string) => void
  afterClickHandler?: (keyValue: string) => void
}

const FormAutocomplete = (props: FormAutocompleteProps) => {

  const [options, setOptions] = useState<SnippetEntity[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inputValue.trim() === "") {
      setOptions([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await searchEditortEntities(inputValue, props.entityType);

        if (response) {
          setOptions(response || []);
        }
      } catch (error) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchData, 300); // Debounce API calls
    return () => clearTimeout(debounceTimeout); // Cleanup on new input
  }, [inputValue]);

  return (
    <>
      <Autocomplete
        freeSolo={false}
        disabled={props.isDisabled}
        options={options} // Dynamic options
        loading={loading} // Display loading indicator
        onInputChange={(event, value) => setInputValue(value)} // Update input value
        onChange={(event, value) => {
          if (value && typeof value !== 'string') {
            props.setFormEntityKey(value.entityKey); // Store the ID in state or pass it to a parent component
            props.afterClickHandler?.(value.entityKey);
          } else {
            props.setFormEntityKey(""); // Handle the case where no valid selection is made
          }
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.entityKey}>
            <strong>{option.entityName}</strong>
          </li>
        )}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.entityName)}
        renderInput={(params) => (
          <TextField
            sx={{ m: 1, width: '100%'}}
            {...params}
            label="Suche"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </>
  )
}

export default FormAutocomplete;
