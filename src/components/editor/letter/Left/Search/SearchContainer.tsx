import SearchLetters from '../../../index/SearchLetters';
import React, { useCallback, useEffect, useState } from 'react';
import { fetchSearchLetters } from '../../../../../services/editor/apiLettersRequest.service';
import { EditorLetter } from '../../../../../services/mappings/editorMappings';
import Grid from '@mui/material/Grid';
import SearchResultEntry from './SearchResultEntry';
import { useSelector } from 'react-redux';
import {
  setEditorLetter,
  setEditorPinnedLetters,
  setEditorSearchValue,
  setEditorTabNumber,
  setReloadLetterContent,
} from '../../../../../redux/slices/editor.letter.slice';
import { RootState } from '../../../../../redux/redux.store';
import { useAppDispatch } from '../../../../../redux/hooks';
import { EditorUtils } from '../../../../../utils/editor';
import { setEditorTabAndPinnedLetterThunk } from '@src/redux/thunks/editor.letter.thunk';

const SearchContainer = () => {
  const dispatch = useAppDispatch();
  const stateEditorSearchValue = useSelector((state: RootState) => state.editorLetter.searchValue);
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);

  const [textfieldSearchValue, setTextfieldSearchValue] = useState('');
  const [letterSearchResults, setLetterSearchResults] = useState<EditorLetter[] | undefined>();

  useEffect(() => {
    const checkForExistingSearch = () => {
      if (stateEditorSearchValue) {
        setTextfieldSearchValue(stateEditorSearchValue);

        fetchSearchLetters(stateEditorSearchValue).then((searchResult) => {
          if (searchResult) {
            setLetterSearchResults(searchResult);
          }
        });
      }
    };
    checkForExistingSearch();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (searchValue: string) => {
    const searchResult = await fetchSearchLetters(searchValue);
    setLetterSearchResults(searchResult);
    dispatch(setEditorSearchValue({ searchValue: searchValue }));
  };

  const handleClick = useCallback(
    (letterId: number, letterName: string) => {
      const newPinnedLetters = EditorUtils.pinnedLetters.computeNewPinnedLetters(statePinnedLetters, {
        id: letterId,
        name: letterName,
        isPinned: null,
        viewMode: 'WYSIWYG',
      });

      dispatch(setEditorPinnedLetters({ pinnedLetters: newPinnedLetters }));
      dispatch(
        setEditorTabAndPinnedLetterThunk({
          letter: {
            id: letterId,
            name: letterName,
            viewMode: 'WYSIWYG',
            xmlContent: null,
          },
          tabNumber: 0,
          textIsMarked: false,
        }),
      );
    },
    [dispatch, statePinnedLetters],
  );

  return (
    <>
      <div className={'editor-search-letters'}>
        <SearchLetters handleSearch={handleSearch} defaultSearchValue={textfieldSearchValue} />
      </div>
      <div>
        {letterSearchResults ? (
          letterSearchResults.map((letter) => {
            return (
              <Grid key={`lastLetters_${letter.id}`} size={2}>
                <SearchResultEntry letter={letter} clickHandler={handleClick} />
              </Grid>
            );
          })
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default SearchContainer;
