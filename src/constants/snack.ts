import { SnackMessage } from '../interfaces/snackmessage.interface';
import makeReactiveVar from '../utils/makeReactiveVar';

export const snackVar = makeReactiveVar<SnackMessage | undefined>(undefined);

// dayjs format tokens (not date-fns) — the source timestamp is plain ISO 8601, which dayjs
// parses natively without needing an explicit parse-format string.
export const jobUpdatedAtDisplayFormat = 'DD.MM.YYYY HH:mm';

export enum AnnoSnippetStatus {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}
