import { IconButton, InputAdornment, OutlinedInput, TextField } from "@mui/material";
import React from "react";
import { InfoOutlined } from "@mui/icons-material";

const BlankForm = () => {

    return (
      <>
        <div className="autoSnippetFormRow">
          <div className="form-item form-item--key">
            <OutlinedInput
              disabled
              id="outlined-disabled"
              label=""
              value={""}
              sx={{m: 1, width: '100%'}}
              endAdornment={
              <InputAdornment position="end">
                <IconButton edge={"end"}>
                  <InfoOutlined />
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
              value={""}
              sx={{m: 1, width: '100%'}}
            />
          </div>
        </div>
        <div className="autoSnippetFormRow">
          <div className="form-item form-item--key">
            <TextField
              disabled
              id="outlined-disabled"
              label=""
              value=""
              sx={{m: 1, width: '100%'}}
            />
          </div>
        </div>
      </>
    )
}

export default BlankForm
