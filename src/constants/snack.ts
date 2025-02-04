import { SnackMessage } from "../interfaces/snackmessage.interface";
import makeReactiveVar from "../utils/makeReactiveVar";

export const snackVar = makeReactiveVar<SnackMessage | undefined>(undefined)

export const dateFnsParseFormat = "yyyy-MM-dd'T'HH:mm:ssXXX"
export const dateFnsFormat = "dd.MM.yyyy HH:mm"


export enum AnnoSnippetStatus {
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}
