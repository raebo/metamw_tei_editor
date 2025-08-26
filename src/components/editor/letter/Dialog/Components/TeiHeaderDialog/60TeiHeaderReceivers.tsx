import { TeiHeaderDialogProps } from '../ManageTeiHeaderDialog';
import { SnippetEntity } from '../../../../../../services/mappings/autoAnnoMappings';
import React, { useEffect, useMemo, useState } from 'react';
import { searchEditortEntities } from '../../../../../../services/editor/apiLetterRequest.service';
import {EditorConstants, EntityType, HeaderPerson} from '../../../../../../constants/editor';
import { enqueueSnackbar } from 'notistack';
import { debounce } from 'lodash-es';
import {Autocomplete, Box, Chip, IconButton, TextField} from '@mui/material';
import { MiscUtils } from '../../../../../../utils/misc';
import {EditorUtils} from "../../../../../../utils/editor";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";

const TeiHeaderReceivers = (props: TeiHeaderDialogProps) => {

	const [receivers, setReceivers] = React.useState<HeaderPerson[]>([]);
	const [selectedPerson, setSelectedPerson] = React.useState<SnippetEntity | null>(null)
  const [people, setPeople] = useState<SnippetEntity[]>([]);

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
		const assignedReceivers = () => {
			setReceivers(EditorUtils.teiHeaderContent.extractReceivers(props.teiHeader))
		}

		try {
			fetchDefaultPeople();
			assignedReceivers()
		} catch (error) {
			enqueueSnackbar("Fehler beim Lesen der TEI-Header-Daten: " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
		}
  }, [props.teiHeader]);

	useEffect(() => {
		props.onChange({ receivers: receivers })
	}, [receivers]);


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
  );

	const handleAddReceiver = () => {
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

	const handleRemoveReceiver = (reference: HeaderPerson) => {
		setReceivers(prev => prev.filter(a => a.key !== reference.key));
	};

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>

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
					<IconButton
						color="primary"
						onClick={handleAddReceiver}
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
				<Box mt={2} sx={{ display: "flex", gap: 1, flexWrap: "wrap", marginBottom: '10px' }}>
					{ receivers.map((receiver) => {
						return (
							<Chip
								key={receiver.key}
								label={receiver.name}
								onDelete={() => handleRemoveReceiver(receiver)}
								deleteIcon={<CancelIcon />}
								color="primary"
								variant="outlined"
							/>
						);
					}) }
				</Box>
      </div>
    </>
  )
}

export default TeiHeaderReceivers
