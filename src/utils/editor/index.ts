import {  textMarking } from "./textMarking";
import { xmlCheck } from "./xmlCheck";
import { markupGeneration } from "./markupGeneration";
import { nodeTypes } from "./nodeTypes";
import { backendService } from "./backendService";
import { keyPressHandles } from "./keyPressHandles";
import { removeNodeHandles } from "./removeNodeHandles";
import { pinnedLetters } from './pinnedLetters';

export const EditorUtils = {
  backendService,
  pinnedLetters,
  keyPressHandles,
  markupGeneration,
  nodeTypes,
  removeNodeHandles,
  textMarking,
  xmlCheck
}
