import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { TextField } from '@mui/material';

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
    })
    )
  }, [props.protagCreationKey]);

  useEffect(() => {
    props.afterProtagCreationChange(protagCreationDetail);
  }, [protagCreationDetail]);

  return (
    <>
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <TextField
          variant="outlined"
          label="Name Werk"
          value={protagCreationDetail.name ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProtagCreationDetail((prevState) => ({
              ...prevState,
              name: e.target.value,
            }))
          }}
          disabled={false} />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          variant="outlined"
          label="Schlüssel Werk"
          value={protagCreationDetail.key ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={true} />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          variant="outlined"
          label="MWV Werk"
          value={protagCreationDetail.mwv ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProtagCreationDetail((prevState) => ({
              ...prevState,
              mwv: e.target.value,
            }))
          }}
          disabled={false} />
      </Grid>
      <Grid size={{ xs: 4, md: 4, lg: 4 }}>
        <TextField
          variant="outlined"
          label="Opus Werk"
          value={protagCreationDetail.opus ?? ''}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProtagCreationDetail((prevState) => ({
              ...prevState,
              opus: e.target.value,
            }))
          }}
          disabled={false} />
      </Grid>
    </>
  )
}

export default EntityNewProtagCreation
