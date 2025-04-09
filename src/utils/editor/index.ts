import {  textMarking } from "./textMarking";
import { xmlCheck } from "./xmlCheck";
import { markupGeneration } from "./markupGeneration";
import { nodeTypes } from "./nodeTypes";
import { backendService } from "./backendService";
import { keyPressHandles } from "./keyPressHandles";
import { removeNodeHandles } from "./removeNodeHandles";

export const EditorUtils = {
  backendService,
  keyPressHandles,
  markupGeneration,
  nodeTypes,
  removeNodeHandles,
  textMarking,
  xmlCheck
}
