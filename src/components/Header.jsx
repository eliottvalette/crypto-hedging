import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../components/UserContext';
import { logout } from '../utils/auth';

function Header() {
  const { user, setUser } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="header">
      {user ? (
        <>
          <button onClick={handleLogout} className="header-button">
            Logout
          </button>
        </>
      ) : (
        <NavLink to="/auth" className="header-button">
          Open Account
        </NavLink>
      )}
    </div>
  );
}

export default Header;