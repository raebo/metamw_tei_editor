import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { searchAutoAnnoSnippetEntities } from "../../../services/autoAnno.service";
import { isDisabled } from "@testing-library/user-event/dist/utils";
import { SnippetEntity } from "../../../services/mappings/autoAnnoMappings";

interface SnippetFormAutocompleteProps {
  autoJobLetterId: number
  entityType: string
  entityKey:string
  isDisabled: boolean
  setFormEntityKey: (entityKey: string) => void
  setFormEntityType: (entityType: string) => void
}

const SnippetFormAutocomplete = (props: SnippetFormAutocompleteProps) => {

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
        const response = await searchAutoAnnoSnippetEntities(props.autoJobLetterId, inputValue, props.entityType);

        if (response) {
          setOptions(response || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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

export default SnippetFormAutocomplete;