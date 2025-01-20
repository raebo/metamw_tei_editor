import { InputAdornment, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { SearchRounded } from "@mui/icons-material";

const SearchInputField = (
  props: {
    searchValue: string,
    onChange: (event :  React.ChangeEvent<HTMLInputElement>) => void,
    onKeyDown: (event : React.KeyboardEvent<HTMLInputElement>) => void }) => (
  <>
    <TextField
      fullWidth={true}
      onChange={props.onChange}
      value={props.searchValue}
      id="input-search-letters"
      variant="standard"
      label="Search letters"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded/>
            </InputAdornment>
          ),
        },
      }}
      onKeyDown={props.onKeyDown}
    />
  </>
);

interface SearchLettersProps {
  handleSearch: (searchValue: string) => void;
  defaultSearchValue?: string;
}

const SearchLetters= (props: (SearchLettersProps)) => {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (props.defaultSearchValue !== undefined) {
      setSearchValue(props.defaultSearchValue);
    }
  }, [props.defaultSearchValue]);


  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()

      if (searchValue.length > 1) {
        props.handleSearch(searchValue);
      }
    }
  };

  const handleSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  return (
    <>
      <SearchInputField
        searchValue={searchValue}
        onChange={(event) => handleSearchChanged(event) }
        onKeyDown={(event) => handleKeyDown(event) } />
    </>
  );
};

export default React.memo(SearchLetters);
