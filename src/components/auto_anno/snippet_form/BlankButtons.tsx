import { ButtonGroup, Divider } from "@mui/material";
import React from "react";
import Button from "@mui/material/Button";

const BlankButtons = () => {
  return (
    <div className="autoSnippetFormRow">
      <Divider sx={{ my: 2 }} />

      <div className="form-item form-item--buttons">
        <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
          <Button disabled={true}>Abbruch</Button>
          <Button disabled={true}>Speichern</Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export default BlankButtons
