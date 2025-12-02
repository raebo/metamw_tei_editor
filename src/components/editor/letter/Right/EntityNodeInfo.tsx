import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import React, { useEffect } from 'react';
import { fetchMetamwEntityData } from '@src/services/auto_anno/apiMetaMw.service';
import DynamicDataDisplay from '@src/components/support/DynamicDataDisplay';
import { DISPLAY_NAME_MAP } from '@src/utils/entityMappings';
import { enqueueSnackbar } from 'notistack';

function normalizeEntity(data: any) {
  const rejectedKeys = ['country']; // add more here

  const normalized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (rejectedKeys.includes(key)) continue; // skip key
    normalized[key] = value;
  }

  if (normalized.country && typeof normalized.country === 'object') {
    normalized.country = normalized.country.name;
  }

  if (normalized.settlement && typeof normalized.settlement === 'object') {
    normalized.settlement = normalized.settlement.name;
  }

  return normalized;
}

const EntityNodeInfo = () => {
  const clickedEntityNode = useSelector(
    (state: RootState) => state.editorLetter.letter.clickedEntityNode,
  );

  const [entityData, setEntityData] = React.useState<{ [key: string]: string } | null>(null);

  useEffect(() => {
    const loadEntity = async () => {
      if (!clickedEntityNode.nodeTypeValue) return;

      try {
        const result = await fetchMetamwEntityData(clickedEntityNode.nodeTypeValue);
        const normalized = normalizeEntity(result);
        setEntityData(normalized);
      } catch (error) {
        enqueueSnackbar(`Could not load entity data ${(error as Error).message}`, {
          variant: 'error',
        });
      }
    };

    void loadEntity();
  }, [clickedEntityNode.nodeTypeValue]);

  return (
    <>
      {entityData !== null ? (
        <DynamicDataDisplay data={entityData} displayNameMap={DISPLAY_NAME_MAP} />
      ) : (
        <></>
      )}
    </>
  );
};

export default EntityNodeInfo;
