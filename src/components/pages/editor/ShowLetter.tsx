import { useNavigate, useParams } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { Box, List, ListItemButton, ListItemIcon, Tab, Tabs } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import SearchContainer from "../../editor/letter/LeftSearch/SearchContainer";
import FavouritesContainer from "../../editor/letter/LeftFavourites/FavouritesContainer";
import AssignedContainer from "../../editor/letter/RightAssigned/AssignedContainer";
import FavouriteContainer from "../../editor/letter/RightFavourite/FavouriteContainer";
import { ComponentMappingItem } from "../../../services/mappings/editorMappings";
import { handleFavouriteClick } from "../../editor/letter/RightFavourite/LetterFavouriteHandling";
import LetterViewContainer from "../../editor/letter/Center/LetterViewContainer";
import { letterExists } from "../../../services/editor/apiLetterRequest.service";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/redux.store";
import LetterTabs from "../../editor/letter/Center/LetterTabs";
import { setEditorTabNumber } from "../../../redux/slices/editor.letter.slice";


const ShowLetter = () => {
  let { letterId } = useParams<{ letterId: string }>();
  let { letterName } = useParams<{ letterName: string }>();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stateLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const stateTabLetter = useSelector((state: RootState) => state.editorLetter.tabLetter)
  const [contentLetterId, setContentLetterId] = useState<number | null>(null)
  const stateActiveTab = useSelector((state: RootState) => state.editorLetter.tabNumber)
  const [showLeftContainer, setShowLeftContainer] = useState<boolean>(false)
  const [showRightContainer, setShowRightContainer] = useState<boolean>(false)
  const [selectedItemLeft, setSelectedItemLeft] = useState<false|string>(false)
  const [selectedItemRight, setSelectedItemRight] = useState<false|string>(false)
  const [selectedComponentLeft, setSelectedComponentLeft] = useState<ComponentMappingItem| null>(null)
  const [selectedComponentRight, setSelectedComponentRight] = useState<ComponentMappingItem | null>(null)
  const [letterChanged, setLetterChanged] = useState<boolean>(false)

  useEffect(() => {
    const setContentLetter = () => {
      if (stateTabLetter === null && letterId && letterName) {
        setContentLetterId(parseInt(letterId))
      } else if (stateTabLetter !== null) {
        setContentLetterId(stateTabLetter.id)
      }
    }
    setContentLetter()
  }, [])

  useEffect(() => {
    const setContentLetter = () => {
      if (stateTabLetter && stateTabLetter.id && stateTabLetter.name) {
        setContentLetterId(stateTabLetter.id)
      }
    }

    setContentLetter()
  }, [stateTabLetter]);

  useEffect(() => {
    if (stateLetter && stateLetter.id && stateLetter.name) {
      letterId = stateLetter.id.toString()
      letterName = stateLetter.name.toString()
      dispatch(setEditorTabNumber({ tabNumber: 0 }))
      setLetterChanged(true)
      navigate(`/editor/letters/${stateLetter.id}/${stateLetter.name}`, { replace: true });
    }
  }, [stateLetter]);

  console.log("stateActiveTab: ", stateActiveTab);


  useEffect(() => {
    if (letterChanged) {
      const timeout = setTimeout(() => setLetterChanged(false), 0)
      return () => clearTimeout(timeout)
    }
  }, [letterChanged]);

  useEffect(() => {
    const validateLetterId = async () => {
      if (!letterId || isNaN(Number(letterId))) {
        navigate('/not-found', { state: { messageKey: 'missingLetterId' } }); // Redirect if `letterId` is missing
        return;
      }

      try {
        // Simulate an API call to check if the ID exists
        const isValid = await letterExists(letterId);

        if (!isValid) {
          navigate('/not-found', { state: { messageKey: 'invalidLetterId' } }); // Redirect if `letterId` is invalid
        }
      } catch (error) {
        console.error('Error validating letterId:', error);
        navigate('/error'); // Redirect to an error page if the validation fails
      }
    };

    validateLetterId();
  }, [letterId, navigate]);


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
    "SEARCH": { showContainer: true, component: <SearchContainer />, action: () => true },
    "FAVOURITES": { showContainer: true, component: <FavouritesContainer />, action: () => true },
  }

  const componentMappingRight: Record<string, ComponentMappingItem> = {
    "ASSIGNED": { showContainer: true , component: <AssignedContainer />, action: () => true},
    "SET_FAVOURITE": { showContainer: false, action: () => handleFavouriteClick(letterId, true)}, // Example with a function
  };

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
            selected={!(selectedItemLeft === false || selectedItemLeft !== "SEARCH") }
            onClick={(event) => handleTabChangeLeft("SEARCH")}
          >
            <ListItemIcon>
              <SearchIcon/>
            </ListItemIcon>
          </ListItemButton>
          <ListItemButton
            selected={!(selectedItemLeft === false || selectedItemLeft !== "FAVOURITES") }
            onClick={(event) => handleTabChangeLeft("FAVOURITES")}
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
        { (letterId === undefined || isNaN(parseInt(letterId) ) || letterChanged || letterName === undefined) ? <div>Letter ID is not a number</div> :
          <>
            <LetterTabs activeTab={stateActiveTab === null ? 0 : stateActiveTab} letterId={parseInt(letterId)} letterName={letterName} />
            <LetterViewContainer letterId={contentLetterId !== null ? contentLetterId : parseInt(letterId)} />
          </>
        }
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
            selected={!(selectedItemRight === false || selectedItemRight !== "ASSIGNED") }
            onClick={() => handleTabChangeRight("ASSIGNED")}
          >
            <ListItemIcon>
              <SearchIcon/>
            </ListItemIcon>
          </ListItemButton>
          <ListItemButton
            selected={!(selectedItemRight === false || selectedItemRight !== "SET_FAVOURITE") }
            onClick={(event) => handleTabChangeRight("SET_FAVOURITE")}
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

export default ShowLetter;
