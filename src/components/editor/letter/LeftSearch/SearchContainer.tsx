import SearchLetters from "../../index/SearchLetters";
import React, { useCallback, useEffect, useState } from "react";
import { fetchSearchLetters } from "../../../../services/editor/apiLettersRequest.service";
import { EditorLetter } from "../../../../services/mappings/editorMappings";
import Grid from "@mui/material/Grid2";
import LetterCard from "../../index/LetterCard";
import SearchResultEntry from "./SearchResultEntry";
import { setAutoAnnoSnippet } from "../../../../redux/slices/auto.letter.snippet.slice";
import { useDispatch, useSelector } from "react-redux";
import { setEditorLetter, setEditorSearchValue } from "../../../../redux/slices/editor.letter.slice";
import { RootState } from "../../../../redux/redux.store";

const SearchContainer = () => {

  const dispatch = useDispatch();
  const stateEditorSearchValue = useSelector((state: RootState) => state.editorLetter.searchValue)
  const [textfieldSearchValue, setTextfieldSearchValue] = useState("");
  const [letterSearchResults, setLetterSearchResults] = useState<EditorLetter[] | undefined>();

  useEffect(() => {
    const checkForExistingSearch = () => {
      if (stateEditorSearchValue) {
        setTextfieldSearchValue(stateEditorSearchValue)

        fetchSearchLetters(stateEditorSearchValue).then((searchResult) => {
          if (searchResult) {
            setLetterSearchResults(searchResult)
          }
        })
      }
    }

    checkForExistingSearch()
  }, []);


  const handleSearch = async (searchValue: string) => {
    const searchResult = await fetchSearchLetters(searchValue);
    setLetterSearchResults(searchResult)
    dispatch(setEditorSearchValue({ searchValue: searchValue }))
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
