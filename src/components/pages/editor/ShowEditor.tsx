import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Box, List, ListItemButton, ListItemIcon } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SearchContainer from "../../editor/letter/Left/Search/SearchContainer";
import FavouritesContainer from "../../editor/letter/Left/Favourites/FavouritesContainer";
import AssignedContainer from "../../editor/letter/Right/Assigned/AssignedContainer";
import { ComponentMappingItem } from "../../../services/mappings/editorMappings";
import { handleFavouriteClick } from "../../editor/letter/Right/Favourite/LetterFavouriteHandling";
import LetterViewContainer from "../../editor/letter/Center/LetterViewContainer";
import { letterExists } from "../../../services/editor/apiLetterRequest.service";
import LetterTabs from "../../editor/letter/Center/LetterTabs";
import {
  setEditorLetter,
  setEditorPinnedLetters,
  setEditorSelectedItem, setReloadLetterContent
} from "../../../redux/slices/editor.letter.slice";
import { fetchPinnedLetters } from "../../../services/editor/apiPinnedLettersRequest.service";
import { useAppDispatch } from "../../../redux/hooks";
import { EditorConstants } from "../../../constants/editor";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import EntityPersonContainer from "../../editor/letter/Right/EntityPerson/EntityPersonContainer";
import EntityCreationContainer from "../../editor/letter/Right/EntityCreation/EntityCreationContainer";
import EntityPlaceContainer from "../../editor/letter/Right/EntityPlace/EntityPlaceContainer";
import EntityFmbcCreationContainer from "../../editor/letter/Right/EntityFmbcCreation/EntityFmbcCreationContainer";
import EntityLetterContainer from "../../editor/letter/Right/EntityLetter/EntityLetterContainer";
import EditorFormDialog from "../../editor/letter/Dialog/EditorFormDialog";


