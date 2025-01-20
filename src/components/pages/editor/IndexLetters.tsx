import Grid from "@mui/material/Grid2";
import { Box, styled } from "@mui/material";
import Paper from "@mui/material/Paper";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { RootState } from "../../../redux/redux.store";
import { EditorLetter } from "../../../services/mappings/editorMappings";
import { fetchLastUsedLettersByUser, fetchSearchLetters } from "../../../services/editor/apiLettersRequest.service";
import LetterCard from "../../editor/index/LetterCard";
import SearchLetters from "../../editor/index/SearchLetters";


const IndexLetters = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [lettersByAuthor, setLettersByAuthor] = useState<EditorLetter[] | undefined>()
  const [textfieldSearchValue, setTextfieldSearchValue] = useState("");
  const [letterSearchResults, setLetterSearchResults] = useState<EditorLetter[] | undefined>();

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    ...theme.applyStyles('dark', {
      backgroundColor: '#1A2027',
    }),
  }));

  useEffect(() => {
    const getData = async () => {
      try {
        if (user === null) { throw new Error("User is not set! Please login") }

        const lastUserLetters = await fetchLastUsedLettersByUser(user.id);

        if (lastUserLetters) { setLettersByAuthor(lastUserLetters) }

      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' } );
      } finally {
        // setLoading(false);
      }
    };

    getData();
  }, [user]);

  const handleSearch = async (searchValue: string) => {
    const searchResult = await fetchSearchLetters(searchValue);
    if (searchResult?.any) {
      setLetterSearchResults(searchResult)
      setTextfieldSearchValue(searchValue)
    }
  }

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          { lettersByAuthor ? (
            lettersByAuthor.map((letter) => {
              return (
                <Grid key={`lettersByUser_${letter.id}`} size={2}>
                  <LetterCard letter={letter} />
                </Grid>
              )
            })
          ) : (
            <Item>No letters found</Item>
          )}
          <Grid size={12}>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
              <Grid size={12} rowSpacing={{ xs: 3, sm: 3, md: 3}} columnSpacing={{ xs: 3, sm: 3, md: 3 }}>
                <div className={"editor-search-letters"}>
                  <SearchLetters handleSearch={handleSearch} defaultSearchValue={textfieldSearchValue}/>
                </div>
              </Grid>
              { letterSearchResults ? (
                letterSearchResults.map((letter) => {
                  return (
                    <Grid key={`lastLetters_${letter.id}`} size={2}>
                      <LetterCard letter={letter} />
                    </Grid>
                  )
                })
              ) : (
                <></>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default IndexLetters;
