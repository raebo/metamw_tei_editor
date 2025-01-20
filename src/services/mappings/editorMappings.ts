import { ReactNode } from "react";

export type ComponentMappingItem = {
  showContainer: boolean
  component?: ReactNode
  action: (() => void)
};

export interface EditorLetter {
  id: number
  name: string
  title: string
  lastUpdatedByName: string
  lastUpdatedById: number
  updatedAt: Date;
}
export interface PinnedLetter {
  id: number,
  name: string
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

export const mapApiToEditorLetterData = (apiLetter: any): EditorLetterData => {
  return {
    id: apiLetter.id,
    name: apiLetter.name,
    title: apiLetter.title,
    xmlContent: apiLetter.xml_content
  }
}

export const mapApiToPinnedLetter = (resultAr: string[]): PinnedLetter => {
  return {
    id: parseInt(resultAr[0]),
    name: resultAr[1],
  }
}
