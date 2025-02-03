import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import { TextField } from "@mui/material";
import React from "react";

const ShowForm = () => {

  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);

  return (
    <>
      <div className="autoSnippetFormRow">
        <div className="form-item form-item--key">
          <TextField
            disabled
            id="outlined-disabled"
            label=""
            value={ sharedSnippet ? sharedSnippet.referenceKey : ""}
            sx={{m: 1, width: '100%'}}
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
