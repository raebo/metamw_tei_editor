import { ReactNode } from "react";
import { AppDispatch } from "../../redux/redux.store";

export type ComponentMappingItem = {
  name: string,
  showContainer: boolean
  component?: ReactNode
  action: (() => void)
};

export type EditorKeyHandleItem = {
  description: string,
  key: string,
  component: ReactNode | null,
  action: (() => Promise<string|null>) | null,
  openDialogAction?: ((dispatch: AppDispatch) => void)
}

export interface EditorLetter {
  id: number
  name: string
  title: string
  lastUpdatedByName: string
  lastUpdatedById: number
  updatedAt: Date;
}
export interface EditorEntity {
  id: number
  name: string
  type: string
  key: string
}
export interface PinnedLetter {
  id: number,
  name: string,
  contentChanged: boolean,
  isPinned: boolean
}
export interface SearchLetter {
  id: number
  name: string
  title: string
}

export interface ApiPinnedLetter {
  id: number,
  name: string,
  content_changed: boolean
}

export interface EditorLetterData {
  id: number
  name: string
  title: string
  xmlContent: string
}

export const mapApiToEditorLetter = (apiLetter: any): EditorLetter => {
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title,
    lastUpdatedByName: apiLetter.last_updated_by_name,
    lastUpdatedById: apiLetter.last_updated_by_id,
    updatedAt: new Date(apiLetter.updated_at)
  }
}

export const mapApiToLetterData = (apiLetter: any): SearchLetter => {
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title
  }
}

export const mapApiToEditorLetterData = (apiLetter: any): EditorLetterData => {
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title,
    xmlContent: apiLetter.xml_content
  }
}

export const mapApiToPinnedLetter = (apiPinnedLetter: ApiPinnedLetter): PinnedLetter => {

  return {
    id: apiPinnedLetter.id,
    name: apiPinnedLetter.name,
    contentChanged: apiPinnedLetter.content_changed,
    isPinned: true
  }
}

export interface ActOfWritingElement {
  role: "author" | "writer",
  key: string,
  name: string
}

export interface PersonEntity {
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
  placeOfBirth: string | null;
  placeOfDeath: string | null;
  wikiLink?: string;
  // add more as needed
}

export const mapRemotePersonToEntity = (raw: any): PersonEntity => {
  return {
    fullName: raw.full_name?.split(" // ")[0] || "Unbekannt",
    birthDate: raw.birth_date ?? null,
    deathDate: raw.death_date ?? null,
    placeOfBirth: raw.place_of_birth ?? null,
    placeOfDeath: raw.place_of_death ?? null,
    wikiLink: raw.relation ?? undefined,
  };
};
