import { Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@src/redux/hooks';
import { setLetterFontSize } from '@src/redux/slices/authentication.slice';

const LetterFontSizeHandle = () => {
  const dispatch = useAppDispatch();
  const [fontSize, setFontSize] = useState(100); // Store font size as a percentage

  useEffect(() => {
    const letterXml = document.getElementById('letterXml');
    if (letterXml) {
      letterXml.style.fontSize = `${fontSize}%`;
      dispatch(setLetterFontSize({ fontSize: fontSize })); // Dispatch the font size to the Redux store
    }
  }, [dispatch, fontSize]);

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 10, 200));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 10, 50));

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 75,
        left: 16,
        backgroundColor: 'background.paper',
        padding: 1,
        borderRadius: 1,
        boxShadow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'grey.400',
      }}
    >
      <ZoomOutIcon fontSize="small" onClick={decreaseFontSize} sx={{ cursor: 'pointer' }} />
      <ZoomInIcon fontSize="small" onClick={increaseFontSize} sx={{ cursor: 'pointer' }} />
    </Box>
  );
};

export default LetterFontSizeHandle;
