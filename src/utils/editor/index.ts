import { textMarking } from "./textMarking";
import { xmlCheck } from "./xmlCheck";
import { markupGeneration } from "./markupGeneration";
import { nodeTypes } from "./nodeTypes";
import { backendService } from "./backendService";
import { keyPressHandles } from "./keyPressHandles";
import { removeNodeHandles } from "./removeNodeHandles";
import { pinnedLetters } from './pinnedLetters';
import { creationDataService } from "./creationDataService";
import { placeDataService } from "./placeDataService";

export const EditorUtils = {
  backendService,
  creationDataService,
  pinnedLetters,
  placeDataService,
  keyPressHandles,
  markupGeneration,
  nodeTypes,
  removeNodeHandles,
  textMarking,
  xmlCheck
}
