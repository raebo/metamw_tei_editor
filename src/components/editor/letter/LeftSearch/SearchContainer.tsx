import SearchLetters from "../../index/SearchLetters";
import React, { useCallback, useEffect, useState } from "react";
import { fetchSearchLetters } from "../../../../services/editor/apiLettersRequest.service";
import { EditorLetter } from "../../../../services/mappings/editorMappings";
import Grid from "@mui/material/Grid2";
import SearchResultEntry from "./SearchResultEntry";
import {  useSelector } from "react-redux";
import {
  setEditorPinnedLetters,
  setEditorSearchValue
} from "../../../../redux/slices/editor.letter.slice";
import { RootState } from "../../../../redux/redux.store";
import { useAppDispatch } from "../../../../redux/hooks";

const SearchContainer = () => {

  const dispatch = useAppDispatch();
  const stateEditorSearchValue = useSelector((state: RootState) => state.editorLetter.searchValue)
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (searchValue: string) => {
    const searchResult = await fetchSearchLetters(searchValue);
    setLetterSearchResults(searchResult)
    dispatch(setEditorSearchValue({ searchValue: searchValue }))
  }

  const handleClick = useCallback((letterId: number, letterName: string) => {
    if (statePinnedLetters.length > 0) {
      let firstLetter = statePinnedLetters[0]

      if (firstLetter.isPinned) {
        dispatch(setEditorPinnedLetters(
          {
            pinnedLetters: [
              { id: letterId, name: letterName, isPinned: false },
              ...statePinnedLetters,
            ]
          }
        ))
      } else {
        dispatch(setEditorPinnedLetters(
          {
            pinnedLetters:
              [
                { id: letterId, name: letterName, isPinned: false },
                ...statePinnedLetters.slice(1), // Add the rest of the array after the first element
              ]
          }
        ))
      }
    }
  }, [dispatch, statePinnedLetters]);

  return (
    <>
      <div className={"editor-search-letters"}>
        <SearchLetters
          handleSearch={handleSearch}
          defaultSearchValue={textfieldSearchValue}/>
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
