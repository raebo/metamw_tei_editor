import { useAuth } from '@src/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await logout();
        navigate('/login', { replace: true });
      } catch (_err) {
        enqueueSnackbar('Logout failed. Please try again. ', { variant: 'error' });
      }
    };

    doLogout();
  }, [logout, navigate]);

  return <div>Logging out...</div>;
};

export default LogoutPage;
