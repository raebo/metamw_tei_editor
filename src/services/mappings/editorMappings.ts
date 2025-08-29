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
  isPinned: boolean,
  xmlContentCurrent?: string | null,
  viewMode: "CODE" | "WYSIWYG" | null
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
  xml_content_current?: string | null,
}

export interface EditorLetterData {
  id: number
  name: string
  title: string
  xmlContent: string
}

export interface MarkupPersonData {
  id: number | null,
  key: string,
  nameDisplay: string,
  nameLast: string | null,
  nameFirst: string | null,
  isNewEntry: boolean
}

export interface MarkupPlaceSettlement {
  key: string | null;
  type: string | null;
  name: string | null;
}

export interface MarkupPlaceData {
  key: string,
  placeType: string,
  name: string,
  settlement: MarkupPlaceSettlement | null
  country: CountryOption
  kind: string | null,
  kindOriginal: string | null,
  isNewEntry: boolean,
}

export interface ProtagCreationCategory {
  id: number;
  name: string;
  name_en: string
  protagCreationCategoryId: number | null;
}

export interface ProtagCreation{
  id: number;
  key: string;
  name: string;
  protagCreationCategoryId: number;
  mwv: string | null;
  opus: string | null;
}

export interface MarkupProtagCreationData {
  key: string
  name: string
  mwv: string | null
  opus: string  | null
  isNewEntry: boolean
  parentProtagCreations: ProtagCreationCategory[] | null
  protagCreationCategory: ProtagCreationCategory
}

export interface MarkupCreationData {
  author: {
    key: string
    firstName: string
    lastName: string
    isNewEntry: boolean
  } | null,
  creation: {
    key: string
    name: string
    kind: string
    isNewEntry: boolean
  } | null
}

export type SelectCompleteOption = {
  label: string;
  value: string;
}

export type CountryOption = {
  id: number | null;
  name: string | null;
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
    xmlContentCurrent: apiPinnedLetter.xml_content_current ?? null,
    isPinned: true,
    viewMode: 'WYSIWYG'
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
