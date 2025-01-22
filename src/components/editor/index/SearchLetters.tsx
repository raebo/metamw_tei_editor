import { InputAdornment, TextField } from "@mui/material";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { SearchRounded } from "@mui/icons-material";

const SearchInputField = forwardRef<HTMLInputElement, {
  searchValue: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}>(({ searchValue, onChange, onKeyDown }, ref) => (
  <TextField
    fullWidth
    onChange={onChange}
    value={searchValue}
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
        inputRef: ref, // setFocus on field
      },
    }}
    onKeyDown={onKeyDown}
  />
));

interface SearchLettersProps {
  handleSearch: (searchValue: string) => void;
  defaultSearchValue?: string;
}

const SearchLetters= (props: (SearchLettersProps)) => {
  const searchInputRef = useRef<HTMLInputElement>(null); // for setting the focus on the search field
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (props.defaultSearchValue !== undefined) {
      setSearchValue(props.defaultSearchValue);
    }
  }, [props.defaultSearchValue]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchInputRef]);

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
        ref={searchInputRef}
        searchValue={searchValue}
        onChange={(event) => handleSearchChanged(event) }
        onKeyDown={(event) => handleKeyDown(event) } />
    </>
  );
};

export default React.memo(SearchLetters);
