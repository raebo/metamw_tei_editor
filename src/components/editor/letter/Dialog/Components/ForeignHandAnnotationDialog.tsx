import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Autocomplete, Button, CircularProgress, MenuItem, Stack, TextField } from '@mui/material';
import { debounce } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants, EntityType } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor';
import {
  deleteForeignHandAnnotation,
  FOREIGN_HAND_ANNOTATION_PLACES,
  FOREIGN_HAND_ANNOTATION_SUBTYPES,
  insertForeignHandAnnotation,
  readForeignHandAnnotation,
  updateForeignHandAnnotation,
  type ForeignHandAnnotationData,
} from '@src/utils/editor/foreignHandAnnotation';
import { MiscUtils } from '@src/utils/misc';
import { searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';
import type { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import type { DefaultDialogProps } from '../EditorFormDialog';

const EMPTY_DATA: ForeignHandAnnotationData = {
  content: '',
  subtype: 'anonymus',
  place: 'bottom',
  responsibility: '',
  number: '',
};

const personReference = (entityKey: string): string => `#${entityKey.replace(/^#/, '')}`;

const ForeignHandAnnotationDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit';
  const [data, setData] = useState<ForeignHandAnnotationData>(EMPTY_DATA);
  const [note, setNote] = useState<Element | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [people, setPeople] = useState<SnippetEntity[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const peopleRequestId = useRef(0);

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selectedNote = EditorUtils.xmlCheck.elementByXmlTypeAndId(reference.elementXmlId, 'note', props.xmlDoc);
      if (!selectedNote) throw new Error('The selected annotation could not be found.');
      setNote(selectedNote);
      setData(readForeignHandAnnotation(selectedNote));
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [editing, props.xmlDoc, reference.elementXmlId]);

  const searchPeople = useCallback(
    async (searchValue: string | null) => {
      const requestId = ++peopleRequestId.current;
      setPeopleLoading(true);
      setPeopleError(null);
      try {
        const result = await searchEditortEntities(searchValue, EntityType.PERSON);
        if (requestId === peopleRequestId.current) setPeople(result ?? []);
      } catch (error) {
        if (requestId === peopleRequestId.current) {
          setPeopleError(
            t('editor:dialog.foreignHandAnnotation.personSearchError', {
              reason: MiscUtils.misc.getErrorMessage(error),
            }),
          );
        }
      } finally {
        if (requestId === peopleRequestId.current) setPeopleLoading(false);
      }
    },
    [t],
  );

  const debouncedPeopleSearch = useMemo(() => debounce((searchValue: string) => void searchPeople(searchValue), 300), [searchPeople]);

  useEffect(() => {
    if (data.subtype !== 'name') return;
    void searchPeople(null);
    return () => {
      peopleRequestId.current += 1;
      debouncedPeopleSearch.cancel();
    };
  }, [data.subtype, debouncedPeopleSearch, searchPeople]);

  const selectedPerson = useMemo(
    () =>
      people.find(
        (person) =>
          personReference(person.entityKey) === data.responsibility ||
          person.entityName === data.responsibility ||
          person.entityDisplayName === data.responsibility,
      ) ??
      (data.responsibility
        ? {
            entityId: -1,
            entityType: EntityType.PERSON,
            entityKey: data.responsibility,
            entityName: data.responsibility,
            entityDisplayName: data.responsibility,
            extraData: {},
          }
        : null),
    [data.responsibility, people],
  );

  const personOptions = useMemo(
    () =>
      selectedPerson && !people.some((person) => person.entityKey === selectedPerson.entityKey) ? [selectedPerson, ...people] : people,
    [people, selectedPerson],
  );

  const subtypeIsUnknown = data.subtype !== '' && !FOREIGN_HAND_ANNOTATION_SUBTYPES.some((subtype) => subtype === data.subtype);
  const placeIsUnknown = data.place !== '' && !FOREIGN_HAND_ANNOTATION_PLACES.some((place) => place === data.place);
  const submitDisabled = useMemo(
    () => deletePending || !data.content.trim() || !data.subtype || !data.place || (data.subtype === 'name' && !data.responsibility.trim()),
    [data, deletePending],
  );

  const setField = <K extends keyof ForeignHandAnnotationData>(field: K, value: ForeignHandAnnotationData[K]) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const save = () => {
    setErrorMessage(null);
    try {
      let savedNote: Element;
      if (editing) {
        if (!note) throw new Error('The selected annotation could not be found.');
        savedNote = updateForeignHandAnnotation(note, data);
      } else {
        if (!reference.elementXmlId || !reference.elementKey) throw new Error('The annotation insertion position is missing.');
        savedNote = insertForeignHandAnnotation(props.xmlDoc, reference.elementXmlId, reference.elementKey, data);
      }
      props.onSave(
        props.xmlDoc,
        editing ? EditorConstants.changeTypes.note.CONTENT_CHANGED : EditorConstants.changeTypes.note.ADDED,
        t(editing ? 'editor:dialog.foreignHandAnnotation.success.updated' : 'editor:dialog.foreignHandAnnotation.success.added'),
        savedNote.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      if (!note) throw new Error('The selected annotation could not be found.');
      deleteForeignHandAnnotation(note);
      props.onSave(props.xmlDoc, EditorConstants.changeTypes.note.REMOVED, t('editor:dialog.foreignHandAnnotation.success.deleted'), null);
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t('editor:dialog.foreignHandAnnotation.contract')}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <TextField
        select
        required
        disabled={deletePending}
        label={t('editor:dialog.foreignHandAnnotation.fields.subtype')}
        value={data.subtype}
        onChange={(event) => {
          const subtype = event.target.value;
          setData((current) => ({
            ...current,
            subtype,
            responsibility: subtype === 'name' ? current.responsibility : '',
          }));
        }}
      >
        {FOREIGN_HAND_ANNOTATION_SUBTYPES.map((subtype) => (
          <MenuItem key={subtype} value={subtype}>
            {t(`editor:dialog.foreignHandAnnotation.subtypes.${subtype}`)}
          </MenuItem>
        ))}
        {subtypeIsUnknown && (
          <MenuItem value={data.subtype}>{t('editor:dialog.foreignHandAnnotation.legacyValue', { value: data.subtype })}</MenuItem>
        )}
      </TextField>
      {data.subtype === 'name' && (
        <Autocomplete
          options={personOptions}
          value={selectedPerson}
          loading={peopleLoading}
          disabled={deletePending}
          isOptionEqualToValue={(option, value) => option.entityKey === value.entityKey}
          getOptionLabel={(option) => option.entityDisplayName || option.entityName}
          filterOptions={(options) => options}
          onChange={(_, person) => setField('responsibility', person ? personReference(person.entityKey) : '')}
          onInputChange={(_, inputValue, reason) => {
            if (reason === EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.INPUT) {
              debouncedPeopleSearch(inputValue);
            } else if (reason === EditorConstants.AUTOCOMPLETE_INPUT_CHANGE_REASONS.CLEAR) {
              debouncedPeopleSearch.cancel();
              void searchPeople(null);
            }
          }}
          loadingText={t('editor:dialog.foreignHandAnnotation.personLoading')}
          noOptionsText={t('editor:dialog.foreignHandAnnotation.noPeople')}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label={t('editor:dialog.foreignHandAnnotation.fields.responsibility')}
              error={Boolean(peopleError)}
              helperText={peopleError}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {peopleLoading && <CircularProgress color="inherit" size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
      <TextField
        select
        required
        disabled={deletePending}
        label={t('editor:dialog.foreignHandAnnotation.fields.place')}
        value={data.place}
        onChange={(event) => setField('place', event.target.value)}
      >
        {FOREIGN_HAND_ANNOTATION_PLACES.map((place) => (
          <MenuItem key={place} value={place}>
            {t(`editor:dialog.foreignHandAnnotation.places.${place}`)}
          </MenuItem>
        ))}
        {placeIsUnknown && (
          <MenuItem value={data.place}>{t('editor:dialog.foreignHandAnnotation.legacyValue', { value: data.place })}</MenuItem>
        )}
      </TextField>
      {editing && (
        <TextField
          disabled
          label={t('editor:dialog.foreignHandAnnotation.fields.number')}
          value={data.number}
          helperText={t('editor:dialog.foreignHandAnnotation.numberHint')}
        />
      )}
      <TextField
        required
        multiline
        minRows={4}
        disabled={deletePending}
        label={t('editor:dialog.foreignHandAnnotation.fields.content')}
        value={data.content}
        onChange={(event) => setField('content', event.target.value)}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.foreignHandAnnotation.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.foreignHandAnnotation.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.foreignHandAnnotation.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={submitDisabled} onClick={save}>
            {t(editing ? 'editor:dialog.foreignHandAnnotation.buttons.update' : 'editor:dialog.foreignHandAnnotation.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default ForeignHandAnnotationDialog;
