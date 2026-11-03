import { DefaultDialogProps } from '../EditorFormDialog';
import DynamicDataDisplay from '@src/components/support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '@src/utils/entityMappings';
import React, { useCallback, useEffect, useRef } from 'react';
import { Divider } from '@mui/material';
import TeiHeaderFirstHeadline from './TeiHeaderDialog/10TeiHeaderFirstHeadline';
import TeiHeaderSndHeadline from './TeiHeaderDialog/20TeiHeaderSndHeadline';
import TeiHeaderPrevLetter from './TeiHeaderDialog/30TeiHeaderPrevLetter';
import TeiHeaderNextLetter from './TeiHeaderDialog/40TeiHeaderNextLetter';
import TeiHeaderTransEdition from './TeiHeaderDialog/70TeiHeaderTransEdition';
import { MiscUtils } from '@src/utils/misc';
import NewLetterLetterName from './NewLetterDialog/10NewLetterLetterName';
import { enqueueSnackbar } from 'notistack';
import { createNewLetter, LetterLifecycleRequestError } from '@src/services/editor/apiLettersRequest.service';
import TeiHeaderWritingReceivingPlace from './TeiHeaderDialog/50TeiHeaderWritingReceivingPlace';
import { SearchLetter } from '@src/services/mappings/editorMappings';
import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import TeiHeaderWritingPerson from './NewLetterDialog/20TeiHeaderWritingPerson';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorUtils } from '@src/utils/editor';
import { setEditorPinnedLetters } from '@src/redux/slices/editor.letter.slice';
import { setEditorTabAndPinnedLetterThunk } from '@src/redux/thunks/editor.letter.thunk';
import { HeaderPerson, LanguageOption } from '@src/constants/editor';
import TeiHeaderEditorTranskriptor from './TeiHeaderDialog/80EditorTranskriptor';
import TeiHeaderReceivers from './TeiHeaderDialog/60TeiHeaderReceivers';
import DialogContent from '@mui/material/DialogContent';
import { DialogActionButton } from './Misc/DialogActionButton';
import StepNavigation from './NewLetterDialog/StepNavigation';
import { useTranslation } from 'react-i18next';
import { fetchPinnedLetterData } from '@src/services/editor/apiPinnedLettersRequest.service';

export type NewLetterDialogProps = {
  autoAvailable: boolean | null;
  completionState: NewLetterCompletionState;
  onChange: (updates: Partial<NewLetterCompletionState>) => void;
};

export type NewLetterCompletionState = {
  isFmbLetter: boolean;
  letterNameComplete: boolean;
  letterName: string | null;
  firstHeaderComplete: boolean;
  firstHeaderContent: string | null;
  sndHeaderComplete: boolean;
  sndHeaderContent: string | null;
  prevLetterAutoAvailable: boolean;
  prevLetterType: 'unknown' | 'not_identified' | 'select' | null;
  prevLetter: SearchLetter | null;
  nextLetterAutoAvailable: boolean;
  nextLetterType: 'unknown' | 'not_identified' | 'select' | null;
  nextLetter: SearchLetter | null;
  transkriptionValue: string;
  editionValue: string;
  writerAutoAvailable: boolean;
  writerEntity: SnippetEntity | null;
  writingPlaceAutoAvailable: boolean;
  writingPlace: SnippetEntity | null;
  receiverAutoAvailable: boolean;
  receivers: HeaderPerson[];
  receivingPlaceAutoAvailable: boolean;
  receivingPlace: SnippetEntity | null;
  letterLanguage: LanguageOption[] | [];
  editorValue: string | null;
  transkriptorValue: string | null;
};

const STEP_ORDER = ['letterName', 'headlines', 'referenceLetters', 'writer', 'receiver', 'transEdition', 'editorTranskriptor'] as const;

type StepKey = (typeof STEP_ORDER)[number];

const AddNewLetterDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const td = (key: string) => t(`editor:dialog.newLetterDialog.${key}`);
  const stepLabels: Record<StepKey, string> = {
    letterName: td('steps.letterName'),
    headlines: td('steps.headlines'),
    referenceLetters: td('steps.referenceLetters'),
    writer: td('steps.writer'),
    receiver: td('steps.receiver'),
    transEdition: td('steps.transEdition'),
    editorTranskriptor: td('steps.editorTranskriptor'),
  };
  const STEP_DEFINITIONS = STEP_ORDER.map((key) => ({ key, label: stepLabels[key] }));

  const dispatch = useAppDispatch();
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  const [displayData] = React.useState<{ [key: string]: string } | null>(null);

  const [completionState, setCompletionState] = React.useState<NewLetterCompletionState>({
    isFmbLetter: false,
    letterNameComplete: false,
    letterName: null,
    firstHeaderComplete: false,
    firstHeaderContent: null,
    sndHeaderComplete: false,
    sndHeaderContent: null,
    prevLetterAutoAvailable: false,
    prevLetterType: null,
    prevLetter: null,
    nextLetterAutoAvailable: false,
    nextLetterType: null,
    nextLetter: null,
    transkriptionValue: 'FMB-C',
    editionValue: 'FMB-C',
    writerAutoAvailable: true,
    writerEntity: null,
    writingPlaceAutoAvailable: true,
    writingPlace: null,
    receiverAutoAvailable: true,
    receivers: [],
    receivingPlaceAutoAvailable: true,
    receivingPlace: null,
    letterLanguage: [],
    editorValue: null,
    transkriptorValue: null,
  });

  const submitCreateHandler = async () => {
    try {
      const { newLetterId } = await createNewLetter(completionState);
      const createdLetter = await fetchPinnedLetterData(newLetterId);
      if (createdLetter.id !== newLetterId) {
        throw new Error('Created letter ID does not match the pinned working copy');
      }

      const newPinnedLetters = EditorUtils.pinnedLetters.computeNewPinnedLetters(statePinnedLetters, {
        id: createdLetter.id,
        name: createdLetter.name,
        isPinned: true,
        viewMode: 'WYSIWYG',
        capabilities: createdLetter.capabilities,
        version: createdLetter.version,
      });
      dispatch(setEditorPinnedLetters({ pinnedLetters: newPinnedLetters }));
      const newLetterTabNumber = newPinnedLetters.findIndex((letter) => letter.id === newLetterId);
      if (newLetterTabNumber < 0) {
        throw new Error('Newly created letter is missing from the pinned letter list');
      }
      await dispatch(
        setEditorTabAndPinnedLetterThunk({
          letter: {
            id: createdLetter.id,
            name: createdLetter.name,
            viewMode: 'WYSIWYG',
            xmlContent: createdLetter.xmlContent,
            capabilities: createdLetter.capabilities,
            version: createdLetter.version,
          },
          tabNumber: newLetterTabNumber,
          textIsMarked: false,
          reloadLetterContent: false,
        }),
      ).unwrap();

      enqueueSnackbar(`New letter '${completionState.letterName}' created successfully`, {
        variant: 'success',
      });
      props.onClose();
    } catch (error) {
      const reasonCode = error instanceof LetterLifecycleRequestError ? error.reasonCode : undefined;
      const errorMessage = reasonCode ? t(`editor:common.letterLifecycle.reasons.${reasonCode}`) : MiscUtils.misc.getErrorMessage(error);
      enqueueSnackbar('Error creating new letter: ' + errorMessage, {
        variant: 'error',
      });
    }
  };

  const childOnChange = MiscUtils.stateHandling.createHandleChange(setCompletionState);

  const goToPreviousStep = useCallback(() => setCurrentStepIndex((i) => Math.max(0, i - 1)), []);
  // STEP_ORDER.length (not STEP_DEFINITIONS.length): STEP_DEFINITIONS is rebuilt every render
  // from the module-level, constant-length STEP_ORDER, so referencing STEP_ORDER directly
  // avoids needing STEP_DEFINITIONS itself as a dependency here.
  const goToNextStep = useCallback(() => setCurrentStepIndex((i) => Math.min(STEP_ORDER.length - 1, i + 1)), []);

  const currentStep = STEP_DEFINITIONS[currentStepIndex];
  const previousStep = currentStepIndex > 0 ? STEP_DEFINITIONS[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < STEP_DEFINITIONS.length - 1 ? STEP_DEFINITIONS[currentStepIndex + 1] : null;

  // Arrow-key navigation, but only when focus is not inside a text input, so that
  // e.g. cursor movement in Autocomplete/TextField is not interfered with.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isTextInput =
        !!activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);

      if (isTextInput) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousStep();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextStep();
      }
    };

    const node = containerRef.current;
    node?.addEventListener('keydown', handleKeyDown);
    return () => node?.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousStep, goToNextStep]);

  // Saving is intentionally allowed as soon as the letter name is set; every other field
  // (headlines, writer, prev/next letter, writing/receiving place, receivers, language,
  // editor/transcriber) is optional and can be filled in later.
  const saveIsAvailable = completionState.letterNameComplete;

  const renderStepContent = (stepKey: StepKey) => {
    switch (stepKey) {
      case 'letterName':
        return <NewLetterLetterName autoAvailable={null} completionState={completionState} onChange={childOnChange} />;
      case 'headlines':
        return (
          <>
            <TeiHeaderFirstHeadline
              teiHeader={null}
              autoAvailable={completionState.firstHeaderComplete}
              completionState={completionState}
              onChange={childOnChange}
            />
            <TeiHeaderSndHeadline
              teiHeader={null}
              autoAvailable={completionState.sndHeaderComplete}
              completionState={completionState}
              onChange={childOnChange}
            />
          </>
        );
      case 'referenceLetters':
        return (
          <>
            <TeiHeaderPrevLetter
              teiHeader={null}
              autoAvailable={completionState.prevLetterAutoAvailable}
              completionState={completionState}
              onChange={childOnChange}
            />
            <TeiHeaderNextLetter
              teiHeader={null}
              autoAvailable={completionState.nextLetterAutoAvailable}
              completionState={completionState}
              onChange={childOnChange}
            />
          </>
        );
      case 'writer':
        return (
          <>
            <TeiHeaderWritingPerson
              autoAvailable={completionState.letterNameComplete}
              completionState={completionState}
              onChange={childOnChange}
            />
            <TeiHeaderWritingReceivingPlace
              teiHeader={null}
              autoAvailable={null}
              completionState={completionState}
              onChange={childOnChange}
              dialogType={'writing'}
              textFieldValue={t('editor:dialog.teiHeaderWritingReceivingPlace.label.chooseWritingPlace')}
            />
          </>
        );
      case 'receiver':
        return (
          <>
            <TeiHeaderReceivers
              teiHeader={null}
              autoAvailable={completionState.receiverAutoAvailable}
              completionState={completionState}
              onChange={childOnChange}
            />
            <TeiHeaderWritingReceivingPlace
              teiHeader={null}
              autoAvailable={null}
              completionState={completionState}
              onChange={childOnChange}
              dialogType={'receiving'}
              textFieldValue={t('editor:dialog.teiHeaderWritingReceivingPlace.label.chooseReceivingPlace')}
            />
          </>
        );
      case 'transEdition':
        return <TeiHeaderTransEdition teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} />;
      case 'editorTranskriptor':
        return (
          <TeiHeaderEditorTranskriptor teiHeader={null} autoAvailable={null} completionState={completionState} onChange={childOnChange} />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} tabIndex={-1}>
      <DialogContent>
        <div className="autoSnippetFormRow">
          {displayData !== null ? <DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} /> : <></>}
        </div>

        {renderStepContent(currentStep.key)}
      </DialogContent>

      <Divider
        sx={{
          marginTop: 5,
        }}
      />

      <DialogContent>
        <StepNavigation
          currentIndex={currentStepIndex}
          totalSteps={STEP_DEFINITIONS.length}
          currentLabel={currentStep.label}
          previousLabel={previousStep?.label ?? null}
          nextLabel={nextStep?.label ?? null}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
        />

        {/* saveing is always possible, even if not all fields are set. */}
        <DialogActionButton label={td('button.create')} onClick={submitCreateHandler} disabled={!saveIsAvailable} />
      </DialogContent>
    </div>
  );
};

export default AddNewLetterDialog;
