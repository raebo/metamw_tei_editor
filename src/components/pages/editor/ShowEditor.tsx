import { useNavigate, useParams } from 'react-router-dom';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined';
import SearchContainer from '@src/components/editor/letter/Left/Search/SearchContainer';
import FavouritesContainer from '@src/components/editor/letter/Left/Favourites/FavouritesContainer';
import AssignedContainer from '@src/components/editor/letter/Right/Assigned/AssignedContainer';
import { ComponentMappingItem, type PinnedLetter } from '@src/services/mappings/editorMappings';
import { handleFavouriteClick } from '@src/components/editor/letter/Right/Favourite/LetterFavouriteHandling';

const LetterViewContainer = React.lazy(() =>
  import('@src/components/editor/letter/Center/LetterViewContainer').catch((_err) => {
    window.location.reload(); // oder Redirect zur Startseite
    return new Promise(() => {});
  }),
);
import { letterExists } from '@src/services/editor/apiLetterRequest.service';
import LetterTabs from '@src/components/editor/letter/Center/LetterTabs';
import {
  setDialogType,
  setEditorLetter,
  setEditorPinnedLetters,
  setEditorSelectedItem,
} from '@src/redux/slices/editor.letter.slice';
import { fetchPinnedLetters } from '@src/services/editor/apiPinnedLettersRequest.service';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import EntityCreationContainer from '@src/components/editor/letter/Right/EntityCreation/EntityCreationContainer';
import EntityPlaceContainer from '@src/components/editor/letter/Right/EntityPlace/EntityPlaceContainer';
import EntityLetterContainer from '@src/components/editor/letter/Right/EntityLetter/EntityLetterContainer';
import EditorFormDialog from '@src/components/editor/letter/Dialog/EditorFormDialog';
import useNoteClickHandler from '@src/components/editor/letter/Center/hooks/useNoteClickHandler';
import {
  setEditorDialogAndReferenceThunk,
  setEditorPinnedLettersViewModeThunk,
} from '@src/redux/thunks/editor.letter.thunk';
import { enqueueSnackbar } from 'notistack';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import UserActionMenu from '@src/components/editor/letter/Right/UserActionMenu';
import EditorKeyHandle from '@src/components/editor/letter/Center/EditorKeyHandle';
import QuickContentFormatter from '@src/components/editor/letter/Right/QuickContentFormatter';
import LetterFontSizeHandle from '../../auto_anno/misc/LetterFontSizeHandle';
import EntityProtagCreationContainer from '@src/components/editor/letter/Right/EntityProtagCreation/EntityProtagCreationContainer';
import { EditorConstants } from '@src/constants/editor';
import EntityPersonContainer from '@src/components/editor/letter/Right/EntityPerson/EntityPersonContainer';
import { MiscUtils } from '@src/utils/misc';
import { ToolbarMenuButton } from '@src/components/editor/letter/Util/ToolbarMenuButton';
import HelpShortcutsContainer from '@src/components/editor/letter/Left/HelpShortcuts/HelpShortcutsContainer';
import EntityNodeInfo from '@src/components/editor/letter/Right/EntityNodeInfo';
import OnlyReadEditorPanel from '@src/components/editor/letter/Left/OnlyReadEditorPanel';
import { ToolbarLetterNameDisplay } from '@src/components/editor/letter/Util/ToolbarLetterNameDisplay';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';

export interface EditorContainerProps {
  xmlRef: React.RefObject<HTMLDivElement>;
}

const LEFT_EDITOR_MIN_WIDTH = 15;
const LEFT_EDITOR_MAX_WIDTH = 60;
const LEFT_EDITOR_DEFAULT_WIDTH = 30;

