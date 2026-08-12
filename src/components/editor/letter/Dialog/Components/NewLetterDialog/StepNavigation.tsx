import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useTranslation } from 'react-i18next';

export type StepNavigationProps = {
  currentIndex: number;
  totalSteps: number;
  currentLabel: string;
  previousLabel: string | null;
  nextLabel: string | null;
  onPrevious: () => void;
  onNext: () => void;
};

const StepNavigation = ({
  currentIndex,
  totalSteps,
  currentLabel,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: StepNavigationProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        paddingTop: 2,
        paddingX: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '30%' }}>
        <IconButton onClick={onPrevious} disabled={previousLabel === null} size="small">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary" noWrap>
          {previousLabel ?? ''}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {t('editor:dialog.newLetterDialog.stepIndicator', {
            current: currentIndex + 1,
            total: totalSteps,
          })}
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold">
          {currentLabel}
        </Typography>
      </Box>

      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '30%' }}
      >
        <Typography variant="caption" color="text.secondary" noWrap>
          {nextLabel ?? ''}
        </Typography>
        <IconButton onClick={onNext} disabled={nextLabel === null} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default StepNavigation;
