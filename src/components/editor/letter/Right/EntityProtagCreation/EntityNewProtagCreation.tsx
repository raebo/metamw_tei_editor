import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface EntityNewProtagCreationProps {
  protagCreationKey: string | null;
  afterProtagCreationChange: (protagCreationDetail: ProtagCreationDetail) => void;
}

export interface ProtagCreationDetail {
  name: string | null;
  key: string | null;
  mwv: string | null;
  opus: string | null;
}

const EntityNewProtagCreation = (props: EntityNewProtagCreationProps) => {
  const { t } = useTranslation();
  const [protagCreationDetail, setProtagCreationDetail] = React.useState<ProtagCreationDetail>({
    name: null,
    key: null,
    mwv: null,
    opus: null,
  } as ProtagCreationDetail);

  useEffect(() => {
    setProtagCreationDetail((prevState) => ({
      ...prevState,
      key: props.protagCreationKey ?? null,
    }));
  }, [props.protagCreationKey]);

  useEffect(() => {
    props.afterProtagCreationChange(protagCreationDetail);
  }, [props, protagCreationDetail]);

  return (
    <>
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <TextField
          variant="outlined"
          label={t('editor:dialog.protagCreationContainer.addProtagCreationDialog.label.name')}
          value={protagCreationDetail.name ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProtagCreationDetail((prevState) => ({
              ...prevState,
              name: e.target.value,
            }));
          }}
          disabled={false}
        />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
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
          variant="outlined"
          label={t('editor:dialog.protagCreationContainer.addProtagCreationDialog.label.mwv')}
          value={protagCreationDetail.mwv ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProtagCreationDetail((prevState) => ({
              ...prevState,
              mwv: e.target.value,
            }));
          }}
          disabled={false}
        />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          variant="outlined"
          label={t('editor:dialog.protagCreationContainer.addProtagCreationDialog.label.opus')}
          value={protagCreationDetail.opus ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProtagCreationDetail((prevState) => ({
              ...prevState,
              opus: e.target.value,
            }));
          }}
          disabled={false}
        />
      </Grid>
    </>
  );
};

export default EntityNewProtagCreation;
