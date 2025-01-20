import { Routes, Route, useLocation} from 'react-router-dom';
import { logPageView } from './utils/analytics';
import { useEffect } from 'react';
import Aside from './components/Aside';
import Dashboard from './components/Dashboard';
import ResultBasedCalculator from './components/HedgingScenarios';
import HedgingCalculator from './components/ResultBasedCalculator';
import Header from './components/Header';
import Auth from './components/Auth';
import SavedOrders from './components/SavedOrders';
import { UserProvider } from './components/UserContext';

function App() {
  const location = useLocation();

  useEffect(() => {
    logPageView();
  }, [location]);
  
  return (
    <UserProvider>
      <div className="App">
        <Aside />
        <main>
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hedging-calculator" element={<HedgingCalculator />} />
            <Route path="/hedging-result-based" element={<ResultBasedCalculator />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/saved-orders" element={<SavedOrders />} />
          </Routes>
        </main>
      </div>
    </UserProvider>
  );
}

export default App;