export interface AutoAnnoType {
  id: number;
  name: string;
  status: string;
}

export interface AutoAnnoJobLetter {
  id: number;
  letter_name: string;
  status: string;
  xml_content: string
  xml_content_updated: string
  content_changed: boolean
}

export interface AutoAnnoSnippet {
  id: number
  xml_id: string
  status: string
  reference_key_orig: string
  reference_type_orig: string
  reference_key_final: string
  reference_type_final: string
  reference_name_orig: string
  reference_name_final: string
}

export interface SnippetEntity {
  entityId: number
  entityType: string
  entityKey: string
  entityName: string
  entityDisplayName: string
  entitySettlementKind?: string
  entityParentName?: string
  entityPlaceCountryName?: string
  entityKind?: string
}

export interface SnippetApiEntity {
  entity_id: number
  entity_key: string;
  entity_type: string;
  entity_name: string;
  entity_display_name: string;
  entity_settlement_kind?: string;
  entity_parent_name?: string;
  entity_place_country_name?: string;
  entity_kind?: string;
}

export type SnippetDialogType = "REJECT" | "ACCEPT" | "RESET_LETTER" | "WRITE_LETTER"


export const getStatusDetails = (status: string): { label: string; backgroundColor: string, foregroundColor: string } => {
  const statusDetails: { [key: string]: { label: string; backgroundColor: string, foregroundColor: string } } = {
    closed_success: { label: 'Akzeptiert', backgroundColor: '#d4edda', foregroundColor: '#000000' },
    checked_with_success: { label: 'Abgeschlossen', backgroundColor: '#d4edda', foregroundColor: '#000000' },
    closed_change: { label: 'Geändert', backgroundColor: '#d4edda', foregroundColor: '#000000' },
    closed_remove: { label: 'Entfernt', backgroundColor: '#f8d7da', foregroundColor: '#000000' },
    error: { label: 'Error', backgroundColor: '#f8d7da', foregroundColor: '#000000' },
    open: { label: 'Offen', backgroundColor: '#fff3cd', foregroundColor: '#000000' },
    ready_to_check: { label: 'Offen', backgroundColor: '#fff3cd', foregroundColor: '#000000' },
  };

  return statusDetails[status] || { label: 'Unknown', backgroundColor: '#ffffff', foregroundColor: '#000000' }; // Default values
};
