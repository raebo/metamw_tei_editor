import React, { useState, useContext } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import { AuthContext } from '@src/components/auth/AuthContext';
import { useTranslation } from 'react-i18next';

interface ErrorResponse {
  message: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth) return;

    setEmailError(false);
    setPasswordError(false);

    try {
      await auth.login(email, password);
    } catch (error: unknown) {
      setEmailError(true);
      setPasswordError(true);

      let message = 'Invalid email or password. Please try again.';

      if (error && (error as AxiosError<ErrorResponse>).isAxiosError) {
        const axiosErr = error as AxiosError<ErrorResponse>;
        message = axiosErr.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" gutterBottom>
          {t('login.headline')}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label={t('login.labels.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            error={emailError}
            helperText={emailError ? t('login.errors.email') : ''}
            margin="normal"
          />
          <TextField
            label={t('login.labels.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            error={passwordError}
            helperText={passwordError ? t('login.errors.email') : ''}
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            {t('login.btn_signing')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
