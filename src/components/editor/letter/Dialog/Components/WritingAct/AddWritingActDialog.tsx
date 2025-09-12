import React, {useEffect, useState} from 'react';
import { DefaultDialogProps} from '../../EditorFormDialog';
import {EditorConstants, EntityType, HeaderPerson} from '../../../../../../constants/editor';
import FormAutocomplete from '../../../Util/FormAutocomplete';
import {
	Box, Checkbox,
	Divider,
	FormControlLabel, FormGroup,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Typography
} from '@mui/material';
import DynamicDataDisplay from '../../../../../support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '../../../../../../utils/entityMappings';
import { fetchMetamwEntityData } from '../../../../../../services/auto_anno/apiMetaMw.service';
import { enqueueSnackbar } from 'notistack';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../redux/redux.store';
import { markupGeneration } from '../../../../../../utils/editor/markupGeneration';
import { ActOfWritingElement } from '../../../../../../services/mappings/editorMappings';
import DialogContent from "@mui/material/DialogContent";
import {DialogActionButton} from "../Misc/DialogActionButton";
import {SnippetEntity} from "../../../../../../services/mappings/autoAnnoMappings";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {searchEditortEntities} from "../../../../../../services/editor/apiLetterRequest.service";
import {MiscUtils} from "../../../../../../utils/misc";

const AddWritingActDialog = (props: DefaultDialogProps) => {
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

	const [authors, setAuthors] = React.useState<HeaderPerson[]>([]);
	const [writers, setWriters] = React.useState<HeaderPerson[]>([]);

	const [roleAuthor, setRoleAuthor] = React.useState<boolean>(true);
	const [roleWriter, setRoleWriter] = React.useState<boolean>(true);
	const [selectedPerson, setSelectedPerson] = React.useState<SnippetEntity | null>(null)
	const [people, setPeople] = useState<SnippetEntity[]>([]);

  const [displayData, setDisplayData] = React.useState<{ [key: string]: string } | null>(null);

	const xmlDoc = props.xmlDoc

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

		if (people.length === 0) {
			void fetchDefaultPeople()
		}
	}, [props]);


  const handleInfoIconClick = async (reference : HeaderPerson) => {
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

		setSelectedPerson(null);
	}

  const writeDateToDoc= async () => {
    if (!stateEditorLetter.id) {
      enqueueSnackbar('No letter ID found', { variant: 'error' });
			props.onClose()
      return;
    }

		if (!xmlDoc) {
			enqueueSnackbar('No valid TEI XML document found', { variant: 'error' });
			props.onClose()
			return;
		}

		const authorWriters: ActOfWritingElement[] = []

		authors.forEach(author => {
			authorWriters.push({ role: 'author', key: author.key, name: author.name });
		});
		writers.forEach(writer => {
			authorWriters.push({ role: 'writer', key: writer.key, name: writer.name });
		})

		try {
			markupGeneration.insertActOfWritingBlock(xmlDoc, authorWriters);

			props.onSave(xmlDoc, EditorConstants.changeTypes.misc.ACT_OF_WRITING_ADDED, "Neuer Schreibakt wurde hinzugefügt", null)
		} catch (error) {
			enqueueSnackbar("Error durign adding writing act: " + MiscUtils.misc.getErrorMessage(error), {variant: "error"})

			props.onClose()
		}
  };

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
						{ writers.map(writer => (
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

					<Divider sx={{ my: 2 }} />

				<div className={"autoSnippetFormRow"} style={{ marginTop: "25px", width: "98%" }}>
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
			<DialogActionButton label={ "Schreibakt Hinzufügen" } onClick={writeDateToDoc} disabled={ authors.length === null || writers.length === null } />
    </>
  );
};

export default AddWritingActDialog;
