import { TextField } from '@mui/material';
import { NewLetterDialogProps } from '../AddNewLetterDialog';
import React, { useState } from 'react';
import {
  searchForLetterNameTitle,
} from '../../../../../../services/editor/apiLettersRequest.service';

const NewLetterLetterName= (props: NewLetterDialogProps) => {
  const [letterName, setLetterName] = React.useState<string | null>(props.completionState.letterName)
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');

  const validateLetterName = (letterName: string) : { isValid: boolean, errorMessage: string | null } => {
    const regex = /^(FMB|GB|fmb|gb)-(\d{4})-(\d{2})-(\d{2})-(\d{2})$/;

    const match = letterName.match(regex);
    if (!match) return { isValid: false, errorMessage: 'Invalid format. Expected FMB-YYYY-MM-DD-AA or GB-YYYY-MM-DD-AA with AA between 01 and 99.' };

    const [, , yearStr, monthStr, dayStr] = match;

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const date = new Date(year, month - 1, day);
    const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    return { isValid: isValidDate, errorMessage: isValidDate ? null : 'The given name does not contains a valid date' };
  }

  const checkLetterNameAvailable = async (letterName: string | null): Promise<boolean> => {
    const letterType = letterName?.substring(0, 3).toLowerCase() === 'fmb' ? 'FMB' : 'GB';

    try {
      const responseLetters = await searchForLetterNameTitle(letterType, letterName)

      return !(responseLetters && responseLetters.length > 0);
    } catch (error) {
      setError(true);
      setHelperText('Error fetching letter name');
      return true;
    }
  };

  const handleBlur = async () => {

    if (!letterName || letterName?.length == 0) {
      setError(true);
      setHelperText('Please enter a letter name');
      return;
    }
    const { isValid, errorMessage } = validateLetterName(letterName);

    if (!isValid && errorMessage) {
      setError(true);
      setHelperText( errorMessage );
      return;
    }

    const letterIsAvailable  = await checkLetterNameAvailable(letterName);

    if (!letterIsAvailable) {
      setError(true);
      setHelperText('Letter name already exists');
      return;
    }

    const isFmb = isFmbLetter(letterName);
    const basePayload = {
      letterName,
      letterNameComplete: true,
      isFmbLetter: isFmb,
    };

    const payload = isFmb
      ? { ...basePayload, writerAutoAvailable: false, writerEntity: null }
      : basePayload;

    props.onChange(payload);
    setError(false);
    setHelperText('');
  }

  const isFmbLetter = (letterName: string | null) => {
    if (letterName === null) { return false }

    return (letterName.length > 3 && letterName.toLowerCase().indexOf('fmb') === 0)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLetterName(event.target.value);
    if (error) {
      setError(false);
      setHelperText('');
    }
  };

  return (
    <>
      <div className="autoSnippetFormRow" style={ { marginTop: "25px", width: "98%" } }>
        <TextField
          id="outlined-basic"
          label="Name des Briefes"
          variant="outlined"
          value={letterName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error}
          helperText={helperText}
          fullWidth
        />
      </div>
    </>
  )
}

export default NewLetterLetterName;
