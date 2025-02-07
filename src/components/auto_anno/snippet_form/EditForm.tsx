import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import React from "react";
import {
  setAutoAnnoSnippet,
  setAutoSnippetFormContainer,
  setSnippetEntityInfo
} from "../../../redux/slices/auto.letter.snippet.slice";
import SnippetFormAutocomplete from "./SnippetFormAutocomplete";
import { InfoOutlined, InfoSharp } from "@mui/icons-material";

interface Props {
  autoAnnoLetterId: number
}

const EditForm = (props: Props) => {
  const dispatch = useDispatch()

  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet)
  let menuTypeItems = []


  if (sharedSnippet) {
    if (sharedSnippet.referenceType === "Person") {
      menuTypeItems.push({ value: "Person", label: "Person" });
    } else {
      menuTypeItems.push(
        { value: "Institution", label: "Institution" },
        { value: "Settlement", label: "Ort" },
        { value: "Sight", label: "Sehenswürdigkeit" }
      );
    }
  }

  const setFormEntityType = (entityType: string) => {
    dispatch(setAutoAnnoSnippet({snippet: { referenceTypeChanged: entityType}}))
  }

  const setAutocompleteResult = (entityKey: string) => {
    dispatch(setAutoAnnoSnippet({snippet: { referenceKeyChanged: entityKey}}))
  }

  const editButtonEnableSave = () => {
    dispatch(setAutoSnippetFormContainer({ snippetFormContainer: { actionButtonDisabled: false } }))
  }

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
            value={ sharedSnippet ? sharedSnippet.referenceKeyChanged : ""}
            sx={{m: 1, width: '100%'}}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    handleInfoIconClick(sharedSnippet?.referenceKeyChanged ? sharedSnippet.referenceKeyChanged : null)
                  }
                  }
                  edge="end"
                >
                  { sharedSnippet?.referenceKeyChanged ? <InfoSharp /> : <InfoOutlined />}
                </IconButton>
              </InputAdornment>
            }
          />
        </div>
        <div className="form-item form-item--type">
          <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
            <InputLabel id="auto-anno-snippet-reference-type">Referenz Type</InputLabel>
            <Select
              defaultValue={sharedSnippet?.referenceTypeChanged}
              disabled={false}
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
              onChange={(event) => setFormEntityType(event.target.value)}
            >
              {menuTypeItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
      <SnippetFormAutocomplete
        isDisabled={false}
        entityType={sharedSnippet?.referenceTypeChanged}
        entityKey={sharedSnippet?.referenceKeyChanged}
        autoJobLetterId={props.autoAnnoLetterId}
        setFormEntityKey={setAutocompleteResult}
        setSaveButtonDisabled={editButtonEnableSave}
      />
    </>
  )
}

export default EditForm
