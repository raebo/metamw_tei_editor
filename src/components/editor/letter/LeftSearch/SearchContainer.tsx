import SearchLetters from "../../index/SearchLetters";
import React, { useCallback, useState } from "react";
import { fetchSearchLetters } from "../../../../services/editor/apiLettersRequest.service";
import { EditorLetter } from "../../../../services/mappings/editorMappings";
import Grid from "@mui/material/Grid2";
import LetterCard from "../../index/LetterCard";
import SearchResultEntry from "./SearchResultEntry";
import { setAutoAnnoSnippet } from "../../../../redux/slices/auto.letter.snippet.slice";
import { useDispatch } from "react-redux";
import { setEditorLetter } from "../../../../redux/slices/editor.letter.slice";

const SearchContainer = () => {

  const dispatch = useDispatch();
  const [textfieldSearchValue, setTextfieldSearchValue] = useState("");
  const [letterSearchResults, setLetterSearchResults] = useState<EditorLetter[] | undefined>();

  const handleSearch = async (searchValue: string) => {
    const searchResult = await fetchSearchLetters(searchValue);
    setLetterSearchResults(searchResult)
    // setTextfieldSearchValue(searchValue)
  }

  const handleClick = useCallback((letterId: number, letterName: string) => {
    dispatch(setEditorLetter( { letter: { id: letterId, name: letterName } } ))
  }, [dispatch]);

  return (
    <>
      <div className={"editor-search-letters"}>
        <SearchLetters handleSearch={handleSearch} defaultSearchValue={textfieldSearchValue}/>
      </div>
      <div>
        { letterSearchResults ? (
          letterSearchResults.map((letter) => {
            return (
              <Grid key={`lastLetters_${letter.id}`} size={2}>
                <SearchResultEntry letter={letter} clickHandler={handleClick} />
              </Grid>
            )
          })
        ) : (
          <></>
        )}
      </div>
    </>
  )
}

export default SearchContainer;
