import React, { useState } from "react";
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { EditorConstants } from "../../../../../../constants/editor";
import Button from "@mui/material/Button";
import { EditorUtils } from "../../../../../../utils/editor";
import { MiscUtils } from "../../../../../../utils/misc";
import { enqueueSnackbar } from "notistack";
import { DefaultDialogProps } from '../../EditorFormDialog';

const AttachmentAddDialog = (props: DefaultDialogProps) => {

	const xmlDoc = props.xmlDoc
  const [attachmentType, setAttachmentType] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");

  const handleSubmit = async () => {
    try {
      const attachmentMarkup = EditorUtils.markupGeneration.addAttachmentMarkup(
        xmlDoc, attachmentType, attachmentName
      )

      if (!attachmentMarkup.contentChanged) {
        enqueueSnackbar("Fehler beim Hinzufügen der Beilage", { variant: "error" });
				props.onClose()
				return;
      }

			props.onSave(xmlDoc, EditorConstants.changeTypes.misc.ATTACHMENT_ADDED, "Beilage erfolgreich hinzugefügt", null)

    } catch (error) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
    }

    props.onClose();
  }

  return (
    <div style={{padding: 5}}>
      <div style={{padding: 5}}>
        <div className="form-item form-item--key">
          <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
            <InputLabel id="add-attachment-type">Beilage (Typ)</InputLabel>
            <Select
              defaultValue={""}
              disabled={false}
              labelId="simple-select-filled-label"
              id="simple-select-filled"
              onChange={(event) => setAttachmentType(event.target.value)}
            >
              { EditorConstants.attachmentTypeItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              )) }
            </Select>
          </FormControl>
        </div>
        <div className="form-item form-item--key" style={{margin: 5}}>
          <TextField id="outlined-basic" label="Bezeichnung (Beilage)" variant="outlined"
            placeholder="Bezeichnung der Beilage"
            style={{ width: "100%", padding: 8 }}
            value={attachmentName}
            onChange={(e) => setAttachmentName(e.target.value)}
          />
          <div style={{ textAlign: "right" }}>
            <Button
              size={EditorConstants.styles.panel.buttonSize}
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              style={{ marginTop: 8 }}
              disabled={!attachmentType.trim()} // Disable if empty
            >
              Einfügen
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttachmentAddDialog
