import { useState } from 'react';
import { calculatePayout } from '../utils/hedging';

const HedgingCalculator = () => {
    const [quantity, setQuantity] = useState('');
    const [spotEntryPrice, setSpotEntryPrice] = useState('');
    const [futuresEntryPrice, setFuturesEntryPrice] = useState('');
    const [hedgingRatio, setHedgingRatio] = useState(0.5); // Default 50% hedging

    const [spotPayout, setSpotPayout] = useState(null);
    const [hedgedPayout, setHedgedPayout] = useState(null);

    const handleCalculate = () => {
        const Q = parseFloat(quantity) || 0;
        const P_spot_achat = parseFloat(spotEntryPrice) || 0;
        const P_futures_entree = parseFloat(futuresEntryPrice) || 0;

        // Call the calculation function
        const { spotPayout, hedgedPayout } = calculatePayout(
            Q,
            P_spot_achat,
            P_futures_entree,
            hedgingRatio
        );

        setSpotPayout(spotPayout.toFixed(2));
        setHedgedPayout(hedgedPayout.toFixed(2));
    };

    return (
        <div className="calculator-container">
            <h1>Hedging Calculator</h1>
            <input
                type="number"
                placeholder="Quantity (Q)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
            />
            <input
                type="number"
                placeholder="Spot Entry Price ($)"
                value={spotEntryPrice}
                onChange={(e) => setSpotEntryPrice(e.target.value)}
            />
            <input
                type="number"
                placeholder="Futures Entry Price ($)"
                value={futuresEntryPrice}
                onChange={(e) => setFuturesEntryPrice(e.target.value)}
            />
            <label>Hedging Ratio (h): {hedgingRatio}</label>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={hedgingRatio}
                onChange={(e) => setHedgingRatio(e.target.value)}
            />
            <button onClick={handleCalculate}>Calculate</button>

            {spotPayout !== null && (
                <div>
                    <h2>Results</h2>
                    <p>Spot-Only Payout: ${spotPayout}</p>
                    <p>Hedged Payout: ${hedgedPayout}</p>
                </div>
            )}
        </div>
    );
};

export default HedgingCalculator;
