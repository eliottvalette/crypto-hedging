import { NavLink } from 'react-router-dom';
import Footer from './Footer';

function Aside() {
  return (
    <aside className="aside">
      <div className="aside-top">
        <NavLink to="/">
        <h1>Crypto Hedge</h1>
        </NavLink>
        <nav>
          <ul className="nav-ul">
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'active-link' : ''}
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/hedging-calculator" 
                className={({ isActive }) => isActive ? 'active-link' : ''}
              >
                Result Based Hedging
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/hedging-result-based" 
                className={({ isActive }) => isActive ? 'active-link' : ''}
              >
                Hedging Simulation
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <Footer />
    </aside>
  );
}

export default Aside;