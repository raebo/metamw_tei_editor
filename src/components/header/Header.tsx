import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Branding from "./Branding";
// import MobileNavigation from "./mobile/MobileNavigation";
// import MobileBranding from "./mobile/MobileBranding";
import Navigation from "./Navigation";
import Settings from "./Settings";
import { authenticatedVar } from "../../constants/authenticated";
import useReactiveVar from "../../utils/makeReactiveVar";
import { Page } from "../../interfaces/page.interface";
import { useAuthToken } from "../../services/authentication.service";
import { useEffect } from "react";

interface HeaderProps {
  isAuthenticated: boolean
}


const pages: Page[] = [
  { title: 'Annotationen', path: '/automatic_annotations' }
];

const unauthenticatedPages: Page[] = [
  { title: 'Home', path: '/' },
  { title: 'Login', path: '/login' },
];

const Header = ( { isAuthenticated } : HeaderProps) => {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Branding />
          {/*<MobileNavigation pages={authenticated ? pages : unauthenticatedPages} />*/}
          {/*<MobileBranding />*/}
          <Navigation pages={isAuthenticated ? pages : unauthenticatedPages} />
          { isAuthenticated && <Settings /> }
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Header;