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

export const EditorUtils = {
  backendService,
  creationDataService,
  contentFlow,
  pinnedLetters,
  placeDataService,
  protagCreationDataService,
  keyPressHandles,
  markupGeneration,
  miscContentCheck,
  nodeTypes,
  rightClickPathHandles,
  teiHeaderContent,
  textMarking,
  writingActContent,
  xmlCheck,
};
