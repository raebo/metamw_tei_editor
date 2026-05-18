import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import React, { useEffect, useState } from 'react';
import {
  fetchMetamwEntityData,
  fetchMetamwLetterData,
} from '@src/services/auto_anno/apiMetaMw.service';
import DynamicDataDisplay from '@src/components/support/DynamicDataDisplay';
import type { ClickedEntityNode } from '@src/redux/slices/editor.letter.slice';
import { DISPLAY_NAME_MAP } from '@src/utils/entityMappings';
import { enqueueSnackbar } from 'notistack';

type EntityData = {
  country?: { name: string } | string;
  settlement?: { name: string } | string;
} & Record<string, string | object | undefined>;

const REJECTED_KEYS = ['country', 'xml_content'] as const;

export function normalizeEntity(data: EntityData): Record<string, string> {
  const normalized = Object.fromEntries(
    Object.entries(data).filter(([key]) => !REJECTED_KEYS.includes(key as any)),
  );

  if (normalized.country && typeof normalized.country === 'object') {
    normalized.country = (normalized.country as { name: string }).name;
  }
  if (normalized.settlement && typeof normalized.settlement === 'object') {
    normalized.settlement = (normalized.settlement as { name: string }).name;
  }

  return normalized as Record<string, string>;
}

const useEntityData = (clickedEntityNode: ClickedEntityNode) => {
  const [entityData, setEntityData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const loadEntity = async () => {
      if (clickedEntityNode.nodeTypeValue === null) {
        enqueueSnackbar('No entity selected.', { variant: 'error' });
      }

      try {
        const isLetter =
          clickedEntityNode.nodeType === 'fmbLetter' || clickedEntityNode.nodeType === 'gbLetter';

        const result = isLetter
          ? await fetchMetamwLetterData(clickedEntityNode.nodeTypeValue)
          : await fetchMetamwEntityData(clickedEntityNode.nodeTypeValue);

        setEntityData(normalizeEntity(result as EntityData));
      } catch (error) {
        enqueueSnackbar(`Could not load entity data: ${(error as Error).message}`, {
          variant: 'error',
        });
      }
    };

    void loadEntity();
  }, [clickedEntityNode.nodeType, clickedEntityNode.nodeTypeValue]);

  return entityData;
};

const EntityNodeInfo = () => {
  const clickedEntityNode = useSelector(
    (state: RootState) => state.editorLetter.letter.clickedEntityNode,
  );

  const entityData = useEntityData(clickedEntityNode);

  if (!entityData) return null; // statt <></>

  return <DynamicDataDisplay data={entityData} displayNameMap={DISPLAY_NAME_MAP} />;
};

export default EntityNodeInfo;
