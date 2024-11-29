import { useState } from 'react';
import { calculateNetPnl } from '../utils/hedging';

const HedgingCalculator = () => {
    const [symbol, setSymbol] = useState('');
    const [amount, setAmount] = useState(0);
    const [proportion, setProportion] = useState(0);
    const [hedgeKind, setHedgeKind] = useState('spot');

    const isSpot = hedgeKind === 'spot';

    return (
        <div className="calculator-container">
            <div className="buttons-container">
                <button 
                    className={isSpot ? 'active' : ''} 
                    onClick={() => setHedgeKind('spot')}
                >
                    Spot
                </button>
                <button 
                    className={!isSpot ? 'active' : ''} 
                    onClick={() => setHedgeKind('future')}
                >
                    Future
                </button>
            </div>
            <h1>Hedging Calculator ({hedgeKind === 'spot' ? 'Spot' : 'Future'})</h1>
            <input 
                type="text" 
                name="Symbol" 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value)} 
                placeholder="Symbol" 
            />
            <input 
                type="number" 
                name="Amount" 
                value={amount} 
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
                placeholder="Amount ($)" 
            />
            <label>Hedging Ratio (h):</label>
            <input 
                type="range" 
                name="h" 
                min="0" 
                max="1" 
                step="0.01" 
                value={proportion} 
                onChange={(e) => setProportion(parseFloat(e.target.value) || 0)} 
            />
        </div>
    );
};

export default HedgingCalculator;