const ShowEditor = () => {
  let { letterId } = useParams<{ letterId: string }>();
  let { letterName } = useParams<{ letterName: string }>();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showLeftContainer, setShowLeftContainer] = useState<boolean>(false)
  const [showRightContainer, setShowRightContainer] = useState<boolean>(false)
  const selectedItem = useSelector((state: RootState) => state.editorLetter.selectedItem);
  const [selectedItemLeft, setSelectedItemLeft] = useState<false|string>(false)
  const [selectedItemRight, setSelectedItemRight] = useState<false|string>(false)
  const [selectedComponentLeft, setSelectedComponentLeft] = useState<ComponentMappingItem| null>(null)
  const [selectedComponentRight, setSelectedComponentRight] = useState<ComponentMappingItem | null>(null)

  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {

      fetchPinnedLetters().then((pinnedLetters) => {
        if (letterId && letterName) {
          pinnedLetters.unshift({ id: parseInt(letterId), name: letterName, contentChanged: false, isPinned: false })
        }

        dispatch(
          setEditorPinnedLetters({ pinnedLetters })
        );
      })

      if (letterId !== undefined && letterId !== null && !isNaN(parseInt(letterId))) {
        dispatch(setEditorLetter({ letter: { id: parseInt(letterId), name: letterName } }))
      }

      isMounted.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const validateLetterId = async () => {
      if (letterId === undefined) { return }

      if (letterId && isNaN(Number(letterId))) {
        navigate('/not-found', { state: { messageKey: 'missingLetterId' } }); // Redirect if `letterId` is missing
        return;
      }

      try {
        const isValid = await letterExists(letterId);

        if (!isValid) {
          navigate('/not-found', { state: { messageKey: 'invalidLetterId' } }); // Redirect if `letterId` is invalid
        }
      } catch (error) {
        navigate('/error'); // Redirect to an error page if the validation fails
      }
    };

    validateLetterId();
  }, [letterId, navigate]);

  useEffect(() => {
    const handleSelectedItem = () => {
      if (selectedItem.left !== null) {
        handleTabChangeLeft(selectedItem.left)
      } else {
        setShowLeftContainer(false)
      }

      if (selectedItem.right !== null) {
        handleTabChangeRight(selectedItem.right)
      } else {
        setShowRightContainer(false)
      }
    }

    if (selectedItem !== null) {
      handleSelectedItem();
    }

  }, [selectedItem]);


  const handleTabChangeLeft= (newValue: string) => {
    const selectedComponent = componentMappingLeft[newValue];

    if (showLeftContainer === undefined && selectedComponent?.showContainer) {
      setShowLeftContainer(true)
    } else if (showLeftContainer && selectedComponent?.showContainer) {
      setShowLeftContainer(false)

    } else if (!showLeftContainer && selectedComponent?.showContainer) {
      setShowLeftContainer(true)
    }

    selectedComponent?.action();
    setSelectedComponentLeft(selectedComponent)
    setSelectedItemLeft(newValue)
  };

  const handleTabChangeRight = (newValue: string) => {
    const selectedComponent = componentMappingRight[newValue]

    if (showRightContainer === undefined && selectedComponent?.showContainer) {
      setShowRightContainer(true)
    } else if (showRightContainer && selectedComponent?.showContainer) {
      setShowRightContainer(false)

    } else if (!showRightContainer && selectedComponent?.showContainer) {
      setShowRightContainer(true)
    }

    selectedComponent?.action();
    setSelectedComponentRight(selectedComponent)
    setSelectedItemRight(newValue)
  };

  const componentMappingLeft: Record<string, ComponentMappingItem> = {
    [EditorConstants.compMappingLeft.SEARCH]: { showContainer: true, component: <SearchContainer />, action: () => true },
    [EditorConstants.compMappingLeft.FAVOURITES]: { showContainer: true, component: <FavouritesContainer />, action: () => true },
  }

  const componentMappingRight: Record<string, ComponentMappingItem> = {
    [EditorConstants.compMappingRight.ASSIGNED]: { showContainer: true , component: <AssignedContainer />, action: () => true },
    [EditorConstants.compMappingRight.SET_FAVOURITE]: { showContainer: false, action: () => handleFavouriteClick(letterId, true) }, // Example with a function
    [EditorConstants.compMappingRight.ENT_PERSON]: { showContainer: true , component: <EntityPersonContainer/>, action: () => true },
    [EditorConstants.compMappingRight.ENT_PLACE]: { showContainer: true , component: <EntityPlaceContainer/>, action: () => true },
    [EditorConstants.compMappingRight.ENT_CREATION]: { showContainer: true , component: <EntityCreationContainer/>, action: () => true },
    [EditorConstants.compMappingRight.ENT_FMBC_CREATION]: { showContainer: true , component: <EntityFmbcCreationContainer/>, action: () => true },
    [EditorConstants.compMappingRight.ENT_LETTER]: { showContainer: true , component: <EntityLetterContainer/>, action: () => true },
    [EditorConstants.compMappingRight.ENT_NOTE]: { showContainer: true , component: <EditorFormDialog open={true} dialogType={EditorConstants.compMappingRight.ENT_NOTE}/>, action: () => true },
  };

  const setSelectedItem = (newValueLeft: string| null, newValueRight: string| null) => {
      dispatch(setEditorSelectedItem({ selectedItem: { left: newValueLeft, right: newValueRight } }))
  }


  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100vh",
        backgroundColor: "#f0f0f0",
      }}
    >
      <Box
        sx={{
          width: "5%",
          backgroundColor: "#ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <List component="nav" aria-label="handle edit labels">
          <ListItemButton
            selected={!(selectedItemLeft === false || selectedItemLeft !== EditorConstants.compMappingLeft.SEARCH) }
            onClick={() => setSelectedItem(EditorConstants.compMappingLeft.SEARCH, null)}
          >
            <ListItemIcon>
              <SearchIcon/>
            </ListItemIcon>
          </ListItemButton>
          <ListItemButton
            selected={!(selectedItemLeft === false || selectedItemLeft !== EditorConstants.compMappingLeft.FAVOURITES) }
            onClick={() => setSelectedItem(EditorConstants.compMappingLeft.FAVOURITES, null)}
          >
            <ListItemIcon>
              <HomeIcon/>
            </ListItemIcon>
          </ListItemButton>
        </List>
      </Box>

      {showLeftContainer && (
        <Box
          sx={{
            width: "20%",
            backgroundColor: "#cce5ff",
            transition: "width 0.3s",
          }}
        >
          {selectedComponentLeft?.component}
        </Box>
      )}

      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "#ffffff",
          transition: "width 0.3s",
          width: showLeftContainer && showRightContainer ? "60%" : showLeftContainer || showRightContainer ? "80%" : "90%",
        }}
      >
        <>
          <LetterTabs />
          <LetterViewContainer />
        </>
      </Box>

      {showRightContainer && (
        <Box
          sx={{
            width: "20%",
            backgroundColor: "#cce5ff",
            transition: "width 0.3s",
          }}
        >

          {selectedComponentRight?.component}
         </Box>
      )}

      <Box
        sx={{
          width: "5%",
          backgroundColor: "#ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        // onClick={() => setShowRightContainer(!showRightContainer)}
      >
        <List component="nav" aria-label="handle edit labels">
          <ListItemButton
            selected={!(selectedItemRight === false || selectedItemRight !== EditorConstants.compMappingRight.ASSIGNED) }
            onClick={() => setSelectedItem(null, EditorConstants.compMappingRight.ASSIGNED)}
          >
            <ListItemIcon>
              <SearchIcon/>
            </ListItemIcon>
          </ListItemButton>
          <ListItemButton
            selected={!(selectedItemRight === false || selectedItemRight !== EditorConstants.compMappingRight.SET_FAVOURITE) }
            onClick={() => setSelectedItem(null, EditorConstants.compMappingRight.SET_FAVOURITE)}
          >
            <ListItemIcon>
              <HomeIcon/>
            </ListItemIcon>
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );
};

export default ShowEditor;
