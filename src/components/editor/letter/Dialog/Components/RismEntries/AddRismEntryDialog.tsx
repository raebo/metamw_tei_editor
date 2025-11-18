import React, { useMemo, useState } from 'react';
import { Box, Button, Divider, Grid, TextField, Typography } from '@mui/material';
import { Autocomplete, DialogActions, DialogContent } from '@mui/material';
import type { RismEntry, RismFormEntry } from '@src/services/mappings/autoAnnoMappings';
import { EditorConstants } from '@src/constants/editor';
import { backendService } from '@src/utils/editor/backendService';
import { debounce } from 'lodash-es';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor';
import { useTranslation } from 'react-i18next';

const INITIAL_RISM_SEARCH_VALUE = 'Berlin';

const AddRismEntryDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const [rismEntries, setRismEntries] = useState<RismEntry[]>([]);
  const [country, setCountry] = useState('');
  const [settlement, setSettlement] = useState('');
  const [institution, setInstitution] = useState('');
  const [repository, setRepository] = useState('');
  const [collection, setCollection] = useState('');
  const [idNo, setIdNo] = useState('');

  const [docData, setDocData] = React.useState<{
    xmlDoc: XMLDocument | null;
    teiHeader: Element | null;
  }>({ xmlDoc: props.xmlDoc, teiHeader: null });

  React.useEffect(() => {
    if (!docData.xmlDoc) {
      enqueueSnackbar(t('errors:editor.dialog.noXmlDocument'), { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }
    const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(props.xmlDoc);
    setDocData((prevState) => ({ ...prevState, teiHeader }));

    if (!teiHeader) {
      enqueueSnackbar(t('errors:editor.dialog.noTeiHeader'), { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }
    try {
      backendService.searchRismEntries(INITIAL_RISM_SEARCH_VALUE).then((result) => {
        setRismEntries(result);
      });
    } catch (err) {
      enqueueSnackbar(
        t('errors:editor.dialog.rismEntries.noBackendRismEntries', {
          reason: (err as Error).message,
        }),
        { variant: 'error' },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchRismEntries = async (term: string) => {
    try {
      const results = await backendService.searchRismEntries(term);
      setRismEntries(results);
    } catch (error) {
      enqueueSnackbar(
        t('errors:editor.dialog.rismEntries.noBackendRismEntries', {
          reason: (error as Error).message,
        }),
        {
          variant: 'error',
        },
      );
    }
  };

  const debouncedSearchForRismEntries = useMemo(() => debounce(searchRismEntries, 300), []);

  const rismEntryChanged = (entry: RismEntry | null) => {
    if (entry) {
      setCountry(entry.country || '');
      setSettlement(entry.city || '');
      setInstitution(entry.code || '');
      setRepository(entry.name || '');
    }
  };

  const handleSubmit = () => {
    if (!docData.xmlDoc || !docData.teiHeader) {
      enqueueSnackbar('TEI-Header ist nicht verfügbar', { variant: 'error' });
      return false;
    }

    EditorUtils.teiHeaderContent.addMsIdentifer(docData.teiHeader, {
      country: country,
      settlement: settlement,
      institution: institution,
      repository: repository,
      collection: collection ? collection : '-',
      idNo: idNo ? idNo : '-',
    } as RismFormEntry);

    props.onSave(
      docData.xmlDoc,
      EditorConstants.changeTypes.misc.HEADER_RISM_ENTRY_ADDED,
      'RISM Eintrag hinzugefügt',
      null,
    );
  };

  const handleReset = () => {
    setCountry('');
    setSettlement('');
    setInstitution('');
    setRepository('');
    setCollection('');
    setIdNo('');
  };

  return (
    <>
      <DialogContent>
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {t('editor:dialog.rismEntries.addRismEntryDialog.headline')}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                disabled={false}
                options={rismEntries}
                value={null}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => rismEntryChanged(newValue)}
                onInputChange={(_, inputValue, reason) => {
                  if (
                    inputValue &&
                    reason !== EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.SELECT_OPTION
                  ) {
                    void debouncedSearchForRismEntries(inputValue);
                  }
                }}
                getOptionLabel={(option) => option.title || ''}
                filterOptions={(options, { inputValue }) =>
                  options.filter((option) => {
                    const search = inputValue.toLowerCase();

                    return (
                      (option.title?.toLowerCase() ?? '').includes(search) ||
                      (option.code?.toLowerCase() ?? '').includes(search) ||
                      (option.city?.toLowerCase() ?? '').includes(search) ||
                      (option.country?.toLowerCase() ?? '').includes(search)
                    );
                  })
                }
                renderOption={(props, option, { inputValue }) => {
                  return (
                    <li {...props}>
                      <div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: MiscUtils.stringHandling.highlightText(
                              option.title,
                              inputValue,
                            ),
                          }}
                        />
                        <div
                          style={{ fontSize: '0.8em', color: 'gray' }}
                          dangerouslySetInnerHTML={{
                            __html: MiscUtils.stringHandling.highlightText(
                              option.title,
                              inputValue,
                            ),
                          }}
                        />
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('editor:dialog.rismEntries.addRismEntryDialog.label.autocomplete')}
                    variant="outlined"
                  />
                )}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.country')}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.settlement')}
                value={settlement}
                onChange={(e) => setSettlement(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.institution')}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.collection')}
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.repository')}
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.idno')}
                value={idNo}
                onChange={(e) => setIdNo(e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" color="secondary" onClick={handleReset}>
            {t('editor:dialog.rismEntries.addRismEntryDialog.button.reset')}
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {t('editor:dialog.rismEntries.addRismEntryDialog.button.submit')}
          </Button>
        </Grid>
      </DialogActions>
    </>
  );
};

export default AddRismEntryDialog;
