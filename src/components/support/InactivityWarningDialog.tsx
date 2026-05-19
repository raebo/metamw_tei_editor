import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

const InactivityWarningDialog = ({ open }: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogTitle>{t('editor:dialog.authentication.inactivity.title')}</DialogTitle>
      <DialogContent>
        <Typography>{t('editor:dialog.authentication.inactivity.body')}</Typography>
      </DialogContent>
    </Dialog>
  );
};

export default InactivityWarningDialog;