const componentMappingLeft: Record<string, ComponentMappingItem> = {
  [EditorConstants.compMappingLeft.SEARCH]: {
    name: EditorConstants.compMappingLeft.SEARCH,
    showContainer: true,
    component: <SearchContainer />,
    action: () => true,
  },
  [EditorConstants.compMappingLeft.FAVOURITES]: {
    name: EditorConstants.compMappingLeft.FAVOURITES,
    showContainer: true,
    component: <FavouritesContainer />,
    action: () => true,
  },
  [EditorConstants.compMappingLeft.HELP_SHORTCUTS]: {
    name: EditorConstants.compMappingLeft.HELP_SHORTCUTS,
    showContainer: true,
    component: <HelpShortcutsContainer />,
    action: () => true,
  },
  [EditorConstants.compMappingLeft.READONLY_VIEW]: {
    name: EditorConstants.compMappingLeft.HELP_SHORTCUTS,
    showContainer: true,
    component: <OnlyReadEditorPanel />,
    action: () => true,
  },
};

interface MappingDependencies {
  letterId: string | undefined;
  setModalDialog: (type: string) => void;
  handleFavouriteClick: (id: string, value: boolean) => void;
  xmlRefCenter: React.RefObject<HTMLDivElement>;
}

const createComponentMappingRight = (
  deps: MappingDependencies,
): Record<string, ComponentMappingItem> => ({
  [EditorConstants.compMappingRight.ASSIGNED]: {
    name: EditorConstants.compMappingRight.ASSIGNED,
    showContainer: true,
    component: <AssignedContainer />,
    action: () => true,
  },
  [EditorConstants.compMappingRight.SET_FAVOURITE]: {
    name: EditorConstants.compMappingRight.SET_FAVOURITE,
    showContainer: false,
    action: () => handleFavouriteClick(deps.letterId, true),
  }, // Example with a function
  [EditorConstants.compMappingRight.PUBLISH_LETTER]: {
    name: EditorConstants.compMappingRight.PUBLISH_LETTER,
    showContainer: false,
    component: null,
    action: () => deps.setModalDialog(EditorConstants.dialogTypes.PUBLISH_LETTER),
  },
  [EditorConstants.compMappingRight.ENT_PERSON]: {
    name: EditorConstants.compMappingRight.ENT_PERSON,
    showContainer: true,
    component: <EntityPersonContainer xmlRef={deps.xmlRefCenter} />,
    action: () => true,
  },
  [EditorConstants.compMappingRight.ENT_PLACE]: {
    name: EditorConstants.compMappingRight.ENT_PLACE,
    showContainer: true,
    component: <EntityPlaceContainer xmlRef={deps.xmlRefCenter} />,
    action: () => true,
  },
  [EditorConstants.compMappingRight.ENT_CREATION]: {
    name: EditorConstants.compMappingRight.ENT_CREATION,
    showContainer: true,
    component: <EntityCreationContainer xmlRef={deps.xmlRefCenter} />,
    action: () => true,
  },
  [EditorConstants.compMappingRight.ENT_FMBC_CREATION]: {
    name: EditorConstants.compMappingRight.ENT_FMBC_CREATION,
    showContainer: true,
    component: <EntityProtagCreationContainer xmlRef={deps.xmlRefCenter} />,
    action: () => true,
  },
  [EditorConstants.compMappingRight.ENT_LETTER]: {
    name: EditorConstants.compMappingRight.ENT_LETTER,
    showContainer: true,
    component: <EntityLetterContainer />,
    action: () => true,
  },
  [EditorConstants.compMappingRight.ENT_NODE_INFO]: {
    name: EditorConstants.compMappingRight.ENT_NODE_INFO,
    showContainer: true,
    component: <EntityNodeInfo />,
    action: () => true,
  },
  [EditorConstants.dialogTypes.RESET_LETTER]: {
    name: EditorConstants.dialogTypes.RESET_LETTER,
    showContainer: false,
    component: null,
    action: () => deps.setModalDialog(EditorConstants.dialogTypes.RESET_LETTER),
  },
});

