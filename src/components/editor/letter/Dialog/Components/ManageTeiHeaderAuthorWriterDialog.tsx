import {DefaultDialogProps} from "../EditorFormDialog";
import React, {useEffect, useMemo, useState} from 'react';
import {EditorConstants, EntityType, HeaderPerson} from "../../../../../constants/editor";
import {EditorUtils} from "../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../utils/misc";
import {
	Autocomplete,
	Box,
	Divider, FormControlLabel,
	IconButton,
	List,
	ListItem,
	ListItemText, Radio,
	RadioGroup, TextField,
	Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import {fetchMetamwEntityData} from "../../../../../services/auto_anno/apiMetaMw.service";
import DynamicDataDisplay from "../../../../support/DynamicDataDisplay";
import {DISPLAY_NAME_MAP} from "../../../../../utils/entityMappings";
import AddIcon from "@mui/icons-material/Add";
import {SnippetEntity} from "../../../../../services/mappings/autoAnnoMappings";
import {searchEditortEntities} from "../../../../../services/editor/apiLetterRequest.service";
import {debounce} from "lodash-es";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {setReloadLetterContent} from "../../../../../redux/slices/editor.letter.slice";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../redux/redux.store";
import {useAppDispatch} from "../../../../../redux/hooks";


const ManageTeiHeaderAuthorWriterDialog = (props: DefaultDialogProps) => {

	const dispatch = useAppDispatch();
	const [authors, setAuthors] = React.useState<HeaderPerson[]>([]);
	const [writers, setWriters] = React.useState<HeaderPerson[]>([]);
	const [displayData, setDisplayData] = React.useState<{ [key: string]: string } | null>(null);
	const [role, setRole] = useState<"author" | "writer">("author");
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
		const setAuthorWriterData = () => {
			const { authors, writers } = EditorUtils.teiHeaderContent.extractAuthorWriters(teiHeader);

			setAuthors(authors);
			setWriters(writers);
		}

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
				setAuthorWriterData();
				fetchDefaultPeople();
			} catch (error) {
				enqueueSnackbar("Fehler beim Lesen der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			}
		}

	}, [teiHeader]);

	const searchForPeople = async (inputValue: string) => {
		try {
			const responsePeoples = await searchEditortEntities(inputValue, EntityType.PERSON)

			if (responsePeoples) {
				setPeople(responsePeoples);
			}
		} catch (err) {
			enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
		}
	}

	const debouncedSearchForPeople = useMemo(
		() => debounce(searchForPeople, 300), // 300ms delay
		[]
	)

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

	const handleRemove = (type: "author" | "writer", reference: HeaderPerson) => {
		if (type === "author") {
			setAuthors(prev => prev.filter(a => a.key !== reference.key));
		} else {
			setWriters(prev => prev.filter(w => w.key !== reference.key));
		}
	};

	const handleAdd = () => {
		if (!selectedPerson) {
			return
		}

		if (role === "author") {
			if (authors.find(a => a.key === selectedPerson.entityKey)) {
				enqueueSnackbar("Author already added", { variant: "warning" });
				return;
			}
			setAuthors(prev => [...prev, { key: selectedPerson.entityKey, name: selectedPerson.entityName }]);
		}

		if (role === "writer") {
			if (writers.find(w => w.key === selectedPerson.entityKey)) {
				enqueueSnackbar("Writer already added", { variant: "warning" });
				return;
			}
			setWriters(prev => [...prev, { key: selectedPerson.entityKey, name: selectedPerson.entityName }]);
		}
	}

	const handleSave = async () => {
		if (!xmlDoc || !teiHeader) {
			enqueueSnackbar("TEI-Header ist nicht verfügbar", { variant: "error" });
			return false;
		}

		try {
			EditorUtils.teiHeaderContent.setAuthorWritersFirstPosition(teiHeader, authors, writers);
			EditorUtils.teiHeaderContent.setAuthorsWritersSndPosition(teiHeader, authors, writers);

			const serializer = new XMLSerializer();
			const updatedXml = serializer.serializeToString(xmlDoc)

			const result = await EditorUtils.backendService.patchContent(
				updatedXml, stateEditorLetter.id, EditorConstants.changeTypes.misc.HEADER_UPDATED, null)

			if (result) {
				dispatch(setReloadLetterContent({ reloadLetterContent: true }))
				enqueueSnackbar("Die Autoren/Schreiber des Briefes wurden erfolgreich gespeichert", { variant: "success" })
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
					<Typography variant="h6">Autoren</Typography>
					<List dense>
						{authors.map(author => (
							<ListItem
								key={author.key}
								secondaryAction={
									<Box>
										<IconButton onClick={() => handleInfoIconClick(author)}>
											<InfoIcon />
										</IconButton>
										<IconButton onClick={() => handleRemove("author", author)}>
											<DeleteIcon />
										</IconButton>
									</Box>
								}
							>
								<ListItemText secondary={author.key} primary={author.name} />
							</ListItem>
						))}
					</List>
					<Typography variant="h6" sx={{ mt: 2 }}>
						Schreiber
					</Typography>
					<List dense>
						{writers.map(writer => (
							<ListItem
								key={writer.key}
								secondaryAction={
									<Box>
										<IconButton onClick={() => handleInfoIconClick(writer)}>
											<InfoIcon />
										</IconButton>
										<IconButton onClick={() => handleRemove("writer", writer)}>
											<DeleteIcon />
										</IconButton>
									</Box>
								}
							>
								<ListItemText primary={writer.name} />
							</ListItem>
						))}
					</List>

					<Divider sx={{ my: 2 }} />

					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Autocomplete
							disabled={false}
							options={people}
							value={selectedPerson}
							isOptionEqualToValue={(option, value) => option.entityId === value.entityId }
							onChange={(_, newValue) => setSelectedPerson(newValue)}
							onInputChange={(_, inputValue, reason) => {
								if (inputValue && reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION) {
									debouncedSearchForPeople(inputValue);
								}
							}}
							getOptionLabel={(option) => option.entityName || ''}
							filterOptions={(options, { inputValue }) =>
								options.filter((option) =>
									option.entityName.toLowerCase().includes(inputValue.toLowerCase())
								)
							}
							renderOption={(props, option, { inputValue }) => {
								return (
									<li {...props}>
										<div>
											<div
												dangerouslySetInnerHTML={{
													__html: MiscUtils.stringHandling.highlightText(option.entityName, inputValue)
												}}
											/>
										</div>
									</li>
								);
							}}
							renderInput={(params) => (
								<TextField {...params} label={ "Empfänger Auswählen"} variant="outlined" />
							)}
							fullWidth
						/>

						<RadioGroup
							row
							value={role}
							onChange={e => setRole(e.target.value as "author" | "writer")}
						>
							<FormControlLabel value="author" control={<Radio />} label="Autor" />
							<FormControlLabel value="writer" control={<Radio />} label="Schreiber" />
						</RadioGroup>
						<IconButton
							color="primary"
							onClick={handleAdd}
							disabled={!selectedPerson}
						>
							<AddIcon />
						</IconButton>
					</Box>
				</div>
			</DialogContent>
			<Divider />
			<DialogActions sx={{ paddingTop: 5}}>
				<Button
					size={EditorConstants.styles.panel.buttonSize}
					variant="contained"
					color="primary"
					onClick={handleSave}
				>
					Autoren/Schreiber im Header Speichern
				</Button>
			</DialogActions>
		</>
	)
}

export default ManageTeiHeaderAuthorWriterDialog
