import type { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import React, { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor';
import { backendService } from '@src/utils/editor/backendService';
import { EditorConstants } from '@src/constants/editor';
import { useAppDispatch } from '@src/redux/hooks';
import { clearSelectedMsiIdentifier } from '@src/redux/slices/editor.letter.slice';
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
  const dispatch = useAppDispatch();
  const selectedMsIdentifier = useSelector(
    (state: RootState) => state.editorLetter.letter.selectedMsiIdentifier,
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
      enqueueSnackbar('Kein XML-Dokument zum Parsen vorhanden', { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }
    const teiHeader = EditorUtils.teiHeaderContent.extractTeiHeader(xmlDoc);
    setDocData((prevState) => ({ ...prevState, teiHeader }));

    if (!teiHeader) {
      enqueueSnackbar('Kein TEI-Header im XML-Dokument gefunden', { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }

    if (msId === null) {
      enqueueSnackbar('Der MsIdentifier konnte nicht ausgelesen werden', { variant: 'error' });
      return;
    }

    EditorUtils.xmlExtraction.extractMsIdentifierData(teiHeader, msId, (data) =>
      setRismFields(mapDataToFields(data)),
    );

    backendService.searchRismEntries(INITIAL_RISM_SEARCH_VALUE).then((result) => {
      setRismEntries(result);
    });
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
        dispatch(clearSelectedMsiIdentifier());
      },
    );
  };

  const searchRismEntries = async (term: string) => {
    try {
      const results = await backendService.searchRismEntries(term);
      setRismEntries(results);
    } catch (error) {
      enqueueSnackbar(`Keine RISM Einträge im Backend verfügbar ${(error as Error).message}`, {
        variant: 'error',
      });
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
            Eintrag ersetzten
          </Typography>

          <Grid container spacing={2}>
            {/* Search Row */}
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
                  <TextField {...params} label="RISM Sigel auswählen" variant="outlined" />
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
                label="Country"
                value={rismFields.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Settlement"
                value={rismFields.settlement}
                onChange={(e) => handleFieldChange('settlement', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Institution"
                value={rismFields.institution}
                onChange={(e) => handleFieldChange('institution', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Collection"
                value={rismFields.collection}
                onChange={(e) => handleFieldChange('collection', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField
                fullWidth
                label="Repository"
                value={rismFields.repository}
                onChange={(e) => handleFieldChange('repository', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ID No."
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
            Wiederherstellen
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!dataChanged}
            onClick={handleSubmit}
          >
            Eintrag Anpassen
          </Button>
        </Grid>
      </DialogActions>
    </>
  );
};

export default ManageRismEntryDialog;
