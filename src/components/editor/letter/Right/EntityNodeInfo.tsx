import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import React, { useEffect, useState } from 'react';
import { fetchMetamwEntityData, fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';
import DynamicDataDisplay from '@src/components/support/DynamicDataDisplay';
import type { ClickedEntityNode } from '@src/redux/slices/editor.letter.slice';
import { DISPLAY_NAME_MAP } from '@src/utils/entityMappings';
import { enqueueSnackbar } from 'notistack';

type EntityData = Record<string, unknown>;

const REJECTED_KEYS = new Set(['country', 'xml_content']);

export function normalizeEntity(data: EntityData): Record<string, unknown> {
  const normalized = Object.fromEntries(Object.entries(data).filter(([key]) => !REJECTED_KEYS.has(key)));

  if (
    normalized.settlement &&
    typeof normalized.settlement === 'object' &&
    'name' in normalized.settlement &&
    typeof normalized.settlement.name === 'string'
  ) {
    normalized.settlement = normalized.settlement.name;
  }

  return normalized;
}

const useEntityData = (clickedEntityNode: ClickedEntityNode) => {
  const [entityData, setEntityData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const loadEntity = async () => {
      if (clickedEntityNode.nodeTypeValue === null) {
        enqueueSnackbar('No entity selected.', { variant: 'error' });
      }

      try {
        const isLetter = clickedEntityNode.nodeType === 'fmbLetter' || clickedEntityNode.nodeType === 'gbLetter';

        const result = isLetter
          ? await fetchMetamwLetterData(clickedEntityNode.nodeTypeValue)
          : await fetchMetamwEntityData(clickedEntityNode.nodeTypeValue);

        setEntityData(result === null ? null : normalizeEntity(result));
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
  const clickedEntityNode = useSelector((state: RootState) => state.editorLetter.letter.clickedEntityNode);

  const entityData = useEntityData(clickedEntityNode);

  if (!entityData) return null; // statt <></>

  return <DynamicDataDisplay data={entityData} displayNameMap={DISPLAY_NAME_MAP} />;
};

export default EntityNodeInfo;
