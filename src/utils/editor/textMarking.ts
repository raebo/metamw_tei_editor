import { EditorConstants } from "../../constants/editor";
import { EditorUtils } from "./index";

export const textMarking = {
  isValidSelection(
    selection: Selection | null,
    rootElement: HTMLElement | null,
    onValid?: (selection: Selection) => void,
    onInvalid?: (message: string) => void
  ): boolean {
    const { ALLOWED_PARENT_TAG, FORBIDDEN_PARENT_TAG } = EditorConstants

    if (!rootElement) return false;
    if (!selection || selection.isCollapsed) return false;

    const range = selection.getRangeAt(0);
    const startParent = range.startContainer.parentElement;
    const endParent = range.endContainer.parentElement;

    if (!startParent || !endParent) {
      if (onInvalid) onInvalid("No start or end parent")
      return false
    }

    if (startParent.closest(FORBIDDEN_PARENT_TAG) || endParent.closest(FORBIDDEN_PARENT_TAG)) {
      if (onInvalid) onInvalid("Bitte markieren Sie einen Bereich im Textkörper")
      return false;
    }

    const validParent = startParent.closest(ALLOWED_PARENT_TAG);

    if (!validParent) {
      if (onInvalid) onInvalid("No start or end parent")
      return false
    }

    const offsets = EditorUtils.xmlCheck.getSelectionOffsets(rootElement, range);

    if (!offsets) {
      if (onInvalid) onInvalid("No offsets")
      return false;
    }

    if (range.startContainer !== range.endContainer) {
      if (onInvalid) onInvalid("Ihre Auswahl überschneidet mehrere Abschnitte")
      return false; // Do nothing if the selection crosses nodes
    }

    onValid?.(selection)

    return true
  },
  markValidSelection(selection: Selection, range: Range) {
    const span = document.createElement("span");
    span.className = "marked";
    range.surroundContents(span);
    selection.removeAllRanges();
  },
  markedSpanEntries(root: Element |null): NodeListOf<Element> | null{
    if (!root) {
      throw new Error("markedSpanEntries: root is null");
    }

    return root.querySelectorAll("#letterXml > * span.marked");
  },
  markedSpanEntry(root: Element | null): Element | null {
    if (root === null) {
      throw new Error("markedSpanEntry: root is null");
    }

    const entries = this.markedSpanEntries(root)

    return entries !== null ? entries[0] : null
  },
  removeMarkedSpans(root: Element | null) {
    if (root === null) {
      throw new Error("removeMarkedSpans: root is null");
    }

    const markedSpans = this.markedSpanEntries(root)

    if (!markedSpans) return

    markedSpans.forEach((span) => {
      while (span.firstChild) {
        span.parentNode?.insertBefore(span.firstChild, span);
      }
      span.parentNode?.removeChild(span);
    });
  },
	addTmpIdToNode(xmlDoc: Document, node: Element, tmpIdPrefix: string): void {
		if (!xmlDoc) throw new Error("No XML document provided.");
		const nodePath = EditorUtils.xmlCheck.getNodePath(node);
		const xmlNode = EditorUtils.xmlCheck.getNodeByPath(xmlDoc, nodePath) as Element | null;
		if (!xmlNode) throw new Error("Could not resolve node in XML doc");

		let tmpId = xmlNode.getAttribute("tmp_id");
		if (!tmpId) {
			tmpId = `tmp-${tmpIdPrefix}-${Date.now()}`; // or a counter/uuid
			xmlNode.setAttribute("tmp_id", tmpId);
		}
	}
}
