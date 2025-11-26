import type { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import React, { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor';
import { backendService } from '@src/utils/editor/backendService';
import { EditorConstants } from '@src/constants/editor';
import { useAppDispatch } from '@src/redux/hooks';
import { clearSelectedIdentifier } from '@src/redux/slices/editor.letter.slice';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import type { RismEntry, RismFormEntry } from '@src/services/mappings/autoAnnoMappings';
import {
  Autocomplete,
  Box,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { MiscUtils } from '@src/utils/misc';
import { debounce } from 'lodash-es';
import { useTranslation } from 'react-i18next';

interface RismFields {
  country: string;
  settlement: string;
  institution: string;
  repository: string;
  collection: string;
  idNo: string;
}

const mapDataToFields = (data: any): RismFields => ({
  country: data.country,
  settlement: data.city,
  institution: data.code,
  repository: data.name,
  collection: data.title,
  idNo: data.idNo ?? '',
});

const INITIAL_RISM_SEARCH_VALUE = 'Berlin';

const ManageRismEntryDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedMsIdentifier = useSelector(
    (state: RootState) => state.editorLetter.letter.selectedIdentifier,
  );
  const [docData, setDocData] = React.useState<{
    xmlDoc: XMLDocument | null;
    teiHeader: Element | null;
  }>({ xmlDoc: props.xmlDoc, teiHeader: null });

  const [dataChanged, setDataChanged] = React.useState<boolean>(false);
  const [rismEntries, setRismEntries] = useState<RismEntry[]>([]);

  const [rismFields, setRismFields] = useState<RismFields>({
    country: '',
    settlement: '',
    institution: '',
    repository: '',
    collection: '',
    idNo: '',
  });

  React.useEffect(() => {
    const xmlDoc = props.xmlDoc;
    const msId = selectedMsIdentifier;

    if (!xmlDoc) {
      enqueueSnackbar(t('errors:editor.dialog.noXmlDocument'), { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }
    const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
    setDocData((prevState) => ({ ...prevState, teiHeader }));

    if (!teiHeader) {
      enqueueSnackbar(t('errors:editor.dialog.noTeiHeader'), { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }

    if (msId === null) {
      enqueueSnackbar(t('errors:editor.dialog.rismEntries.noMsIdentifier'), { variant: 'error' });
      return;
    }

    EditorUtils.xmlExtraction.extractMsIdentifierData(teiHeader, msId, (data) =>
      setRismFields(mapDataToFields(data)),
    );

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

  const handleFieldChange = (field: keyof RismFields, value: string) => {
    setDataChanged(true);
    setRismFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!docData.xmlDoc || !docData.teiHeader || selectedMsIdentifier === null) {
      enqueueSnackbar('TEI-Header ist nicht verfügbar', { variant: 'error' });
      return false;
    }

    EditorUtils.teiHeaderContent.updateMsIdentifier(docData.teiHeader, selectedMsIdentifier, {
      country: rismFields.country,
      settlement: rismFields.settlement,
      institution: rismFields.institution,
      repository: rismFields.repository,
      collection: rismFields.collection ? rismFields.collection : '-',
      idNo: rismFields.idNo ? rismFields.idNo : '-',
    } as RismFormEntry);

    props.onSave(
      docData.xmlDoc,
      EditorConstants.changeTypes.misc.HEADER_RISM_ENTRY_CHANGED,
      'RISM Eintrag aktualisiert',
      null,
      () => {
        dispatch(clearSelectedIdentifier());
      },
    );
  };

  const searchRismEntries = async (term: string) => {
    try {
      const results = await backendService.searchRismEntries(term);
      setRismEntries(results);
    } catch (error) {
      enqueueSnackbar(
        t('errors:editor.dialog.rismEntries.noBackendRismEntries', {
          reason: (error as Error).message,
        }),
        { variant: 'error' },
      );
    }
  };

  const debouncedSearchForRismEntries = useMemo(() => debounce(searchRismEntries, 300), []);

  const rismEntryChanged = (entry: RismEntry | null) => {
    if (entry) {
      setRismFields(mapDataToFields(entry));

      if (!dataChanged) {
        setDataChanged(true);
      }
    }
  };

  const validDocData = (): boolean =>
    docData !== null && docData.teiHeader !== null && selectedMsIdentifier !== null;

  const handleReset = () => {
    if (!validDocData()) {
      return;
    }

    EditorUtils.xmlExtraction.extractMsIdentifierData(
      docData!.teiHeader!, //asset this is not null
      selectedMsIdentifier!,
      (data) => setRismFields(mapDataToFields(data)),
    );
    setDataChanged(false);
  };

  return (
    <>
      <DialogContent>
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {t('editor:dialog.rismEntries.manageRismEntryDialog.headline')}
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
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ marginTop: '3%', marginBottom: '2%' }}>
            Daten aktualisieren
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.country')}
                value={rismFields.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.settlement')}
                value={rismFields.settlement}
                onChange={(e) => handleFieldChange('settlement', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.institution')}
                value={rismFields.institution}
                onChange={(e) => handleFieldChange('institution', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.collection')}
                value={rismFields.collection}
                onChange={(e) => handleFieldChange('collection', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.repository')}
                value={rismFields.repository}
                onChange={(e) => handleFieldChange('repository', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.rismEntries.addRismEntryDialog.label.idno')}
                value={rismFields.idNo}
                onChange={(e) => handleFieldChange('idNo', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            disabled={!dataChanged}
          >
            {t('editor:dialog.rismEntries.manageRismEntryDialog.button.reset')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!dataChanged}
            onClick={handleSubmit}
          >
            {t('editor:dialog.rismEntries.manageRismEntryDialog.button.submit')}
          </Button>
        </Grid>
      </DialogActions>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export default ManageRismEntryDialog;
