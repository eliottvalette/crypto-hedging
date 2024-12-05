import { Routes, Route } from 'react-router-dom';
import Aside from './components/Aside';
import Dashboard from './components/Dashboard';
import ResultBasedCalculator from './components/HedgingScenarios';
import HedgingCalculator from './components/ResultBasedCalculator';
import Header from './components/Header';
import Auth from './components/Auth';
import { UserProvider } from './components/UserContext';

function App() {
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
          </Routes>
        </main>
      </div>
    </UserProvider>
  );
}

export default App;