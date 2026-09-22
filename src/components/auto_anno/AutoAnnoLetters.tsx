import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAutoAnnoLetter } from '@src/services/auto_anno/apiAutoAnno.service';
import { enqueueSnackbar } from 'notistack';
import XMLDisplayParser from '../editor/letter/Center/LetterViewContainer/XmlDisplayParser';
import { RootState } from '@src/redux/redux.store';
import { useSelector } from 'react-redux';
import AutoAnnoSnippetList from './AutoAnnoSnippetList';
import AutoAnnoLetterHandle from './AutoAnnoLetterHandle';
import {
  initializeLetterXmlExportSource,
  markSpanAndScrollToId,
} from '@src/utils/auto_anno/domHandling';
import {
  setAutoAnnoLetter,
  setSnippetEntityInfo,
} from '@src/redux/slices/auto.letter.snippet.slice';
import { useAutoAnnoLetterLock } from '@src/hooks/useAutoAnnoLetterLock';
import { Box, Typography } from '@mui/material';
import { useAppDispatch } from '@src/redux/hooks';
import { ComponentMappingItem } from '@src/services/mappings/editorMappings';
import SnippetReferencesList from './snippet_form/SnippetReferencesList';
import SnippetFormContainer from './snippet_form/SnippetFormContainer';
import SnippetEntityInfoDialog from './snippet_form/SnippetEntityInfoDialog';
import LetterFontSizeHandle from './misc/LetterFontSizeHandle';

const AutoAnnoLetters: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { job_id } = useParams<{ job_id: string }>();

  const dispatch = useAppDispatch();
  const autoAnnoLetterId = Number(id);
  const autoAnnoJobId = Number(job_id);
  const [selectedComponentList, setSelectedComponentList] = useState<ComponentMappingItem | null>(
    null,
  );
  const stateLetterFontSize = useSelector(
    (state: RootState) => state.auth.settings?.letterFontSize,
  );
  const user = useSelector((state: RootState) => state.auth.user);

  const reloadLetter = useSelector(
    (state: RootState) => state.autoLetterSnippet.letter?.reloadStatus ?? false,
  );
  const snippetReferences = useSelector(
    (state: RootState) => state.autoLetterSnippet.snippetReferences,
  );

  // useMemo ensures that componentMappingList is not recreated on every render.
  const componentMappingList = useMemo(
    () => ({
      SNIPPET_LIST: {
        name: 'SNIPPET_LIST',
        showContainer: true,
        component: <AutoAnnoSnippetList autoJobLetterId={autoAnnoLetterId} />,
        action: () => true,
      },
      REFERENCE_LIST: {
        name: 'REFERENCE_LIST',
        showContainer: true,
        component: (
          <SnippetReferencesList
            autoAnnoLetterId={autoAnnoLetterId}
            references={snippetReferences.items}
          />
        ),
        action: () => true,
      },
    }),
    [autoAnnoLetterId, snippetReferences.items],
  );

  const [refInfoDialogOpen, setRefInfoDialogOpen] = useState(false);
  const [refInfoDialogKey, setRefInfoDialogKey] = useState<string | null>(null);
  const stateEntityInfo = useSelector((state: RootState) => state.autoLetterSnippet.entityInfo);

  useEffect(() => {
    const handleStateEntityInfo = () => {
      if (stateEntityInfo && stateEntityInfo.key) {
        setRefInfoDialogKey(stateEntityInfo.key);
        setRefInfoDialogOpen(true);
      } else if (stateEntityInfo && stateEntityInfo.key === null) {
        setRefInfoDialogOpen(false);
      }
    };
    handleStateEntityInfo();
  }, [stateEntityInfo]);
  const handleInfoDialogClose = () => {
    dispatch(setSnippetEntityInfo({ key: null }));
  };
  /////////

  useAutoAnnoLetterLock({
    autoAnnoLetterId,
    autoAnnoJobId,
    userId: user?.id ?? null,
  });

  const [transformedData, setTransformedData] = useState<any>({
    xmlContent: null,
    letterName: null,
  });

  const sharedSnippet = useSelector((state: RootState) => state.autoLetterSnippet.snippet);

  useEffect(() => {
    const getData = async () => {
      if (autoAnnoLetterId && reloadLetter) {
        try {
          const result = await fetchAutoAnnoLetter(autoAnnoLetterId);

          if (result && result.xml_content_updated) {
            setTransformedData({
              xmlContent: result.xml_content_updated,
              letterName: result.letter_name,
            });
          } else if (result && result.xml_content) {
            setTransformedData({ xmlContent: result.xml_content, letterName: result.letter_name });
          } else {
            setTransformedData({
              xmlContent: null,
              letterName: result?.letter_name ? result.letter_name : null,
            });
          }

          dispatch(setAutoAnnoLetter({ letter: { id: autoAnnoLetterId, reloadStatus: false } }));
          setSelectedComponentList(componentMappingList['SNIPPET_LIST']);
        } catch (err) {
          enqueueSnackbar(err instanceof Error ? err.message : 'An unknown error occurred', {
            variant: 'error',
          });
        } finally {
          // setLoading(false);
        }
      }
    };

    getData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadLetter, dispatch]);

  useEffect(() => {
    const listKey = snippetReferences.showReferences ? 'REFERENCE_LIST' : 'SNIPPET_LIST';
    setSelectedComponentList(componentMappingList[listKey]);
  }, [snippetReferences.showReferences, componentMappingList]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && transformedData.xmlContent) {
      try {
        initializeLetterXmlExportSource(containerRef.current, transformedData.xmlContent);
      } catch (error) {
        enqueueSnackbar(error instanceof Error ? error.message : 'Invalid XML export source', {
          variant: 'error',
        });
      }
    }
  }, [transformedData.xmlContent]);

  useEffect(() => {
    const snippetScrollToId = () => {
      if (sharedSnippet) {
        markSpanAndScrollToId(sharedSnippet.xmlId);
      }
    };
    snippetScrollToId();
  }, [sharedSnippet]);

  return (
    <>
      <div>
        <Box>
          {transformedData?.letterName ? (
            <Typography variant="h3">{transformedData.letterName}</Typography>
          ) : (
            <Typography variant="h3">No data available</Typography>
          )}
        </Box>
      </div>
      <div className="container-fmbc-letter">
        <div className="box-1">
          {transformedData?.xmlContent ? (
            <div
              className="letter-xml"
              id="letterXml"
              ref={containerRef}
              style={{ fontSize: `${stateLetterFontSize}%` }}
            >
              <XMLDisplayParser xmlContentRef={null} xmlString={transformedData.xmlContent} />;
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
        <div className="box-2">
          <div className="sub-box">
            <div className="sub-box-element sub-box-top">
              <SnippetFormContainer autoAnnoLetterId={autoAnnoLetterId} />
            </div>
            <div className="sub-box-element sub-box-center" style={{ marginTop: '2%' }}>
              {selectedComponentList?.component}
            </div>
            <div className="sub-box-element sub-box-bottom">
              <AutoAnnoLetterHandle autoJobId={autoAnnoJobId} autoJobLetterId={autoAnnoLetterId} />
            </div>
          </div>
        </div>
      </div>
      <SnippetEntityInfoDialog
        open={refInfoDialogOpen}
        referenceKey={refInfoDialogKey}
        handleClose={handleInfoDialogClose}
      />
      <LetterFontSizeHandle />
    </>
  );
};

export default AutoAnnoLetters;
