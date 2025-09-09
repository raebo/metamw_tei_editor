import {DefaultDialogProps} from "../../EditorFormDialog";
import DialogContent from "@mui/material/DialogContent";
import {Typography} from "@mui/material";
import {useAppDispatch} from "../../../../../../redux/hooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../../redux/redux.store";
import React, {useEffect, useState} from "react";
import {setReloadLetterContent} from "../../../../../../redux/slices/editor.letter.slice";
import {EditorUtils} from "../../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../../utils/misc";

const GreetingsFormulaDialog = (props: DefaultDialogProps) => {

	const dispatch = useAppDispatch();
	const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
	const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)
	const [xmlDoc, setXmlDoc] = React.useState< XMLDocument | null>(null);
	const [xmlString, setXmlString] = useState<string>("");

	useEffect(() => {
		if (!stateTeiXml) {
			dispatch(setReloadLetterContent({ reloadLetterContent: true }));
			return;
		}

		try {
			const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
			setXmlDoc(xmlDoc);
			setXmlString(stateTeiXml)
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setXmlDoc(null);
		}
	}, [stateTeiXml, dispatch]);

	return (
		<>
			<DialogContent dividers>
				<Typography gutterBottom>
					{ xmlString }
				</Typography>
			</DialogContent>
		</>
	)
}

export default GreetingsFormulaDialog
