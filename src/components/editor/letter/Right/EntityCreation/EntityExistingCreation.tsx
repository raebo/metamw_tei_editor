import { SnippetEntity } from '../../../../../services/mappings/autoAnnoMappings';
import { Autocomplete, TextField } from '@mui/material';
import React, {useEffect, useState} from 'react';
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
  const [allCreationList, setAllCreationList] = React.useState<SnippetEntity[]>(props.creationList);
  const [groupedCreationList, setGroupedCreationList] = useState<Record<string, SnippetEntity[]>>({});
  const [displayCreationList, setDisplayCreationList] = useState<SnippetEntity[]>(props.creationList);

  useEffect(() => {
    const reducedResult = props.creationList.reduce<Record<string, SnippetEntity[]>>((acc: Record<string, SnippetEntity[]>, entity) => {
      const kind = entity.entityKind;
      // @ts-ignore
      if (!acc[kind]) acc[kind] = [];

      // @ts-ignore
      acc[kind].push(entity);

      return acc;
    }, {});

    console.log("props.creationList", props.creationList);
    setGroupedCreationList(reducedResult);
    setDisplayCreationList(props.creationList);
    setAllCreationList(props.creationList);
  }, [props.creationList]);

  useEffect(() => {
    setCreationKinds(props.creationKinds);
  }, [props.creationKinds]);

  useEffect(() => {
    setSelectedCreation(undefined)
    setSelectedKind(null);
  }, [props.resetSignal]);

  const handleCreationChange = (creation: SnippetEntity | null) => {
    if (creation) {
      props.afterEntitySelected(creation);
    }
    if (creation?.entityKind && creationKinds.includes(creation.entityKind)) {
      setSelectedKind(creation.entityKind);
    }
  }

  const handleKindChange = (kind: string | null) => {
    if (kind) {
      setSelectedKind(kind);
      setDisplayCreationList(groupedCreationList[kind] || allCreationList);
    } else {
      setDisplayCreationList(allCreationList);
    }
  }

  return (
    <>
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <Autocomplete
              key={`creation-autocomplete-${props.resetSignal}`} // forces remount on reset
              disabled={ props.creationAutocompleteDisabled }
              options={ displayCreationList }
              value={selectedCreation}
              getOptionLabel={(creation: SnippetEntity) => creation.entityName ?? ''}
              onChange={ (event, creation) => handleCreationChange(creation) }
              isOptionEqualToValue={(option, value) => {
                return option.entityId === value.entityId
              }}
              renderInput={(params) => <TextField {...params} label="Auswahl Werk" variant="outlined" />}
              disableClearable
            />
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <Autocomplete
            disabled={ props.creationAutocompleteDisabled }
            options={ creationKinds }
            getOptionLabel={(kind) => kind }
            onChange={(event, value) => handleKindChange(value)}
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
