import { useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '@src/redux/redux.store';
import { setCurrentPath } from '@src/redux/slices/route.slice';

interface PathRestorerProps {
  children: ReactNode;
}

const PathRestorer = ({ children }: PathRestorerProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentPath = useSelector((state: RootState) => state.route.currentPath);

  useEffect(() => {
    if (currentPath && currentPath !== '/') {
      // Navigate to the current path stored in Redux
      navigate(currentPath);
      return;
    }
    // Check for saved path on component mount (page reload)
    const savedPath = localStorage.getItem('lastVisitedPath');

    if (savedPath && savedPath !== '/') {
      // Restore the saved path
      dispatch(setCurrentPath(savedPath));
      navigate(savedPath);
    }
  }, [currentPath, dispatch, navigate]);

  return <>{children}</>;
};

export default PathRestorer;
