import {  textMarking } from "./textMarking";
import { xmlCheck } from "./xmlCheck";
import { markupGeneration } from "./markupGeneration";
import { backendService } from "./backendService";
import { keyPressHandles } from "./keyPressHandles";
import { removeNodeHandles } from "./removeNodeHandles";

export const EditorUtils = {
  backendService,
  keyPressHandles,
  markupGeneration,
  removeNodeHandles,
  textMarking,
  xmlCheck
}
