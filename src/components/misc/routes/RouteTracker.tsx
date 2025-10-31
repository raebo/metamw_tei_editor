// components/RouteTracker.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentPath } from '@src/redux/slices/route.slice';

const dontTrackUrls = ['/login', '/signup', '/logout', '/password-reset'];

const RouteTracker = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (dontTrackUrls.includes(location.pathname)) {
      return;
    }

    dispatch(setCurrentPath(location.pathname));

    localStorage.setItem('lastVisitedPath', location.pathname);
  }, [location, dispatch]);

  return null; // This component doesn't render anything
};

export default RouteTracker;
