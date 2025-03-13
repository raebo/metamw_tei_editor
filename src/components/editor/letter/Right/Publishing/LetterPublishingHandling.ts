import { enqueueSnackbar } from "notistack";

const handlePublishingClick = (letterId: string | undefined, isFavourite: boolean) => {
  (async () => {
    try {
      // await setLetterFavourite(parseInt(letterId || ""), isFavourite);
      enqueueSnackbar("Letter will be published!!!", { variant: 'success' });

    } catch (error) {
      console.error("Error updating letter publishing: ", error);
    }
  })()
}

export { handlePublishingClick };
