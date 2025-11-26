import type { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import React from 'react';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor';
import DialogContent from '@mui/material/DialogContent';
import { Box, Button, Divider, Grid, TextField, Typography } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import { EditorConstants } from '@src/constants/editor';

const ManageProvenanceDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const [provenanceEntry, setProvenanceEntry] = React.useState<string>('');

  const selectedProvenanceIdentifier = useSelector(
    (state: RootState) => state.editorLetter.letter.selectedIdentifier,
  );
  const [docData, setDocData] = React.useState<{
    xmlDoc: XMLDocument | null;
    teiHeader: Element | null;
  }>({ xmlDoc: props.xmlDoc, teiHeader: null });

  React.useEffect(() => {
    const xmlDoc = props.xmlDoc;
    const provId = selectedProvenanceIdentifier;

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
    if (provId === null) {
      enqueueSnackbar(t('errors.editor.dialog.noSelectedId'), { variant: 'error' });
      setDocData({ xmlDoc: null, teiHeader: null });
      return;
    }

    try {
      setProvenanceEntry(EditorUtils.xmlExtraction.extractProvenanceData(teiHeader, provId));
    } catch (error) {
      enqueueSnackbar(`Could not load provenance data: ${(error as Error).message}`, {
        variant: 'error',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    if (!docData.xmlDoc || !docData.teiHeader) {
      enqueueSnackbar('TEI-Header ist nicht verfügbar', { variant: 'error' });
      return false;
    }

    try {
      EditorUtils.teiHeaderContent.updateProvenanceEntry(
        docData.teiHeader,
        provenanceEntry,
        selectedProvenanceIdentifier,
      );

      props.onSave(
        docData.xmlDoc,
        EditorConstants.changeTypes.misc.HEADER_PROVENANCE_ENTRY_CHANGED,
        t('editor:dialog.provenanceEntries.manageProvenanceDialog.success'),
        null,
      );
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' });
    }
  };

  return (
    <>
      <DialogContent>
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {t('editor:dialog.provenanceEntries.manageProvenanceDialog.headline')}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.provenanceEntries.manageProvenanceDialog.label.provenance')}
                value={provenanceEntry}
                onChange={(e) => setProvenanceEntry(e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {t('editor:dialog.provenanceEntries.manageProvenanceDialog.button.submit')}
        </Button>
      </DialogActions>
    </>
  );
};

export default ManageProvenanceDialog;
