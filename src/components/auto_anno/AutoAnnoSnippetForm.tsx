import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Button from "@mui/material/Button";
import { setReloadStatus } from "../../redux/slices/auto.letter.snippet.slice";
import { Box, ButtonGroup, FormControl, InputLabel, MenuItem, Select, styled, TextField } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import SnippetFormAutocomplete from "./snippet_form/SnippetFormAutocomplete";

interface AutoAnnoSnippetFormProps {
  autoJobLetterId: number
}

const AutoAnnoSnippetForm = (props: AutoAnnoSnippetFormProps) => {
  const dispatch = useDispatch();
  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);
  const sharedLetter = useSelector((state: RootState) => state.autoLetterSnippet.letter);

  const formSubmit = () => {
    dispatch(setReloadStatus({letter: { id: props.autoJobLetterId, reloadStatus: true}}))
  }

  const [formEntityType, setFormEntityType] = useState(sharedSnippet?.referenceType ? sharedSnippet?.referenceType : "");
  const[formEntityKey, setFormEntityKey] = React.useState(sharedSnippet?.referenceKey ? sharedSnippet?.referenceKey : "");

  const[hideFormButtons, setHideFormButtons] = React.useState(true);



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

  const activateEditMode = () => {
    setHideFormButtons(false);
    setFormEntityType(sharedSnippet?.referenceType ? sharedSnippet?.referenceType : "");
    setFormEntityKey("")
  }
  const cancelEditMode = () => { setHideFormButtons(true); }

  return (
    <>
      <Paper>
        <div className="autoSnippetFormBox">
          {hideFormButtons ? (
              <div className="autoSnippetFormRow">
                <div className="form-item form-item--key">
                  <FormControl variant="filled" sx={{ m: 1, minWidth: 120, width: '100%' }}>
                    <InputLabel id="auto-anno-snippet-reference-key">{ sharedSnippet?.referenceKey }</InputLabel>
                    <Select
                      labelId="demo-simple-select-filled-label"
                      id="demo-simple-select-filled"
                      disabled={true}
                    >
                      <MenuItem value={sharedSnippet?.referenceKey}>{ sharedSnippet?.referenceKey }</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <div className="form-item form-item--type">
                  <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
                    <InputLabel id="auto-anno-snippet-reference-type">{ sharedSnippet?.referenceType }</InputLabel>
                    <Select
                      labelId="demo-simple-select-filled-label"
                      id="demo-simple-select-filled"
                      disabled={true}
                    >
                      <MenuItem value={sharedSnippet?.referenceType}>{ sharedSnippet?.referenceType }</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            ) : (
            <div className="autoSnippetFormRow">
              <div className="form-item form-item--key">
                <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
                  <InputLabel id="auto-anno-snippet-reference-key">{formEntityKey}</InputLabel>
                  <Select
                    labelId="demo-simple-select-filled-label"
                    id="demo-simple-select-filled"
                    disabled={true}
                  >
                    <MenuItem value={formEntityKey}>{formEntityKey}</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="form-item form-item--type">
                <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
                  <InputLabel id="auto-anno-snippet-reference-type">Referenz Type</InputLabel>
                  <Select
                    defaultValue={formEntityType}
                    labelId="demo-simple-select-filled-label"
                    id="demo-simple-select-filled"
                    disabled={false}
                    onChange={(event) => setFormEntityType(event.target.value)}
                  >
                    <MenuItem value="institution">Institution</MenuItem>
                    <MenuItem value="settlement">Ort</MenuItem>
                    <MenuItem value="person">Person</MenuItem>
                    <MenuItem value="sight">Sehenswürdigkeit</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          )}
        { hideFormButtons ? (
          <div className="autoSnippetFormRow">
            <div className="form-item form-item--name">
              <TextField
                disabled
                id="outlined-disabled"
                label=""
                value={sharedSnippet?.referenceName}
                sx={{m: 1, width: '100%'}}
              />
            </div>
          </div>
        ) : (
          <>
            <SnippetFormAutocomplete entityType={formEntityType} entityKey={formEntityKey} autoJobLetterId={props.autoJobLetterId} setFormEntityKey={setFormEntityKey} setFormEntityType={setFormEntityType}/>
            <div>
              {formEntityKey}
            </div>

          </>
        )}

        <div className="autoSnippetFormRow">
          <div className="form-item form-item--buttons">
            {hideFormButtons ? (
              <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
                <Button>Übernehmen</Button>
                <Button onClick={() => activateEditMode()}>Anpassen</Button>
                <Button>Löschen</Button>
              </ButtonGroup>
            ) : (
              <div className="form-item form-item--buttons" hidden={hideFormButtons}>
                <ButtonGroup size="small" variant="contained" aria-label="Basic button group">
                  <Button>Speichern</Button>
                  <Button onClick={() => cancelEditMode()}>Abbruch</Button>
                </ButtonGroup>
              </div>
            )}
          </div>
        </div>
      </div>
      </Paper>
    </>
  );
};

export default AutoAnnoSnippetForm;