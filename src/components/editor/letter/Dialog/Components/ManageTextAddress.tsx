import {DefaultDialogProps} from "../EditorFormDialog";
import {useAppDispatch} from "../../../../../redux/hooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../redux/redux.store";
import React, {useEffect} from "react";
import {setReloadLetterContent} from "../../../../../redux/slices/editor.letter.slice";
import {EditorUtils} from "../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../utils/misc";
import {ContentAddressEntry, EditorConstants} from "../../../../../constants/editor";
import ContentAddressEntryForm from "../Forms/ContentAddressEntryForm";
import {Divider} from "@mui/material";
import {DialogActionButton} from "./Misc/DialogActionButton";

export type ManageTextAddressDialogProps = DefaultDialogProps & {
	addressType: 'RECIPIENT' | 'SENDER'
}

const ManageTextAddress = (props: ManageTextAddressDialogProps) => {
	const dispatch = useAppDispatch();
	const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
	const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)

	const { addressType } = props
	const [xmlDoc, setXmlDoc] = React.useState< XMLDocument | null>(null);
	const formIsValid = true
	const [addressData, setAddressData] = React.useState<ContentAddressEntry | null>(null);

	useEffect(() => {
		if (!stateTeiXml) {
			dispatch(setReloadLetterContent({ reloadLetterContent: true }));
			return;
		}

		try {
			const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
			setXmlDoc(xmlDoc);
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setXmlDoc(null);
		}
	}, [stateTeiXml, dispatch]);


	useEffect(() => {
		const extractExistingAddress = (xmlDoc: XMLDocument) => {
			setAddressData(
				EditorUtils.miscContentCheck.existingAddressEntry(xmlDoc, addressType)
			)
		}

		if (xmlDoc) {
			extractExistingAddress(xmlDoc)
		}

	}, [xmlDoc])

	const submitSaveHandler = async () => {
		try {
			if (!xmlDoc) {
				enqueueSnackbar("Ungültiges XML-Dokument", {variant: "error"});
				props.onClose()
				return;
			}
			EditorUtils.miscContentCheck.writeAddressEntry(xmlDoc, addressType, addressData);

			const updatedXml = new XMLSerializer().serializeToString(xmlDoc);
			const changeType = addressType === 'RECIPIENT' ?
				EditorConstants.changeTypes.misc.BODY_ADDRESS_RECEIVER_CHANGED :
				EditorConstants.changeTypes.misc.BODY_ADDRESS_SENDER_CHANGED;

			const result = await EditorUtils.backendService.patchContent(
				updatedXml, stateEditorLetter.id, changeType, null )

			if (result) {
				dispatch(setReloadLetterContent({reloadLetterContent: true}))
				enqueueSnackbar("Die Adresse des Briefes wurde erfolgreich angepasst", {variant: "success"})
			}

			} catch (error) {
			enqueueSnackbar("Fehler beim Speichern des TEI-Headers: " + MiscUtils.misc.getErrorMessage(error), {variant: "error"});
		}

		props.onClose()
	}


	return (
		<div>
			{addressData ? (
				<>
					<ContentAddressEntryForm
						entry={addressData}
						onChange={(updated) => setAddressData(updated)}
					/>
					<Divider />
					<DialogActionButton label={"Adresse Speichern"} onClick={submitSaveHandler} disabled={!formIsValid}/>
				</>
	) : (
				<p>Loading address data…</p>
			)}
		</div>
	)
}

export default ManageTextAddress
