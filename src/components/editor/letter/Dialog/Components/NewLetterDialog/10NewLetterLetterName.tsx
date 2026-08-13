import { TextField } from '@mui/material';
import { NewLetterDialogProps } from '../AddNewLetterDialog';
import React, { useState } from 'react';
import { fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';
import { MiscUtils } from '@src/utils/misc';

const NewLetterLetterName = (props: NewLetterDialogProps) => {
  const [letterName, setLetterName] = React.useState<string | null>(
    props.completionState.letterName,
  );
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');

  const validateLetterName = (
    letterName: string,
  ): { isValid: boolean; errorMessage: string | null } => {
    const regex = /^(FMB|GB|fmb|gb)-(\d{4})-(\d{2})-(\d{2})-(\d{2})$/;

    const match = letterName.match(regex);
    if (!match)
      return {
        isValid: false,
        errorMessage:
          'Invalid format. Expected FMB-YYYY-MM-DD-AA or GB-YYYY-MM-DD-AA with AA between 01 and 99.',
      };

    const [, , yearStr, monthStr, dayStr] = match;

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const date = new Date(year, month - 1, day);
    const isValidDate =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

    return {
      isValid: isValidDate,
      errorMessage: isValidDate ? null : 'The given name does not contains a valid date',
    };
  };

  // Looks the name up via the exact-match /by_name endpoint (also used by
  // fetchMetamwLetterData elsewhere) instead of the fuzzy search endpoint, since a
  // partial/title search is the wrong tool for an exact "does this name already exist"
  // check. Returns null when the letter does not exist yet (name is available).
  const checkLetterNameAvailable = async (
    letterName: string,
  ): Promise<{ isAvailable: boolean; errorMessage: string | null }> => {
    try {
      // Letters are stored under a lowercased name (see backend CreateLetterService), but
      // the allowed name format accepts either case for the FMB/GB prefix - look the name
      // up lowercased too, otherwise an existing "fmb-..." letter would not be found for a
      // differently-cased "FMB-..." input and the check would wrongly report it as free.
      const existingLetter = await fetchMetamwLetterData(letterName.toLowerCase());

      return existingLetter === null
        ? { isAvailable: true, errorMessage: null }
        : { isAvailable: false, errorMessage: 'Letter name already exists' };
    } catch (err) {
      // A failed availability check must not silently be treated as "available" - that
      // would let the user proceed with an unconfirmed name. Surface the failure instead
      // and block completion until the check can run successfully.
      return {
        isAvailable: false,
        errorMessage:
          'Error checking letter name availability: ' + MiscUtils.misc.getErrorMessage(err),
      };
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
      setHelperText(errorMessage);
      return;
    }

    const { isAvailable, errorMessage: availabilityErrorMessage } =
      await checkLetterNameAvailable(letterName);

    if (!isAvailable) {
      setError(true);
      setHelperText(availabilityErrorMessage ?? 'Letter name already exists');
      return;
    }

    const isFmb = isFmbLetter(letterName);
    const basePayload = {
      letterName,
      letterNameComplete: true,
      isFmbLetter: isFmb,
    };

    // Only clear an already selected writer when the letter is newly classified as an FMB
    // letter (writer selection is not applicable there); a redundant blur of the unchanged
    // field must not wipe a writer that was already picked in a later step.
    const becomesFmb = isFmb && !props.completionState.isFmbLetter;
    const payload = becomesFmb
      ? { ...basePayload, writerAutoAvailable: false, writerEntity: null }
      : basePayload;

    props.onChange(payload);
    setError(false);
    setHelperText('');
  };

  const isFmbLetter = (letterName: string | null) => {
    if (letterName === null) {
      return false;
    }

    return letterName.length > 3 && letterName.toLowerCase().indexOf('fmb') === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLetterName(event.target.value);
    if (error) {
      setError(false);
      setHelperText('');
    }
  };

  return (
    <>
      <div className="autoSnippetFormRow" style={{ marginTop: '25px', width: '98%' }}>
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
  );
};

export default NewLetterLetterName;