const ShowEditor = () => {
  const { t } = useTranslation();
  const { letterId } = useParams<{ letterId: string }>();
  const { letterName } = useParams<{ letterName: string }>();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isMounted = useRef(false);
  const xmlRefCenter = useRef<HTMLDivElement>(null);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const selectedItem = useSelector((state: RootState) => state.editorLetter.selectedItem);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showLeftContainer, setShowLeftContainer] = useState<boolean>(false);
  const [showRightContainer, setShowRightContainer] = useState<boolean>(false);

  const [selectedItemRight, setSelectedItemRight] = useState<false | string>(false);
  const [selectedComponentLeft, setSelectedComponentLeft] = useState<ComponentMappingItem | null>(
    null,
  );
  const [selectedComponentRight, setSelectedComponentRight] = useState<ComponentMappingItem | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isCodeView, setIsCodeView] = useState<boolean>(false);

  const [leftEditorWidth, setLeftEditorWidth] = useState(LEFT_EDITOR_DEFAULT_WIDTH);

  useEffect(() => {
    if (isMounted.current) return;

    const setPinnedLetters = async () => {
      let pinnedLetters: PinnedLetter[] = [];
      if (letterId && letterName) {
        pinnedLetters = await fetchPinnedLetters();
        pinnedLetters.unshift({
          id: parseInt(letterId),
          name: letterName,
          contentChanged: false,
          isPinned: false,
          viewMode: 'WYSIWYG',
        });
      }
      dispatch(setEditorPinnedLetters({ pinnedLetters }));

      if (letterId !== undefined && letterId !== null && !isNaN(parseInt(letterId))) {
        dispatch(
          setEditorLetter({
            letter: { id: parseInt(letterId), name: letterName, viewMode: 'WYSIWYG' },
          }),
        );
      }
    };

    const initialize = async () => {
      try {
        await setPinnedLetters(); // ✅ wird jetzt korrekt awaited
        isMounted.current = true;
      } catch (error) {
        enqueueSnackbar(
          t('errors:editor.failedToFetchPinnedLetter', {
            reason: MiscUtils.misc.getErrorMessage(error),
          }),
          { variant: 'error' },
        );
      }
    };

    void initialize();
  }, [dispatch, letterId, letterName, t]);

  useEffect(() => {
    if (stateEditorLetter.id !== undefined && stateEditorLetter.id !== null) {
      setIsCodeView(stateEditorLetter.viewMode === 'CODE');
    }
  }, [stateEditorLetter.id, dispatch, stateEditorLetter.viewMode]);

  const handleToggleCodeview = () => {
    if (stateEditorLetter.id === null) {
      return;
    }
    setIsCodeView((prev) => {
      const nextViewMode = !prev ? 'CODE' : 'WYSIWYG';
      dispatch(
        setEditorPinnedLettersViewModeThunk({
          stateEditorLetter,
          viewMode: nextViewMode,
        }),
      );
      return !prev;
    });
    setIsCodeView(!isCodeView);
    dispatch(
      setEditorPinnedLettersViewModeThunk({
        stateEditorLetter: stateEditorLetter,
        viewMode: isCodeView ? 'WYSIWYG' : 'CODE',
      }),
    );
  };

  useEffect(() => {
    const validateLetterId = async () => {
      if (letterId === undefined) return;

      if (isNaN(Number(letterId))) {
        navigate('/not-found', { state: { messageKey: 'missingLetterId' } });
        return;
      }

      try {
        await letterExists(letterId);
      } catch {
        navigate('/not-found', { state: { messageKey: 'invalidLetterId' } });
      }
    };

    void validateLetterId();
  }, [letterId, navigate]);

  useEffect(() => {
    const handleSelectedItem = () => {
      if (selectedItem.left !== null) {
        handleTabChangeLeft(selectedItem.left);
      } else {
        setSelectedComponentLeft(null);
        setShowLeftContainer(false);
      }

      if (selectedItem.right !== null) {
        handleTabChangeRight(selectedItem.right);
      } else {
        setShowRightContainer(false);
        setSelectedComponentRight(null);
      }
    };

    if (selectedItem !== null) {
      handleSelectedItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  const handleTabChangeLeft = (newValue: string) => {
    const selectedComponent = componentMappingLeft[newValue];

    if (showLeftContainer === undefined && selectedComponent?.showContainer) {
      setShowLeftContainer(true);
    } else if (showLeftContainer && selectedComponent?.showContainer) {
      setShowLeftContainer(false);
    } else if (!showLeftContainer && selectedComponent?.showContainer) {
      setShowLeftContainer(true);
    }

    selectedComponent?.action();
    setSelectedComponentLeft(selectedComponent);
  };

  const handleTabChangeRight = (newValue: string) => {
    const selectedComponent = componentMappingRight[newValue];

    if (showRightContainer === undefined && selectedComponent?.showContainer) {
      setShowRightContainer(true);
    } else if (showRightContainer && selectedComponent?.showContainer) {
      setShowRightContainer(true);
    } else if (!showRightContainer && selectedComponent?.showContainer) {
      setShowRightContainer(true);
    } else if (!showRightContainer && !selectedComponent?.showContainer) {
      setShowRightContainer(false);
    }

    selectedComponent?.action();
    setSelectedComponentRight(selectedComponent);
    setSelectedItemRight(newValue);
  };

  const setModalDialog = (dialogType: string) => {
    dispatch(setDialogType({ dialogType: dialogType }));
  };

  const valueForSide = (
    newValue: string | null,
    selectedComponent: { name: string } | null,
  ): string | null => {
    if (newValue === null || (selectedComponent !== null && selectedComponent.name === newValue)) {
      return null;
    }
    return newValue;
  };

  const setSelectedItem = (newValueLeft: string | null, newValueRight: string | null) => {
    dispatch(
      setEditorSelectedItem({
        selectedItem: {
          left: valueForSide(newValueLeft, selectedComponentLeft),
          right: valueForSide(newValueRight, selectedComponentRight),
        },
      }),
    );
  };

  const handleButtonMenuClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const userActionMenuHandleClose = () => {
    setAnchorEl(null);
  };

  useNoteClickHandler((noteElement) => {
    const xmlId = noteElement.getAttribute('xml:id');

    if (xmlId) {
      dispatch(
        setEditorDialogAndReferenceThunk({
          dialogType: EditorConstants.dialogTypes.EDIT_NOTE,
          elementType: 'note',
          elementXmlId: xmlId,
          elementKey: null,
        }),
      );
    } else {
      enqueueSnackbar('Kommentar kann nicht aktualisiert werden', { variant: 'error' });
    }
  });

  const handleSplitterMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const startX = e.clientX;
      const startWidth = leftEditorWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaVw = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
        const newWidth = Math.min(
          Math.max(startWidth + deltaVw, LEFT_EDITOR_MIN_WIDTH),
          LEFT_EDITOR_MAX_WIDTH,
        );
        setLeftEditorWidth(newWidth);
      };

      const onMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [leftEditorWidth],
  );

  const componentMappingRight = useMemo(
    () =>
      createComponentMappingRight({
        letterId,
        xmlRefCenter,
        setModalDialog,
        handleFavouriteClick,
      }),
    [letterId, xmlRefCenter, setModalDialog],
  );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: '100vh',
          backgroundColor: '#f0f0f0',
        }}
      >
        <Box
          sx={{
            width: '5%',
            backgroundColor: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack direction="column" spacing={1}>
            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarLeft.search')}
              selected={selectedItemRight === EditorConstants.compMappingLeft.SEARCH}
              onClick={() => setSelectedItem(EditorConstants.compMappingLeft.SEARCH, null)}
              icon={<SearchIcon />}
            />
            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarLeft.favourites')}
              selected={selectedItemRight === EditorConstants.compMappingLeft.FAVOURITES}
              onClick={() => setSelectedItem(EditorConstants.compMappingLeft.FAVOURITES, null)}
              icon={<AutoAwesomeIcon />}
            />
            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarLeft.keybindings')}
              selected={selectedItemRight === EditorConstants.compMappingLeft.HELP_SHORTCUTS}
              onClick={() => setSelectedItem(EditorConstants.compMappingLeft.HELP_SHORTCUTS, null)}
              icon={<KeyboardOutlinedIcon />}
            />
            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarLeft.readonlyView')}
              selected={selectedItemRight === EditorConstants.compMappingLeft.READONLY_VIEW}
              onClick={() => setSelectedItem(EditorConstants.compMappingLeft.READONLY_VIEW, null)}
              icon={<SplitscreenIcon />}
            />
          </Stack>
        </Box>

        {showLeftContainer && (
          <>
            <Box
              ref={containerRef}
              sx={{
                display: 'flex',
                width: `${leftEditorWidth}vw`,
                minWidth: `${LEFT_EDITOR_MIN_WIDTH}vw`,
                maxWidth: `${LEFT_EDITOR_MAX_WIDTH}vw`,
                flexShrink: 0,
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100vh',
                backgroundColor: '#f0f0f0',
                // userSelect: isDraggingState ? 'none' : 'auto',
                // cursor: isDraggingState ? 'col-resize' : 'auto',
              }}
            >
              {selectedComponentLeft?.component}
            </Box>
            <Box
              onMouseDown={handleSplitterMouseDown}
              sx={{
                width: '5px',
                flexShrink: 0,
                backgroundColor: '#aaa',
                cursor: 'col-resize',
                '&:hover': { backgroundColor: '#555' },
              }}
            />
          </>
        )}

        <Box
          sx={{
            flexGrow: 1,
            maxWidth: '60vw',
            backgroundColor: '#ffffff',
            transition: 'width 0.3s',
            width:
              showLeftContainer && showRightContainer
                ? '60%'
                : showLeftContainer || showRightContainer
                  ? '80%'
                  : '90%',
          }}
        >
          <div ref={xmlRefCenter}>
            <LetterTabs />
            <LetterViewContainer />
          </div>
        </Box>

        {showRightContainer && (
          <Box
            sx={{
              width: '20%',
              backgroundColor: '#cce5ff',
              paddingLeft: '10px',
              paddingRight: '10px',
              transition: 'width 0.3s',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setShowRightContainer(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {selectedComponentRight?.component}
          </Box>
        )}

        <Box
          sx={{
            width: '5%',
            backgroundColor: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack direction="column" spacing={1}>
            <ToolbarLetterNameDisplay letterName={stateEditorLetter.name} />
            <QuickContentFormatter />
            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarRight.moreActions')}
              selected={selectedItemRight === EditorConstants.compMappingRight.USER_ACTIONS}
              onClick={(event) => handleButtonMenuClick(event)}
              icon={<MoreHorizIcon />}
            />
            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarRight.withoutFunction')}
              selected={selectedItemRight === EditorConstants.compMappingRight.ASSIGNED}
              onClick={() => setSelectedItem(null, EditorConstants.compMappingRight.ASSIGNED)}
              icon={<AssignmentIcon />}
            />

            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarRight.addLetterToFavourite')}
              selected={selectedItemRight === EditorConstants.compMappingRight.SET_FAVOURITE}
              onClick={() => setSelectedItem(null, EditorConstants.compMappingRight.SET_FAVOURITE)}
              icon={<StarOutlineIcon />}
            />

            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarRight.addLetterToFavourite')}
              selected={selectedItemRight === EditorConstants.compMappingRight.PUBLISH_LETTER}
              onClick={() => setSelectedItem(null, EditorConstants.compMappingRight.PUBLISH_LETTER)}
              icon={<CloudUploadOutlinedIcon />}
            />

            <ToolbarMenuButton
              title={
                isCodeView
                  ? t('editor:common.letterViewContainer.toolbarRight.switchWYSIWYG')
                  : t('editor:common.letterViewContainer.toolbarRight.switchXML')
              }
              selected={isCodeView}
              onClick={handleToggleCodeview}
              icon={<CodeIcon color={isCodeView ? 'primary' : 'action'} />}
            />

            <ToolbarMenuButton
              title={t('editor:common.letterViewContainer.toolbarRight.resetLetter')}
              selected={stateEditorLetter.undoAvailable || stateEditorLetter.redoAvailable}
              onClick={() => setSelectedItem(null, EditorConstants.dialogTypes.RESET_LETTER)}
              icon={<RestartAltIcon />}
            />
          </Stack>
        </Box>
      </Box>
      <EditorFormDialog xmlRef={xmlRefCenter} open={false} />i
      <UserActionMenu
        anchorEl={anchorEl}
        open={anchorEl !== null}
        handleClose={userActionMenuHandleClose}
      />
      <EditorKeyHandle />
      <LetterFontSizeHandle />
    </>
  );
};

export default ShowEditor;
