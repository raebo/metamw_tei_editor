export interface AutoAnnoJob {
  id: number;
  name: string;
  status: string;
  search_string: string;
  updated_at: string;
  letters_count: number;
  snippets_count: number;
  letters_open: number;
  letters_closed: number;
  snippets_open: number;
  snippets_closed: number;
}

export interface AutoAnnoJobLetter {
  id: number;
  letter_auto_anno_job_id: number;
  letter_name: string;
  status: string;
  snippets_count: number;
  snippets_open: number;
  snippets_closed: number;
  locking_user: {
    id: number;
    login: string;
    locked_since: string | null;
  } | null;
}

export interface AutoAnnoLetter extends AutoAnnoJobLetter {
  xml_content: string | null;
  content_changed: boolean;
}

export interface SnippetReference {
  id: number;
  key: string;
  name: string;
  type: string;
}

export interface AutoAnnoSnippet {
  id: number;
  xml_id: string;
  letter_auto_anno_letter_id: number;
  status: string;
  references: SnippetReference[];
  reference_key_final: string;
  reference_type_final: string;
  reference_name_final: string;
}

export interface SnippetEntity {
  entityId: number;
  entityType: string;
  entityKey: string;
  entityName: string;
  entityFirstName?: string;
  entityLastName?: string;
  entityDisplayName: string;
  entitySettlementKind?: string;
  entityParentName?: string;
  entityPlaceCountryName?: string;
  entityKind?: string;
  extraData: Record<string, unknown>;
}

export interface SnippetApiEntity {
  entity_id: number;
  entity_key: string | null;
  entity_type: string | null;
  entity_name: string | null;
  entity_display_name: string | null;
  entity_settlement_kind: string | boolean | null;
  entity_place_country_name: string | boolean | null;
  entity_kind: string | null;
  extra_data: Record<string, unknown> | boolean | null;
}

export interface RismEntry {
  id: number | null;
  name: string;
  title: string;
  city: string;
  country: string;
  code: string;
  idNo: string;
}

export interface RismFormEntry {
  country: string;
  settlement: string;
  institution: string;
  repository: string;
  collection: string;
  idNo: string;
}

export type SnippetDialogType = 'REJECT' | 'ACCEPT' | 'RESET_LETTER' | 'WRITE_LETTER';

export const getStatusDetails = (status: string | number): { label: string; backgroundColor: string; foregroundColor: string } => {
  const statusDetails: {
    [key: string]: { label: string; backgroundColor: string; foregroundColor: string };
  } = {
    closed_success: { label: 'Akzeptiert', backgroundColor: '#d4edda', foregroundColor: '#000000' },
    checked_with_success: {
      label: 'Abgeschlossen',
      backgroundColor: '#d4edda',
      foregroundColor: '#000000',
    },
    closed_change: { label: 'Geändert', backgroundColor: '#d4edda', foregroundColor: '#000000' },
    closed_remove: { label: 'Entfernt', backgroundColor: '#f8d7da', foregroundColor: '#000000' },
    error: { label: 'Error', backgroundColor: '#f8d7da', foregroundColor: '#000000' },
    open: { label: 'Offen', backgroundColor: '#fff3cd', foregroundColor: '#000000' },
    ready_to_check: { label: 'Offen', backgroundColor: '#fff3cd', foregroundColor: '#000000' },
    open_no_recommendation: {
      label: 'Offen',
      backgroundColor: '#fff3cd',
      foregroundColor: '#000000',
    },
  };

  return (
    statusDetails[String(status)] || {
      label: 'Unknown',
      backgroundColor: '#ffffff',
      foregroundColor: '#000000',
    }
  ); // Default values
};
