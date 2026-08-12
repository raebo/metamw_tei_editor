import { enqueueSnackbar } from 'notistack';

// TODO: letterId/isFavourite are unused - the actual publish call below is still commented out.
const handlePublishingClick = (_letterId: string | undefined, _isFavourite: boolean) => {
  (async () => {
    try {
      // await setLetterFavourite(parseInt(letterId || ""), isFavourite);
      enqueueSnackbar('Letter will be published!!!', { variant: 'success' });
    } catch (error) {
      console.error('Error updating letter publishing: ', error);
    }
  })();
};

export { handlePublishingClick };
