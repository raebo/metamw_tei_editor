import {DefaultDialogProps} from "../../EditorFormDialog";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../../redux/redux.store";
import React, {useEffect, useState} from "react";
import {EditorUtils} from "../../../../../../utils/editor";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../../utils/misc";
import {EditorConstants, EntityType, HeaderPerson} from "../../../../../../constants/editor";
import DialogContent from "@mui/material/DialogContent";
import DynamicDataDisplay from "../../../../../support/DynamicDataDisplay";
import {DISPLAY_NAME_MAP} from "../../../../../../utils/entityMappings";
import {
	Box, Checkbox,
	Divider,
	FormControlLabel,
	FormGroup,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Typography
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import {fetchMetamwEntityData} from "../../../../../../services/auto_anno/apiMetaMw.service";
import {SnippetEntity} from "../../../../../../services/mappings/autoAnnoMappings";
import FormAutocomplete from "../../../Util/FormAutocomplete";
import AddIcon from "@mui/icons-material/Add";
import {searchEditortEntities} from "../../../../../../services/editor/apiLetterRequest.service";
import {DialogActionButton} from "../Misc/DialogActionButton";

const ManageWritingActAuthorWriterDialog = (props: DefaultDialogProps) => {
	const stateActOfWriting= useSelector((state: RootState) => state.editorLetter.letter.actOfWriting)

	const [authors, setAuthors] = React.useState<HeaderPerson[]>([]);
	const [writers, setWriters] = React.useState<HeaderPerson[]>([]);
	const [people, setPeople] = useState<SnippetEntity[]>([]);
	const [displayData, setDisplayData] = React.useState<{ [key: string]: string } | null>(null);
	const [roleAuthor, setRoleAuthor] = React.useState<boolean>(true);
	const [roleWriter, setRoleWriter] = React.useState<boolean>(true);
	const [selectedPerson, setSelectedPerson] = React.useState<SnippetEntity | null>(null)

	const xmlDoc = props.xmlDoc

	useEffect(() => {
		const extractExistingAuthorsWriters = (xmlDoc: XMLDocument) => {
			try {
				const { authors, writers } = EditorUtils.writingActContent.extractAuthorsWriters(xmlDoc, stateActOfWriting.orderNumber);

				setAuthors(authors);
				setWriters(writers);

			} catch (error) {
				enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			}
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

		if (xmlDoc) {
			extractExistingAuthorsWriters(xmlDoc);
			void fetchDefaultPeople()
		}
	}, [xmlDoc]);


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

		if (roleAuthor) {
			if (authors.find(a => a.key === selectedPerson.entityKey)) {
				enqueueSnackbar("Author already added", { variant: "warning" });
				return;
			}
			setAuthors(prev => [...prev, { key: selectedPerson.entityKey, name: selectedPerson.entityName }]);
		}

		if (roleWriter) {
			if (writers.find(w => w.key === selectedPerson.entityKey)) {
				enqueueSnackbar("Writer already added", { variant: "warning" });
				return;
			}
			setWriters(prev => [...prev, { key: selectedPerson.entityKey, name: selectedPerson.entityName }]);
		}
		setSelectedPerson(null)
	}


	const handleSave = async () => {
		if (!xmlDoc) {
			enqueueSnackbar("Xml Document ist nicht verfügbar", { variant: "error" });
			return false;
		}

		try {
			EditorUtils.writingActContent.setAuthorsWriters(xmlDoc, stateActOfWriting.orderNumber, authors, writers);

			props.onSave(xmlDoc, EditorConstants.changeTypes.writing_act.MANAGE_AUTHORS_WRITERS, "Autoren/Schreiber im Schreibakt wurden aktualisiert.", null);

		} catch (error)	{
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
			return false;
		} finally {
			props.onClose()
		}

		return true
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
								<ListItemText secondary={writer.key} primary={writer.name} />
							</ListItem>
						))}
					</List>
				</div>
				<div className={"autoSnippetFormRow"} style={{ marginTop: "25px", width: "98%" }}>
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
						<FormGroup>
							<FormControlLabel
								control={
									<Checkbox
										checked={roleAuthor}
										onChange={(e) => setRoleAuthor(e.target.checked)}
									/>
								}
								label="Autor"
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={roleWriter}
										onChange={(e) => setRoleWriter(e.target.checked)}
									/>
								}
								label="Schreiber"
							/>
						</FormGroup>
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
			<DialogActionButton label={"Autoren/Schreiber im Schreibakt Speichern"} onClick={ handleSave } disabled={false} />
		</>
	);
}

export default ManageWritingActAuthorWriterDialog;
