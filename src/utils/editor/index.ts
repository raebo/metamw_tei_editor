import { textMarking } from '@src/utils/editor/textMarking';
import { xmlCheck } from '@src/utils/editor/xmlCheck';
import { markupGeneration } from '@src/utils/editor/markupGeneration';
import { nodeTypes } from '@src/utils/editor/nodeTypes';
import { backendService } from '@src/utils/editor/backendService';
import { keyPressHandles } from '@src/utils/editor/keyPressHandles';
import { rightClickPathHandles } from '@src/utils/editor/rightClickPathHandles';
import { pinnedLetters } from '@src/utils/editor/pinnedLetters';
import { creationDataService } from '@src/utils/editor/creationDataService';
import { placeDataService } from '@src/utils/editor/placeDataService';
import { protagCreationDataService } from '@src/utils/editor/protagCreationDataService';
import { teiHeaderContent } from '@src/utils/editor/teiHeaderContent';
import { writingActContent } from '@src/utils/editor/writingActContent';
import { miscContentCheck } from '@src/utils/editor/miscContentCheck';
import { contentFlow } from '@src/utils/editor/contentFlow';
import { undoRedo } from '@src/utils/editor/undoRedo';
import { backendOrchestrator } from '@src/utils/editor/backendOrchestrator';
import { letterTabs } from '@src/utils/editor/letterTabs';

export type EditorUtilsType = {
  backendService: typeof backendService;
  backendOrchestrator: typeof backendOrchestrator;
  creationDataService: typeof creationDataService;
  contentFlow: typeof contentFlow;
  pinnedLetters: typeof pinnedLetters;
  placeDataService: typeof placeDataService;
  protagCreationDataService: typeof protagCreationDataService;
  keyPressHandles: typeof keyPressHandles;
  letterTabs: typeof letterTabs;
  markupGeneration: typeof markupGeneration;
  miscContentCheck: typeof miscContentCheck;
  nodeTypes: typeof nodeTypes;
  rightClickPathHandles: typeof rightClickPathHandles;
  teiHeaderContent: typeof teiHeaderContent;
  textMarking: typeof textMarking;
  undoRedo: typeof undoRedo;
  writingActContent: typeof writingActContent;
  xmlCheck: typeof xmlCheck;
};

function createEditorUtils(): EditorUtilsType {
  return {
    backendService,
    backendOrchestrator,
    creationDataService,
    contentFlow,
    pinnedLetters,
    placeDataService,
    protagCreationDataService,
    keyPressHandles,
    letterTabs,
    markupGeneration,
    miscContentCheck,
    nodeTypes,
    rightClickPathHandles,
    teiHeaderContent,
    textMarking,
    undoRedo,
    writingActContent,
    xmlCheck,
  };
}

export const EditorUtils = createEditorUtils();
