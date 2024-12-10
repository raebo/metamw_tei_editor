/**
 * Replaces a DOM element with a surrounding span element with the class "marked".
 * Removes all existing <span> elements with the "marked" class before replacing.
 *
 * @param element - The DOM element to replace.
 */
export const domReplaceNodeWithMarkedSpan = (element: Element): void => {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error("Invalid element provided.");
  }

  const existingMarkedSpans = document.querySelectorAll("span.marked");
  existingMarkedSpans.forEach((span) => span.replaceWith(...span.childNodes));

  const span = document.createElement("span");
  span.className = "marked";

  element.replaceWith(span);
  span.appendChild(element);
}