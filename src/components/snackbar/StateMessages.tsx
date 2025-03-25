import { useAppDispatch } from "../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { useCallback, useEffect } from "react";
import { setStateMessage } from "../../redux/slices/auto.letter.snippet.slice";
import { enqueueSnackbar } from "notistack";

const StateMessages = () => {
  const dispatch = useAppDispatch();

  const stateMessage = useSelector((state: RootState) => state.autoLetterSnippet.stateMessage);

  const clearStateMessage = useCallback(() => {
    dispatch(setStateMessage(null));
  }, [dispatch]);

  useEffect(() => {
    if (stateMessage) {
      enqueueSnackbar(stateMessage.message, { variant: stateMessage.variant });
      clearStateMessage(); // Call the memoized function
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateMessage, clearStateMessage]);

  return null;
};

export default StateMessages;
