import {Divider, FormControl, InputLabel, MenuItem, Select, TextareaAutosize} from "@mui/material";
import React, { useState } from "react";
import { EditorUtils } from "../../../../../utils/editor";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/redux.store";
import { MiscUtils } from "../../../../../utils/misc";
import { enqueueSnackbar } from "notistack";
import { EditorConstants } from "../../../../../constants/editor";
import { DefaultDialogProps} from '../EditorFormDialog';
import DialogContent from "@mui/material/DialogContent";
import {DialogActionButton} from "./Misc/DialogActionButton";

const AddNoteDialog = (props: DefaultDialogProps) => {
  const [comment, setComment] = useState("");
  const [noteType, setNoteType] = useState("");
  const [noteLanguage, setNoteLanguage] = useState("");
  const markedSpan = EditorUtils.textMarking.markedSpanEntry(props.xmlRef?.current ?? null);
	const xmlDoc = props.xmlDoc;
  const markedSection =
    markedSpan?.parentElement?.innerHTML || "<p>No marked section found</p>";

  const user = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = () => {
    const userNameShort = MiscUtils.userHandling.nameShortCut( MiscUtils.userHandling.stateUserToAuthUser(user) );

		try {
      const { xmlId } = EditorUtils.markupGeneration.noteMarkup(xmlDoc, userNameShort, comment, noteType);
			props.onSave(
				xmlDoc,
				EditorConstants.changeTypes.note.ADDED,
				"Kommentar wurde hinzugefügt",
				xmlId
			)
    } catch (error) {
      enqueueSnackbar("No xml content found", { variant: "error" })
    }
  };

  return (
		<>
			<DialogContent>
					<div style={{padding: 5}}>
						<div id="noteReferencedXmlWrapper" style={{padding: 5}}>
							<div id="noteReferencedXml" dangerouslySetInnerHTML={{ __html: markedSection }} />
						</div>
						<div className="form-item form-item--key">
							<FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
								<InputLabel id="add-note-dialog-comment-type">Kommentar (Typ)</InputLabel>
								<Select
									defaultValue={""}
									disabled={false}
									labelId="simple-select-filled-label"
									id="simple-select-filled"
									onChange={(event) => setNoteType(event.target.value)}
								>
									{ EditorConstants.noteTypeItems.map((item) => (
										<MenuItem key={item.value} value={item.value}>
											{item.label}
										</MenuItem>
									)) }
								</Select>
							</FormControl>
						</div>

						<div className="form-item form-item--key">
							<FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
								<InputLabel id="auto-anno-snippet-reference-type">Kommentar (Sprache)</InputLabel>
								<Select
									defaultValue={""}
									disabled={false}
									labelId="demo-simple-select-filled-label"
									id="demo-simple-select-filled"
									onChange={(event) => setNoteLanguage(event.target.value)}
								>
									{ EditorConstants.noteTypeLanguages.map((item) => (
										<MenuItem key={item.value} value={item.value}>
											{item.label}
										</MenuItem>
									)) }
								</Select>
							</FormControl>
						</div>
						<div className="form-item form-item--key" style={{margin: 5}}>
							<TextareaAutosize
								aria-label="comment"
								minRows={10}
								maxRows={20}
								placeholder="Kommentar"
								style={{ width: "100%", padding: 8 }}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
							/>
						</div>
					</div>
			</DialogContent>
			<Divider />
			<DialogActionButton label={"Kommentar Einfügen"} onClick={handleSubmit} disabled={!comment.trim() || noteType === "" || noteLanguage === ""} />
    </>
  )
}

export default AddNoteDialog
