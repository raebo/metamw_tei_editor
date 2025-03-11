import { useEffect } from "react";

const useNoteClickHandler = (callback: (noteElement: Element) => void) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const noteElement = target.closest("note"); // Find closest <note> tag

      if (noteElement) {
        callback(noteElement);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [callback]);
};

export default useNoteClickHandler;
