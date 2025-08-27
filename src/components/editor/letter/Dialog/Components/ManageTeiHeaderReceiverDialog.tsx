import {DefaultDialogProps} from "../EditorFormDialog";
import {useAppDispatch} from "../../../../../redux/hooks";
import {EditorConstants, EntityType, HeaderPerson} from "../../../../../constants/editor";
import React, {useEffect, useMemo, useState} from "react";
import {SnippetEntity} from "../../../../../services/mappings/autoAnnoMappings";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../redux/redux.store";
import {setReloadLetterContent} from "../../../../../redux/slices/editor.letter.slice";
import {EditorUtils} from "../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../utils/misc";
import {searchEditortEntities} from "../../../../../services/editor/apiLetterRequest.service";
import {debounce} from "lodash-es";
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

	const dispatch = useAppDispatch();
	const [receivers, setReceivers] = React.useState<HeaderPerson[]>([]);
	const [displayData, setDisplayData] = React.useState<{ [key: string]: string } | null>(null);
	const [people, setPeople] = useState<SnippetEntity[]>([]);
	const [selectedPerson, setSelectedPerson] = React.useState<SnippetEntity | null>(null)
	const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
	const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)
	const [parsedXml, setParsedXml] = React.useState<{
		xmlDoc: XMLDocument | null;
		teiHeader: Element | null;
	}>({ xmlDoc: null, teiHeader: null });

	React.useEffect(() => {
		if (!stateTeiXml) {
			dispatch(setReloadLetterContent({ reloadLetterContent: true }));
			return;
		}

		try {
			const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
			const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
			setParsedXml({ xmlDoc, teiHeader });
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			setParsedXml({ xmlDoc: null, teiHeader: null });
		}
	}, [stateTeiXml, dispatch]);

	const { xmlDoc, teiHeader } = parsedXml;

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

		if (teiHeader) {
			try {
				setReceivers(
					EditorUtils.teiHeaderContent.extractReceivers(teiHeader)
				)

				fetchDefaultPeople();
			} catch (error) {
				enqueueSnackbar("Fehler beim Lesen der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			}
		}
	}, [teiHeader]);


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
		if (!selectedPerson) {
			return
		}

		if (receivers.find(w => w.key === selectedPerson.entityKey)) {
			enqueueSnackbar("Receiver already added", { variant: "warning" });
			return;
		}
		setReceivers(prev => [...prev, { key: selectedPerson.entityKey, name: selectedPerson.entityName }]);
		setSelectedPerson(null)
	}


	const handleSave = async () => {
		if (!xmlDoc || !teiHeader) {
			enqueueSnackbar("TEI-Header ist nicht verfügbar", { variant: "error" });
			return false;
		}

		try {
			EditorUtils.teiHeaderContent.setReceivers(teiHeader, receivers);

			const serializer = new XMLSerializer();
			const updatedXml = serializer.serializeToString(xmlDoc)

			const result = await EditorUtils.backendService.patchContent(
				updatedXml, stateEditorLetter.id, EditorConstants.changeTypes.misc.HEADER_UPDATED, null)

			if (result) {
				dispatch(setReloadLetterContent({ reloadLetterContent: true }))
				enqueueSnackbar("Die Empfänger des Briefes wurden erfolgreich gespeichert", { variant: "success" })
			}

			props.onClose()
		} catch (error) {
			console.log(error)
			enqueueSnackbar("Fehler beim Schreiben der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
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
