import { useState, useContext } from 'react';
import { register, login, logout } from '../utils/auth';
import { UserContext } from '../components/UserContext';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const {user, setUser } = useContext(UserContext);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRegister = async () => {
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    try {
      const newUser = await register(email, password);
      setUser(newUser);
    } catch (error) {
      console.error('Error registering:', error);
      setError('Error registering user');
    }
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    try {
      const loggedInUser = await login(email, password);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Error logging in user');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Error logging out user');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src="src/assets/shield.png" alt="lock" className="auth-img" />
        <h2 className="auth-title">Connexion</h2>
        {error && <p className="auth-error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <button onClick={handleLogin} className="auth-button">
          Se connecter
        </button>
        <div className="auth-footer">
          <p>
            Pas encore de compte ? <span onClick={handleRegister} className="auth-link">S'inscrire</span>
          </p>
          <p>
            Mot de passe oublié ? <span className="auth-link">Réinitialiser</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
