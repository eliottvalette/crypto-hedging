import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <h1>Crypto Hedge</h1>
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/hedging">Hedging Calculator</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
