import { enqueueSnackbar } from "notistack";
import { setLetterFavourite } from "../../../../../services/editor/apiLetterRequest.service";

const handleFavouriteClick = (letterId: string | undefined, isFavourite: boolean) => {
  (async () => {
    try {
      await setLetterFavourite(parseInt(letterId || ""), isFavourite);
      enqueueSnackbar("Everything is fine!!!", { variant: 'success' });

    } catch (error) {
      console.error("Error updating letter favourite:", error);
    }
  })()
}

export { handleFavouriteClick };
