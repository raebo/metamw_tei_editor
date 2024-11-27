import { SnackMessage } from "../interfaces/snackmessage.interface";
import makeReactiveVar from "../utils/makeReactiveVar";

export const snackVar = makeReactiveVar<SnackMessage | undefined>(undefined)