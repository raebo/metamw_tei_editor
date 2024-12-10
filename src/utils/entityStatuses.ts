type AutoAnnoLetterStatus = "open" | "ready_to_check" | "checked_with_success" | "error";

type EntityStatus = {
  AutoAnnoLetter: AutoAnnoLetterStatus;
}

const Statuses = {
  AutoAnnoLetter: {
    OPEN: 'open',
    READY_TO_CHECK: 'ready_to_check',
    CHECKED_WITH_SUCCESS: 'checked_with_success',
    ERROR: 'error'
  }
}

// Create a type from the Statuses object for additional type safety.
type StatusesType = typeof Statuses;

export { Statuses };