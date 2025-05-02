import { TextField } from '@mui/material';
import { NewLetterDialogProps } from '../AddNewLetterDialog';
import React, { useState } from 'react';

const NewLetterLetterName= (props: NewLetterDialogProps) => {

  const [letterName, setLetterName] = React.useState<string | null>(props.completionState.letterName)
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');

  const validateLetterName = (value: string | null) => {
    if (!value) {
      return true
    }

    const regex = /^(FMB|GB)-\d{4}-\d{2}-\d{2}-(\d{2})$/;
    const match = value.match(regex);
    if (!match) {
      return false;
    }
    const aa = parseInt(match[2], 10);
    return aa >= 1 && aa <= 99;
  };

  const handleBlur = () => {
    const isValid = validateLetterName(letterName);

    if (!isValid) {
      setError(true);
      setHelperText(
        'Invalid format. Expected FMB-YYYY-MM-DD-AA or GB-YYYY-MM-DD-AA with AA between 01 and 99.'
      );
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
