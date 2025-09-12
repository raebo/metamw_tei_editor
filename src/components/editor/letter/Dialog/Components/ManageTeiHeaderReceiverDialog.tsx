import {DefaultDialogProps} from "../EditorFormDialog";
import {EditorConstants, EntityType, HeaderPerson} from "../../../../../constants/editor";
import React, {useEffect, useState} from "react";
import {SnippetEntity} from "../../../../../services/mappings/autoAnnoMappings";
import {EditorUtils} from "../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../utils/misc";
import {searchEditortEntities} from "../../../../../services/editor/apiLetterRequest.service";
import {fetchMetamwEntityData} from "../../../../../services/auto_anno/apiMetaMw.service";
import DialogContent from "@mui/material/DialogContent";
import DynamicDataDisplay from "../../../../support/DynamicDataDisplay";
import {DISPLAY_NAME_MAP} from "../../../../../utils/entityMappings";
import {
	Box,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Typography
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {DialogActionButton} from "./Misc/DialogActionButton";
import FormAutocomplete from "../../Util/FormAutocomplete";

const ManageTeiHeaderReceiverDialog = (props: DefaultDialogProps) => {
	const [receivers, setReceivers] = React.useState<HeaderPerson[]>([]);
	const [displayData, setDisplayData] = React.useState<{ [key: string]: string } | null>(null);
	const [people, setPeople] = useState<SnippetEntity[]>([]);
	const [selectedPerson, setSelectedPerson] = React.useState<SnippetEntity | null>(null)

	const [docData, setDocData] = React.useState<{
		xmlDoc: XMLDocument | null;
		teiHeader: Element | null;
	}>({ xmlDoc: props.xmlDoc, teiHeader: null });

	React.useEffect(() => {
		if (!docData.xmlDoc) {
			enqueueSnackbar("Kein XML-Dokument verfügbar", { variant: "error" });
			return;
		}

		try {
			const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(docData.xmlDoc);

			if (!teiHeader) {
				enqueueSnackbar("Kein TEI-Header im Dokument gefunden", { variant: "error" });
				return
			}
			setDocData((prevState) => ({ ...prevState, teiHeader }));
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setDocData({ xmlDoc: null, teiHeader: null });
		}
	}, [props.xmlDoc]);

	useEffect(() => {
		const fetchDefaultPeople = async () => {
			try {
				const defaultPeople: SnippetEntity[] | undefined = await searchEditortEntities(null, EntityType.PERSON)

				if (defaultPeople === undefined) {
					enqueueSnackbar("No people found", { variant:"error" });
				} else {
					setPeople(defaultPeople);
				}
			} catch (error) {
				enqueueSnackbar("Error fetching people", { variant:"error" });
			}
		};

		if (docData.teiHeader) {
			try {
				setReceivers(
					EditorUtils.teiHeaderContent.extractReceivers(docData.teiHeader)
				)

				void fetchDefaultPeople();
			} catch (error) {
				enqueueSnackbar("Fehler beim Lesen der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			}
		}
	}, [docData.teiHeader]);


	const handleInfoIconClick = async (reference: HeaderPerson) => {
		if (!reference.key) {
			return;
		}
		try {
			const result = await fetchMetamwEntityData(reference.key);
			setDisplayData(result);
		} catch (error) {
			enqueueSnackbar(`Error fetching data for entity with key: ${reference.key}`, { variant: 'error' });
		}
	};

	const handleRemove = (reference: HeaderPerson) => {
		setReceivers(prev => prev.filter(a => a.key !== reference.key));
	};

	const handleAdd = () => {
		if (!selectedPerson) return

		if (receivers.find(w => w.key === selectedPerson.entityKey)) {
			enqueueSnackbar("Receiver already added", { variant: "warning" });
			return;
		}
		setReceivers(prev => [...prev, { key: selectedPerson.entityKey, name: selectedPerson.entityName }]);
		setSelectedPerson(null)
	}


	const handleSave = async () => {
		if (!docData.xmlDoc || !docData.teiHeader) {
			enqueueSnackbar("TEI-Header ist nicht verfügbar", { variant: "error" });
			return false;
		}

		try {
			EditorUtils.teiHeaderContent.setReceivers(docData.teiHeader, receivers);

			props.onSave(docData.xmlDoc, EditorConstants.changeTypes.misc.HEADER_UPDATED, "Die Empfänger des Briefes wurden aktualisiert.", null);


		} catch (error) {
			console.log(error)
			enqueueSnackbar("Fehler beim Schreiben der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			props.onClose()
			return false;
		}
		return true;
	}

	return (
		<>
			<DialogContent>
				<div className="autoSnippetFormRow">
					{displayData !== null ? <DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} /> : <></>}
				</div>
				<div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
					<Typography variant="h6">Empfänger</Typography>
					<List dense>
						{receivers.map(receiver=> (
							<ListItem
								key={receiver.key}
								secondaryAction={
									<Box>
										<IconButton onClick={() => handleInfoIconClick(receiver)}>
											<InfoIcon />
										</IconButton>
										<IconButton onClick={() => handleRemove(receiver)}>
											<DeleteIcon />
										</IconButton>
									</Box>
								}
							>
								<ListItemText secondary={receiver.key} primary={receiver.name} />
							</ListItem>
						))}
					</List>

					<Divider sx={{ my: 2 }} />

					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<FormAutocomplete
							isDisabled={false}
							initialOptions={people}
							entityType={EntityType.PERSON}
							entityKey={selectedPerson ? selectedPerson.entityKey : null }
							afterClickHandler={setSelectedPerson}
							selectedValue={selectedPerson}
						/>
						<IconButton
							color="primary"
							onClick={handleAdd}
							disabled={!selectedPerson}
							sx={{
								backgroundColor: "primary.main",
								color: "white",
								"&:hover": {
									backgroundColor: "primary.dark",
								},
								"&.Mui-disabled": {
									backgroundColor: "grey.300",
									color: "grey.600",
								},
							}}
						>
							<AddIcon />
						</IconButton>
					</Box>
				</div>
			</DialogContent>

			<Divider />
			<DialogActionButton label={"Empfänger im Header Speichern"} onClick={handleSave} disabled={false} />
		</>
	)
}

export default ManageTeiHeaderReceiverDialog
