import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { Autocomplete, TextField } from '@mui/material';
import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

export interface EntityNewCreationProps {
  creationKinds: string[];
  newCreationKey: string | null;
  afterEntitySelected: (entity: SnippetEntity) => void;
}

const EntityNewCreation = (props: EntityNewCreationProps) => {
  const { t } = useTranslation();
  const [creationKinds, setCreationKinds] = React.useState<string[]>(props.creationKinds);
  const [selectedKind, setSelectedKind] = React.useState<string | null>(null);
  const [creationName, setCreationName] = React.useState<string | null>(null);

  useEffect(() => {
    setCreationKinds(props.creationKinds);
  }, [props.creationKinds]);

  const handleKindChange = (kind: string) => {
    if (kind) {
      setSelectedKind(kind);
      if (props.newCreationKey && creationName !== null) {
        props.afterEntitySelected({
          entityKey: props.newCreationKey,
          entityName: creationName,
          entityKind: kind,
        } as SnippetEntity);
      }
    }
  };
  const handleCreationNameChange = (name: string) => {
    setCreationName(name);
    if (props.newCreationKey && selectedKind !== null) {
      props.afterEntitySelected({
        entityKey: props.newCreationKey,
        entityName: name,
        entityKind: selectedKind,
      } as SnippetEntity);
    }
  };

  return (
    <>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          variant="outlined"
          label={t('editor:dialog.creationContainer.addCreationDialog.label.newIdentifierCreation')}
          value={props.newCreationKey ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={true}
        />
      </Grid>
      <Grid size={{ xs: 8, md: 8, lg: 8 }}>
        <Autocomplete
          disabled={false}
          options={creationKinds}
          getOptionLabel={(kind) => kind}
          value={selectedKind ?? ''}
          onChange={(event, kind) => handleKindChange(kind)}
          isOptionEqualToValue={(kind, value) => {
            return kind === value;
          }}
          renderInput={(params) => (
            <TextField {...params} label="Auswahl Kategorie" variant="outlined" />
          )}
          disableClearable
        />
      </Grid>
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <TextField
          variant="outlined"
          label={t('editor:dialog.creationContainer.addCreationDialog.label.newNameCreation')}
          value={creationName ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => {
            handleCreationNameChange(event.target.value);
          }}
          disabled={false}
        />
      </Grid>
    </>
  );
};

export default EntityNewCreation;
