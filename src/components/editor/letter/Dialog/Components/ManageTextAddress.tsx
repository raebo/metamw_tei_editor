import { DefaultDialogProps} from "../EditorFormDialog";
import React, {useEffect} from "react";
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
	const { addressType } = props
	const xmlDoc = props.xmlDoc
	const formIsValid = true
	const [addressData, setAddressData] = React.useState<ContentAddressEntry | null>(null);

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

			const changeType = addressType === 'RECIPIENT' ?
				EditorConstants.changeTypes.misc.BODY_ADDRESS_RECEIVER_CHANGED :
				EditorConstants.changeTypes.misc.BODY_ADDRESS_SENDER_CHANGED;

			props.onSave(xmlDoc, changeType, "Die Adresse des Briefes wurde erfolgreich angepasst", null);

			} catch (error) {
			enqueueSnackbar("Fehler beim Speichern des TEI-Headers: " + MiscUtils.misc.getErrorMessage(error), {variant: "error"});
			props.onClose()
		}
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
