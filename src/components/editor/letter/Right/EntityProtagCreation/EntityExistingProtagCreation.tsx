import { type ProtagCreation } from '@src/services/mappings/editorMappings';
import { Autocomplete, TextField } from '@mui/material';
import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

interface PropsExisitingProtagCreation {
  resetSignal: number;
  protagCreations: ProtagCreation[];
  handleProtagCreationChange: (protagCreation: ProtagCreation) => void;
}

interface ProtagCreationDetail {
  key: string | null;
  mwv: string | null;
  opus: string | null;
}

const EntityExistingProtagCreation = (props: PropsExisitingProtagCreation) => {
  const { t } = useTranslation();
  const [protagCreationDetail, setProtagCreationDetail] = React.useState<ProtagCreationDetail>({
    key: null,
    mwv: null,
    opus: null,
  } as ProtagCreationDetail);

  const [selectedProtagCreation, setSelectedProtagCreation] = React.useState<
    ProtagCreation | undefined
  >(undefined);

  React.useEffect(() => {
    setProtagCreationDetail({
      key: null,
      mwv: null,
      opus: null,
    });
    setSelectedProtagCreation(undefined);
  }, [props.resetSignal]);

  const handleProtagCreationChange = (protagCreation: ProtagCreation | null) => {
    setProtagCreationDetail({
      key: protagCreation?.key ?? null,
      mwv: protagCreation?.mwv ?? null,
      opus: protagCreation?.opus ?? null,
    });

    if (protagCreation !== null) {
      props.handleProtagCreationChange(protagCreation);
    }
  };

  return (
    <>
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Autocomplete
          key={`protag-creation-autocomplete-${props.resetSignal}`} // forces remount on reset
          disabled={props.protagCreations.length === 0}
          options={props.protagCreations}
          value={selectedProtagCreation}
          getOptionLabel={(protagCreation: ProtagCreation) => protagCreation.name ?? ''}
          onChange={(event, protagCreation) => handleProtagCreationChange(protagCreation)}
          isOptionEqualToValue={(option, value) => {
            return option.id === value.id;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t(
                'editor:dialog.protagCreationContainer.addProtagCreationDialog.label.chooseProtagCreation',
              )}
              variant="outlined"
            />
          )}
          disableClearable
        />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          key={`protag-creation-key-${props.resetSignal}`} // forces remount on reset
          variant="outlined"
          label={t(
            'editor:dialog.protagCreationContainer.addProtagCreationDialog.label.identifier',
          )}
          value={protagCreationDetail.key ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={true}
        />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          key={`protag-creation-mwv-${props.resetSignal}`} // forces remount on reset
          variant="outlined"
          label={t('editor:dialog.protagCreationContainer.addProtagCreationDialog.label.mwv')}
          value={protagCreationDetail.mwv ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={true}
        />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          key={`protag-creation-opus-${props.resetSignal}`} // forces remount on reset
          variant="outlined"
          label={t('editor:dialog.protagCreationContainer.addProtagCreationDialog.label.opus')}
          value={protagCreationDetail.opus ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={true}
        />
      </Grid>
    </>
  );
};

export default EntityExistingProtagCreation;
