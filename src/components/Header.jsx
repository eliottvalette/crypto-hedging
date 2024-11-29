import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <h1>Crypto Edge</h1>
      <nav>
        <ul>
          <li><Link to="/">Tableau de Bord</Link></li>
          <li><Link to="/hedging">Calculatrice de Garantie</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
