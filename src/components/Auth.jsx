import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, googleSignIn } from '../utils/auth';
import { UserContext } from '../components/UserContext';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const {user, setUser } = useContext(UserContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/'); // Redirect to home page if user is logged in
    }
  }, [user, navigate]);

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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
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

  const handleGoogleSignIn = async () => {
    try {
      const googleUser = await googleSignIn();
      setUser(googleUser);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Error signing in with Google');
    }
  };

  const toggleAuth = () => {
    setIsRegistering(!isRegistering);
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        {isRegistering ? (
          <>
            <img src="/shield.png" alt="lock" className="auth-img"/>
            <h2 className="auth-title">Login</h2>
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <button onClick={handleLogin} className="auth-button">
              Login
            </button>
            <button onClick={handleGoogleSignIn} className="auth-button google-button">
              Sign in with Google
            </button>
            <div className="auth-footer">
              <p>
                No account yet? <span onClick={toggleAuth} className="auth-link">Sign up</span>
              </p>
              <p>
                Forgot password? <span className="auth-link">Reset</span>
              </p>
            </div>
          </>
        ) : (
          <>
            <img src="/shield.png" alt="lock" className="auth-img" />
            <h2 className="auth-title">Sign Up</h2>
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
            />
            <button onClick={handleRegister} className="auth-button">
              Sign Up
            </button>
            <button onClick={handleGoogleSignIn} className="auth-button google-button">
              Sign in with Google
            </button>
            <div className="auth-footer">
              <p>
                Already have an account? <span onClick={toggleAuth} className="auth-link">Login</span>
              </p>
              <p>
                Forgot password? <span className="auth-link">Reset</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;
