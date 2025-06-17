import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import { Autocomplete, TextField } from '@mui/material';
import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid';

export interface EntityExistingCreationProps {
  creationList: SnippetEntity[],
  creationKinds: string[];
  creationAutocompleteDisabled: boolean;
  afterEntitySelected: (entity: SnippetEntity) => void;
  resetSignal?: number;
}

const EntityExistingCreation = (props: EntityExistingCreationProps) => {

  const [creationKinds, setCreationKinds] = React.useState<string[]>(props.creationKinds);
  const [selectedCreation, setSelectedCreation] = React.useState<SnippetEntity | undefined>(undefined)
  const [selectedKind, setSelectedKind] = React.useState<string | null>(null);

  useEffect(() => {
    setCreationKinds(props.creationKinds);
  }, [props.creationKinds]);

  useEffect(() => {
    console.log("resetSignal changed: ", props.resetSignal);
    setSelectedCreation(undefined)
    setSelectedKind(null);
  }, [props.resetSignal]);

  useEffect(() => {
    console.log("selectedCreation changed: ", selectedCreation);
  }, [selectedCreation]);

  const handleCreationChange = (creation: SnippetEntity | null) => {
    if (creation) {
      props.afterEntitySelected(creation);
    }
    if (creation?.entityKind && creationKinds.includes(creation.entityKind)) {
      setSelectedKind(creation.entityKind);
    }
  }

  return (
    <>
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <Autocomplete
              key={`creation-autocomplete-${props.resetSignal}`} // forces remount on reset
              disabled={props.creationAutocompleteDisabled}
              options={props.creationList}
              value={selectedCreation}
              getOptionLabel={(creation: SnippetEntity) => creation.entityName ?? ''}
              onChange={(event, creation) => handleCreationChange(creation)}
              isOptionEqualToValue={(option, value) => {
                return option.entityId === value.entityId
              }}
              renderInput={(params) => <TextField {...params} label="Auswahl Werk" variant="outlined" />}
              disableClearable
            />
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <Autocomplete
            disabled={true}
            options={creationKinds}
            getOptionLabel={(kind) => kind }
            value={ selectedKind ?? '' }
            isOptionEqualToValue={(kind, value) => {
              return kind  === value;
            }}
            renderInput={(params) => <TextField {...params} label="Auswahl Kategorie" variant="outlined" />}
            disableClearable
          />
        </Grid>
    </>
  )
}

export default EntityExistingCreation;
