import { EditorConstants } from "../../constants/editor";
import { EditorUtils } from "./index";

export const textMarking = {
  isValidSelection(
    selection: Selection | null,
    rootElement: HTMLElement | null,
    onValid?: (selection: Selection, range: Range) => void,
    onInvalid?: (selection: Selection| null, message: string) => void

  ): boolean {
    const {ALLOWED_PARENT_TAG, FORBIDDEN_PARENT_TAG, RESTRICTED_TAGS} = EditorConstants

    if (!rootElement) return false;
    if (!selection || selection.isCollapsed) return false;

    const range = selection.getRangeAt(0);
    const startParent = range.startContainer.parentElement;
    const endParent = range.endContainer.parentElement;

    if (!startParent || !endParent) {
      if (onInvalid) onInvalid(selection, "No start or end parent")
      return false
    }

    if (startParent.closest(FORBIDDEN_PARENT_TAG) || endParent.closest(FORBIDDEN_PARENT_TAG)) {
      if (onInvalid) onInvalid(selection, "Bitte markieren Sie einen Bereich im Textkörper")
      return false;
    }

    const validParent = startParent.closest(ALLOWED_PARENT_TAG);

    if (!validParent) {
      if (onInvalid) onInvalid(selection, "No start or end parent")
      return false
    }

    const offsets = EditorUtils.xmlCheck.getSelectionOffsets(rootElement, range);

    if (!offsets) {
      if (onInvalid) onInvalid(selection, "No offsets")
      return false;
    }

    if (range.startContainer !== range.endContainer) {
      if (onInvalid) onInvalid(selection, "Ihre Auswahl überschneidet mehrere Abschnitte")
      return false; // Do nothing if the selection crosses nodes
    }

    onValid?.(selection, range)

    return true
  },
  markValidSelection(selection: Selection, range: Range) {
    const span = document.createElement("span");
    span.className = "marked";
    range.surroundContents(span);
    selection.removeAllRanges();
  },
  markedSpanEntries(): NodeListOf<Element> | null{
    return document.querySelectorAll("#letterXml > * span.marked");
  },
  markedSpanEntry(): Element | null {
    const entries = this.markedSpanEntries()

    return entries !== null ? entries[0] : null
  },
  removeMarkedSpans() {
    const markedSpans = this.markedSpanEntries()

    if (!markedSpans) return

    markedSpans.forEach((span) => {
      while (span.firstChild) {
        span.parentNode?.insertBefore(span.firstChild, span);
      }
      span.parentNode?.removeChild(span);
    });
  }
}
