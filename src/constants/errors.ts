import { SnackMessage } from "../interfaces/snackmessage.interface";

const UNKNOWN_ERROR_MESSAGE = 'An unknown error occurred. Please try again later.';

const UNKNOWN_SNACK_ERROR_MESSAGE: SnackMessage = {
  message: UNKNOWN_ERROR_MESSAGE,
  type: 'error'
}

export { UNKNOWN_SNACK_ERROR_MESSAGE, UNKNOWN_ERROR_MESSAGE}