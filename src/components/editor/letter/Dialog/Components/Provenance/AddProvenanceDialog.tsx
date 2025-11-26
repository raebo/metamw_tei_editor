import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import type { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor';
import { EditorConstants } from '@src/constants/editor';
import { Box, Button, Divider, Grid, TextField, Typography } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

const AddProvenanceDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const [provenanceEntry, setProvenanceEntry] = useState<string>('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    if (!docData.xmlDoc || !docData.teiHeader) {
      enqueueSnackbar(t('errors:editor.dialog.noTeiHeader'), { variant: 'error' });
      return false;
    }

    try {
      EditorUtils.teiHeaderContent.addProvenanceEntry(docData.teiHeader, provenanceEntry);

      props.onSave(
        docData.xmlDoc,
        EditorConstants.changeTypes.misc.HEADER_PROVENANCE_ENTRY_ADDED,
        t('editor:dialog.provenanceEntries.addProvenanceDialog.success'),
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
            {t('editor:dialog.provenanceEntries.addProvenanceDialog.headline')}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField
                fullWidth
                label={t('editor:dialog.provenanceEntries.addProvenanceDialog.label.provenance')}
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
          {t('editor:dialog.provenanceEntries.addProvenanceDialog.button.submit')}
        </Button>
      </DialogActions>
    </>
  );
};

export default AddProvenanceDialog;
