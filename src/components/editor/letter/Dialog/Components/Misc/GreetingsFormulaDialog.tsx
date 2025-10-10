import { DefaultDialogProps } from '../../EditorFormDialog';
import DialogContent from '@mui/material/DialogContent';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { EditorUtils } from '@src/utils/editor';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import { EditorConstants } from '@src/constants/editor';
import { DialogActionButton } from './DialogActionButton';

export interface GreetingsFormulaProps extends DefaultDialogProps {
  formulaType:
    | typeof EditorConstants.dialogTypes.MANAGE_GREETINGS_FORMULA
    | typeof EditorConstants.dialogTypes.ADD_GREETINGS_FORMULA;
}

type GreetingFormData = {
  greetingIsNew: boolean;
  greetingPosition: 'center' | 'left' | 'right';
  greetingText: string | null;
};

const GreetingsFormulaDialog = (props: GreetingsFormulaProps) => {
  const xmlDoc = props.xmlDoc;
  const [formData, setFormData] = React.useState<GreetingFormData | null>({
    greetingIsNew: true,
    greetingPosition: 'center',
    greetingText: null,
  });
  const [refNode, setRefNode] = useState<Element | null>(null);

  const updateFormData = (patch: Partial<GreetingFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    return () => {
      updateFormData({ greetingIsNew: true, greetingPosition: 'center', greetingText: '' });
    };
  }, []);

  useEffect(() => {
    if (!xmlDoc) return;

    try {
      const greetingNode = EditorUtils.xmlCheck.nodeWithTmpId(xmlDoc, props.formulaType);
      setRefNode(greetingNode);

      if (props.formulaType === 'ADD_NEW_GREETING') {
        updateFormData({ greetingIsNew: true });
      } else if (props.formulaType === 'MANAGE_GREETINGS_FORMULA') {
        const greetingPos =
          (greetingNode.getAttribute('rend') as 'center' | 'left' | 'right') || 'center';
        updateFormData({
          greetingIsNew: false,
          greetingPosition: greetingPos,
          greetingText: greetingNode.textContent?.trim() || null,
        });
      }
    } catch (error) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
    }
  }, [xmlDoc]);

  const validFormData = () => {
    if (!formData) return false;
    return !(!formData.greetingText || formData.greetingText.trim() === '');
  };

  const handleSave = async () => {
    try {
      if (!xmlDoc) {
        enqueueSnackbar('Ungültiges XML-Dokument', { variant: 'error' });
        props.onClose();
        return;
      }

      if (!formData || !validFormData()) {
        enqueueSnackbar('Ungültige Formulardaten', { variant: 'error' });
        props.onClose();
        return;
      }

      let changeType: string = EditorConstants.changeTypes.misc.BODY_SALUTE_ADDED;
      let message: string = 'Grußformel hinzugefügt';

      if (props.formulaType == 'ADD_NEW_GREETINGS_FORMULA') {
        const newGreeting = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'salute');
        newGreeting.setAttribute('rend', formData.greetingPosition);
        newGreeting.textContent = formData.greetingText ? formData.greetingText.trim() : '';
      } else if (props.formulaType == 'MANAGE_GREETINGS_FORMULA' && refNode) {
        changeType = EditorConstants.changeTypes.misc.BODY_SALUTE_CHANGED;
        message = 'Grußformel geändert';
        refNode.setAttribute('rend', formData?.greetingPosition || 'center');
        refNode.textContent = formData?.greetingText || '';
      }

      props.onSave(xmlDoc, changeType, message);
    } catch (error) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
    }
  };

  return (
    <>
      <DialogContent dividers>
        <div className="autoSnippetFormRow">
          <div className="form-item form-item--key">
            <FormControl variant="filled" sx={{ m: 1, minWidth: 120, width: '100%' }}>
              <InputLabel id="editor-dialog-greetings-formula-position">Position</InputLabel>
              <Select
                value={formData?.greetingPosition}
                disabled={false}
                id={'editor-dialog-greetings-formula-position'}
                onChange={(event) =>
                  updateFormData({
                    greetingPosition: event.target.value as 'center' | 'left' | 'right',
                  })
                }
              >
                {[
                  { value: 'center', label: 'Zentriert' },
                  { value: 'left', label: 'Links' },
                  { value: 'right', label: 'Rechts' },
                ].map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="form-item form-item--key">
            <TextField
              variant="filled"
              sx={{ m: 1, minWidth: 120, width: '100%' }}
              label="Begrüßungstext"
              value={formData?.greetingText || ''}
              onChange={(event) => updateFormData({ greetingText: event.target.value as string })}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActionButton
        label={'Grußformel Speichern'}
        onClick={handleSave}
        disabled={!validFormData}
      />
    </>
  );
};

export default GreetingsFormulaDialog;
