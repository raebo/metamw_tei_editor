import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Branding from "./Branding";
import Navigation from "./Navigation";
import Settings from "./Settings";
import { Page } from "../../interfaces/page.interface";

interface HeaderProps {
  isAuthenticated: boolean
}

const pages: Page[] = [
  { title: 'Annotationen', path: '/automatic_annotations' },
  // { title: 'Brief', path: '/automatic_annotations/1/letters/2' },
  { title: 'Editor', path: '/editor/' },
  { title: 'Editor (Suche)', path: '/editor/letters' },
  // { title: 'Editor (EDIT)', path: '/editor/letters/13253/gb-1835-04-17-01' },
  { title: 'Annos (Letter)', path: '/automatic_annotations/17/letters/57' },
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
