import { useState } from 'react';
import { calculateNetPnl } from '../utils/hedging';

const HedgingCalculator = () => {
    const [symbol, setSymbol] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [proportion, setProportion] = useState(0);
    const [hedgeKind, setHedgeKind] = useState('spot');

    const isSpot = hedgeKind === 'spot';
    console.log('symbol, amount, proportion, hedgeKind:', symbol, amount, proportion, hedgeKind);

    return (
        <div className="calculator-container">
            <div className="buttons-container">
                <button className={isSpot ? 'active' : ''} onClick={() => setHedgeKind('spot')}> Spot </button>
                <button  className={!isSpot ? 'active' : ''} onClick={() => setHedgeKind('future')}> Future </button>
            </div>
            <h1>Hedging Calculator ({hedgeKind === 'spot' ? 'Spot' : 'Future'})</h1>
            <input name="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol" />
            <input name="Amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} placeholder="Amount To Invest ($)" />
            <input name="Price" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} placeholder="Spot Price ($)" />

            <label>Hedging Ratio (h):</label>
            <input type="range" name="h" min="0" max="1" step="0.01" value={proportion} onChange={(e) => setProportion(parseFloat(e.target.value) || 0)} />
        </div>
    );
};

export default HedgingCalculator;
