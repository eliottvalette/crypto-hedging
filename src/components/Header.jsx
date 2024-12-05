import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../components/UserContext';

function Header() {
  const { user } = useContext(UserContext);

  return (
    <div className="header">
      {user ? (
        <p>Welcome, {user.email}</p>
      ) : (
        <NavLink to="/auth" className="header-button">
          Open Account
        </NavLink>
      )}
    </div>
  );
}

export default Header;