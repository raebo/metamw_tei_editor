import { ReactNode } from 'react';
import { AppDispatch, RootState } from '@src/redux/redux.store';
import { z } from 'zod';
import {
  LetterCapabilities,
  letterCapabilitiesSchema,
  letterVersionSchema,
  parseLetterLifecycle,
} from '@src/schemas/editorLetterLifecycle';

const apiLetterLifecycleShape = {
  capabilities: letterCapabilitiesSchema,
  version: letterVersionSchema,
};

const apiEditorLetterSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  title: z.string().nullable(),
  last_updated_by_name: z.string().optional().default(''),
  last_updated_by_id: z.number().int().optional().default(0),
  updated_at: z.string().nullable().optional(),
  xml_content: z.string().nullable().optional(),
  ...apiLetterLifecycleShape,
});

const apiEditorLetterDataSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  title: z.string().nullable(),
  xml_content: z.string().nullable(),
  undo_available: z.boolean().optional().default(false),
  redo_available: z.boolean().optional().default(false),
  ...apiLetterLifecycleShape,
});

const apiPinnedLetterSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  content_changed: z.boolean(),
  xml_content_current: z.string().nullable().optional(),
  ...apiLetterLifecycleShape,
});

export type ComponentMappingItem = {
  name: string;
  showContainer: boolean;
  component?: ReactNode;
  action: () => void;
};

export type EditorKeyHandleItem = {
  description: string;
  key: string;
  component: ReactNode | null;
  action?: (() => Promise<string | null>) | ((dispatch: AppDispatch, getState: () => RootState) => Promise<string | null | void>) | null;
  xmlAction?: (xmlDoc: Document) => void;
  operationType?: string | undefined; // e.g., 'INSERT_PAGEBREAK', 'ADD_PARAGRAPH'
  successMessage?: string;
  openDialogAction?: (dispatch: AppDispatch, getState: () => RootState) => void;
  skipForHelp?: boolean; // optional, used to hide entry in help dialog
};

export interface EditorLetter {
  id: number;
  name: string;
  title: string;
  lastUpdatedByName: string;
  lastUpdatedById: number;
  updatedAt: Date;
  xmlContent: string | undefined;
  capabilities: LetterCapabilities;
  version: string;
}
export interface EditorEntity {
  id: number;
  name: string;
  type: string;
  key: string;
}
export interface PinnedLetter {
  id: number;
  name: string;
  contentChanged: boolean;
  isPinned: boolean;
  xmlContentCurrent?: string | null;
  viewMode: 'CODE' | 'WYSIWYG' | null;
  capabilities: LetterCapabilities | null;
  version: string | null;
}
export interface SearchLetter {
  id: number;
  name: string;
  title: string;
  capabilities: LetterCapabilities;
  version: string;
}

export interface EditorLetterData {
  id: number;
  name: string;
  title: string;
  xmlContent: string;
  undoAvailable: boolean;
  redoAvailable: boolean;
  capabilities: LetterCapabilities;
  version: string;
}

export interface MarkupPersonData {
  id: number | null;
  key: string;
  nameDisplay: string;
  nameLast: string | null;
  nameFirst: string | null;
  isNewEntry: boolean;
}

export interface MarkupPlaceSettlement {
  key: string | null;
  type: string | null;
  name: string | null;
}

export interface MarkupPlaceData {
  key: string;
  placeType: string;
  name: string;
  settlement: MarkupPlaceSettlement | null;
  country: CountryOption;
  kind: string | null;
  kindOriginal: string | null;
  isNewEntry: boolean;
}

export interface ProtagCreationCategory {
  id: number;
  name: string;
  name_en: string;
  protagCreationCategoryId: number | null;
}

export interface ProtagCreation {
  id: number;
  key: string;
  name: string;
  protagCreationCategoryId: number;
  mwv: string | null;
  opus: string | null;
}

export interface MarkupProtagCreationData {
  key: string;
  name: string;
  mwv: string | null;
  opus: string | null;
  isNewEntry: boolean;
  parentProtagCreations: ProtagCreationCategory[] | null;
  protagCreationCategory: ProtagCreationCategory;
}

export interface MarkupCreationData {
  author: {
    key: string;
    firstName: string;
    lastName: string;
    isNewEntry: boolean;
  } | null;
  creation: {
    key: string;
    name: string;
    kind: string;
    isNewEntry: boolean;
  } | null;
}

export type HiRendType = 'latintype' | null;

export type SelectCompleteOption = {
  label: string;
  value: string;
};

export type CountryOption = {
  id: number | null;
  name: string | null;
};

export const mapApiToEditorLetter = (value: unknown): EditorLetter => {
  const apiLetter = apiEditorLetterSchema.parse(value);
  const lifecycle = parseLetterLifecycle(apiLetter);
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title ?? '',
    lastUpdatedByName: apiLetter.last_updated_by_name,
    lastUpdatedById: apiLetter.last_updated_by_id,
    updatedAt: apiLetter.updated_at ? new Date(apiLetter.updated_at) : new Date(0),
    xmlContent: apiLetter.xml_content ?? undefined,
    ...lifecycle,
  };
};

export const mapApiToLetterData = (value: unknown): SearchLetter => {
  const apiLetter = apiEditorLetterSchema.parse(value);
  const lifecycle = parseLetterLifecycle(apiLetter);
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title ?? '',
    ...lifecycle,
  };
};

export const mapApiToEditorLetterData = (value: unknown): EditorLetterData => {
  const apiLetter = apiEditorLetterDataSchema.parse(value);
  const lifecycle = parseLetterLifecycle(apiLetter);
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title ?? '',
    xmlContent: apiLetter.xml_content ?? '',
    undoAvailable: apiLetter.undo_available,
    redoAvailable: apiLetter.redo_available,
    ...lifecycle,
  };
};

export const mapApiToPinnedLetter = (value: unknown): PinnedLetter => {
  const apiPinnedLetter = apiPinnedLetterSchema.parse(value);
  const lifecycle = parseLetterLifecycle(apiPinnedLetter);
  return {
    id: apiPinnedLetter.id,
    name: apiPinnedLetter.name,
    contentChanged: apiPinnedLetter.content_changed,
    xmlContentCurrent: apiPinnedLetter.xml_content_current ?? null,
    isPinned: true,
    viewMode: 'WYSIWYG',
    ...lifecycle,
  };
};

export interface ActOfWritingElement {
  role: 'author' | 'writer';
  key: string;
  name: string;
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
    fullName: raw.full_name?.split(' // ')[0] || 'Unbekannt',
    birthDate: raw.birth_date ?? null,
    deathDate: raw.death_date ?? null,
    placeOfBirth: raw.place_of_birth ?? null,
    placeOfDeath: raw.place_of_death ?? null,
    wikiLink: raw.relation ?? undefined,
  };
};
