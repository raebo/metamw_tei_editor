import Typography from '@mui/material/Typography';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';

const Branding = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const navigate = useNavigate();

  return (
    <>
      <QuestionAnswerIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
      <Typography
        variant="h6"
        noWrap
        component="a"
        onClick={() => navigate('/')}
        sx={{
          mr: 2,
          display: { xs: 'none', md: 'flex' },
          fontFamily: 'monospace',
          cursor: 'pointer',
          fontWeight: 700,
          letterSpacing: '.3rem',
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        {`${isAuthenticated ? 'MetaMw - Editor' : 'MetaMw - Editor'}`}
      </Typography>
    </>
  );
};

export default Branding;
