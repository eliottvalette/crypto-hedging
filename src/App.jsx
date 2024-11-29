import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import HedgingCalculator from './components/HedgingCalculator';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hedging" element={<HedgingCalculator />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
