import { textMarking } from "./textMarking";
import { xmlCheck } from "./xmlCheck";
import { markupGeneration } from "./markupGeneration";
import { nodeTypes } from "./nodeTypes";
import { backendService } from "./backendService";
import { keyPressHandles } from "./keyPressHandles";
import { rightClickPathHandles } from "./rightClickPathHandles";
import { pinnedLetters } from './pinnedLetters';
import { creationDataService } from "./creationDataService";
import { placeDataService } from "./placeDataService";
import { protagCreationDataService } from './protagCreationDataService';
import { teiHeaderContent } from "./teiHeaderContent";
import { writingActContent } from "./writingActContent";
import {miscContentCheck} from "./miscContentCheck";

export const EditorUtils = {
  backendService,
  creationDataService,
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
}
