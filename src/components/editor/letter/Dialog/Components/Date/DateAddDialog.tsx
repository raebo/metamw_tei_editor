import React, { useEffect, useState } from 'react';
import { DefaultDialogProps} from '../../EditorFormDialog';
import {DateCertainty, EditorConstants, EditorDateType} from '../../../../../../constants/editor';
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/de'
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { EditorUtils } from '../../../../../../utils/editor';
import { enqueueSnackbar } from 'notistack';

export interface DateWhenAddDialogProps extends DefaultDialogProps {
  dateType: EditorDateType;
}

const DateAddDialog = (props: DateWhenAddDialogProps) => {

  dayjs.locale('de')
	const xmlDoc = props.xmlDoc
  const fallbackDate = dayjs("1832-01-01");
  const [dateStart, setDateStart] = useState<Dayjs | null>(null) //dayjs("1842-01-01"); // this is used as default only
  const minDate = dayjs("1800-01-01");
  const [selectedType, setSelectedType] = useState<EditorDateType>(props.dateType)
  const [certainty, setCertainty] = useState<DateCertainty>("high")
  const [dates, setDates] = useState<Dayjs[]>([])

  const dateLabelValues = {
    "when": "Datum",
    "when-custom": "Datum",
    "notAfter": "Nicht nach",
    "notBefore": "Nicht vor",
    "from-to-one": "Von (Start)",
    "from-to-two": "Bis (Ende)",
    "notBefore-notAfter-one": "Nicht vor",
    'notBefore-notAfter-two': 'Nicht nach',
  }

  useEffect(() => {
    const dateStart = dayjs(EditorUtils.xmlCheck.xmlLetterDate(xmlDoc))
    setDateStart(dateStart)
    setSelectedType(props.dateType);

    switch (props.dateType) {
      case "when":
      case "notAfter":
      case "notBefore":
        setDates([dateStart]);
        break;
      case "from-to":
      case "notBefore-notAfter":
      case "when-custom":
        setDates([dateStart, dateStart]);
        break;
    }

  }, [props.dateType]);


  const setDateValueFromPosition = (position: number, dateValue: Dayjs) => {
    const newDates = [...dates];
    if (position < newDates.length) {
      newDates[position] = dateValue;
    } else {
      newDates.push(dateValue);
    }
    setDates(newDates);
  }

  const handleCancelButtonClick = () => {
    props.onClose()
  }

  const handleSubmitButtonClick = async () => {
    try {
      if (!xmlDoc) {
				enqueueSnackbar("Kein XML-Dokument vorhanden", { variant: 'error' });
				props.onClose()
			}

      EditorUtils.markupGeneration.addDateMarkup(xmlDoc, handleGenerate() )

			props.onSave(xmlDoc, EditorConstants.changeTypes.misc.DATE_ADDED, "Datum wurde erfolgreich ausgezeichnet", null)

    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', { variant: 'error' });
			props.onClose()
    }
  }

  const handleGenerate = () : string => {
    let tag = "<date ";
    switch (selectedType) {
      case "when":
        tag += `when="${dates[0].format('YYYY-MM-DD')}"`;
        break;
      case "when-custom":
        tag += `when-custom="${dates.map((entry) => entry.format("YYYY-MM-DD")).filter(Boolean).join(" and ")}"`;
        break;
      case "notAfter":
        tag += `notAfter="${dates[0].format('YYYY-MM-DD')}"`;
        break;
      case "notBefore":
        tag += `notBefore="${dates[0]}.format('YYYY-MM-DD')}"`;
        break;
      case "from-to":
        tag += `from="${dates[0].format('YYYY-MM-DD')}" to="${dates[1].format('YYYY-MM-DD')}"`;
        break;
      case "notBefore-notAfter":
        tag += `notBefore="${dates[0].format('YYYY-MM-DD')}" notAfter="${dates[1].format('YYYY-MM-DD')}"`;
        break;
    }
    tag += ` cert="${certainty}" />`;

    return tag
  };

  const renderDateInputs = () => {
    switch (selectedType) {
      case "when":
      case "notAfter":
      case "notBefore":
        return (
          <DatePicker
            minDate={minDate}
            label={ dateLabelValues[selectedType] }
            value={dates[0] ? dates[0] : dateStart ? dateStart : fallbackDate }
            onChange={(date) => setDateValueFromPosition(0, dayjs(date))}
            slotProps={{
              textField: {
                InputLabelProps: { shrink: true }
              }
            }}
            />
        );
      case "from-to":
      case "notBefore-notAfter":
        return (
          <Box display="flex" gap={2}>
            <DatePicker
              minDate={minDate}
              label={ dateLabelValues[`${selectedType}-one`] }
              value={ dates[0] ? dates[0] : dateStart ? dateStart : fallbackDate }
              onChange={(date) => setDateValueFromPosition(0, dayjs(date)) }
              slotProps={{
                textField: {
                  InputLabelProps: { shrink: true }
                }
              }}
            />
            <DatePicker
              minDate={minDate}
              label={ dateLabelValues[`${selectedType}-two`] }
              value={ dates[1] ? dates[1] : dateStart ? dateStart : fallbackDate }
              onChange={(date) => setDateValueFromPosition(1, dayjs(date)) }
              slotProps={{
                textField: {
                  InputLabelProps: { shrink: true }
                }
              }}
            />
          </Box>
        );
      case "when-custom":
        return (
          <Box display="flex" flexDirection="column" gap={1}>
            { dates.map((date, index) => (
              <DatePicker
                minDate={minDate}
                label={ dateLabelValues[selectedType] }
                key={"datepicker-" + index}
                value={ dates[index] }
                onChange={(date) => setDateValueFromPosition(index, dayjs(date) ) }// .format("YYYY-MM-DD"))}
                slotProps={{
                  textField: {
                    InputLabelProps: { shrink: true }
                  }
                }}
                />
            ))}
            <Button disabled={dates.length > 2} onClick={() => setDates([...dates, dateStart ? dateStart : fallbackDate])} variant="outlined">
              + Add another date
            </Button>
          </Box>
        );
    }
  }

  return (
    <>
      <Box maxWidth={600} mx="auto" mt={4} p={2}>
        <Typography variant="h5" gutterBottom>
          Auszeichnung eines Datums
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel id="date-type-label">Art des Datums</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as EditorDateType);
              setDates([dateStart ? dateStart : fallbackDate]);
            }}
            label="Date Type"
          >
            <MenuItem value="when">Datum 'when'</MenuItem>
            <MenuItem value="when-custom">Datum 'when-custom'</MenuItem>
            <MenuItem value="notAfter">Datum 'notAfter'</MenuItem>
            <MenuItem value="notBefore">Datum 'notBefore'</MenuItem>
            <MenuItem value="from-to">Datum 'from / to'</MenuItem>
            <MenuItem value="notBefore-notAfter">Datum 'notBefore / notAfter'</MenuItem>
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
          {renderDateInputs()}
        </LocalizationProvider>

        <FormControl fullWidth margin="normal">
          <InputLabel id="certainty-label">Sicherheitsgrad der Datumsangabe</InputLabel>
          <Select
            labelId="certainty-label"
            value={certainty}
            onChange={(e) => setCertainty(e.target.value as DateCertainty)}
            label="Certainty"
          >
            <MenuItem value="high">Hoch</MenuItem>
            <MenuItem value="medium">Mittel</MenuItem>
            <MenuItem value="low">Niedrig</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSubmitButtonClick} disabled={ dates.length === 0 || certainty === null } >
            Datum Auszeichnen
          </Button>

          <Button variant="text" onClick={handleCancelButtonClick} color="secondary">
            Abbrechen
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default DateAddDialog;
