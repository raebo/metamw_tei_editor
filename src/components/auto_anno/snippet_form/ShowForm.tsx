import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { IconButton, InputAdornment, OutlinedInput, TextField } from "@mui/material";
import React from "react";
import { InfoOutlined, InfoSharp, } from "@mui/icons-material";
import { setSnippetEntityInfo } from "../../../redux/slices/auto.letter.snippet.slice";
import { useAppDispatch } from "../../../redux/hooks";

const ShowForm = () => {

  const dispatch = useAppDispatch()
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);


  const handleInfoIconClick = (referenceKey: string | null) => {
    if (!referenceKey) { return }
    dispatch(setSnippetEntityInfo({ key: referenceKey }))
  }

  return (
    <>
      <div className="autoSnippetFormRow">
        <div className="form-item form-item--key">
          <OutlinedInput
            disabled
            id="outlined-disabled"
            label=""
            value={ sharedSnippet ? sharedSnippet.referenceKey : ""}
            sx={{m: 1, width: '100%'}}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    handleInfoIconClick(sharedSnippet?.referenceKey ? sharedSnippet.referenceKey : null)
                    }
                  }
                  edge="end"
                >
                  { sharedSnippet?.referenceKey ? <InfoSharp /> : <InfoOutlined />}
                </IconButton>
              </InputAdornment>
            }

          />
        </div>
        <div className="form-item form-item--type">
          <TextField
            disabled
            id="outlined-disabled"
            label=""
            value={ sharedSnippet ? sharedSnippet.referenceType : ""}
            sx={{m: 1, width: '100%'}}
          />
        </div>
      </div>
      <div className="autoSnippetFormRow">
        <div className="form-item form-item--name">
          <TextField
            disabled
            id="outlined-disabled"
            label=""
            value={sharedSnippet ? sharedSnippet.referenceName : ""}
            sx={{m: 1, width: '100%'}}
          />
        </div>
      </div>
    </>
 )
}

export default ShowForm
