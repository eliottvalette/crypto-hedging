// HedgingCalculator.jsx

import { useState, useEffect } from 'react';
import { calculatePayout_Future, calculatePayout_Short } from '../utils/hedging';
import { getSpotPrice, getFuturesPrice} from '../utils/data';

const HedgingCalculator = () => {
    const [hedgeType, setHedgeType] = useState('spot');
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [quantity, setQuantity] = useState(1);
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [futuresEntryPrice, setFuturesEntryPrice] = useState(0);
    const [hedgingRatio, setHedgingRatio] = useState(0.03);

    const [spotPayouts, setSpotPayouts] = useState({ up: null, down: null, neutral: null });
    const [hedgedPayouts, setHedgedPayouts] = useState({ up: null, down: null, neutral: null });
    const [optimalLeverage, setOptimalLeverage] = useState(null);
    const [error, setError] = useState('');
    const [initialMargin, setInitialMargin] = useState(1000); // Added initialMargin state

    useEffect(() => {
        async function fetchPrices() {
            const spotPrice = await getSpotPrice(symbol);
            const futuresPrice = await getFuturesPrice(symbol);
            setSpotEntryPrice(spotPrice);
            setFuturesEntryPrice(futuresPrice);
        }
        fetchPrices();
    }, [symbol]);

    const handleCalculateFuture = () => {
        const Q = parseFloat(quantity);
        const P_spot_achat = parseFloat(spotEntryPrice);
        const P_futures_entree = parseFloat(futuresEntryPrice);
        const h = parseFloat(hedgingRatio);

        if (isNaN(Q) || isNaN(P_spot_achat) || isNaN(P_futures_entree) || isNaN(h)) {
            setError('Please enter valid numerical values.');
            return;
        }

        if (h < 0 || h > 1) {
            setError('Hedging ratio must be between 0 and 1.');
            return;
        }

        setError('');

        const scenarios = {
            up: 10,        // +10%
            down: -10,     // -10%
            neutral: 0     // 0%
        };
        const results = {};

        Object.entries(scenarios).forEach(([scenario, changePercent]) => {
            results[scenario] = calculatePayout_Future(Q, P_spot_achat, P_futures_entree, h, changePercent);
        });

        setSpotPayouts({
            up: results.up.spotPayout.toFixed(2),
            down: results.down.spotPayout.toFixed(2),
            neutral: results.neutral.spotPayout.toFixed(2),
        });

        setHedgedPayouts({
            up: results.up.hedgedPayout.toFixed(2),
            down: results.down.hedgedPayout.toFixed(2),
            neutral: results.neutral.hedgedPayout.toFixed(2),
        });
    };

    const handleCalculateShort = () => {
        const Q = parseFloat(quantity);
        const P_spot_achat = parseFloat(spotEntryPrice);
        const margin = parseFloat(initialMargin);
        const h = parseFloat(hedgingRatio);

        if (isNaN(Q) || isNaN(P_spot_achat) || isNaN(margin) || isNaN(h)) {
            setError('Please enter valid numerical values.');
            return;
        }

        if (h < 0 || h > 1) {
            setError('Hedging ratio must be between 0 and 1.');
            return;
        }

        if (margin <= 0) {
            setError('Initial margin must be greater than 0.');
            return;
        }

        setError('');

        const scenarios = {
            up: P_spot_achat * 1.10,    // 10% up
            down: P_spot_achat * 0.90,  // 10% down
            neutral: P_spot_achat,      // No change
        };

        const results = {};

        Object.entries(scenarios).forEach(([scenario, exitPrice]) => {
            results[scenario] = calculatePayout_Short(Q, P_spot_achat, exitPrice, h, margin);
        });

        setSpotPayouts({
            up: results.up.spotPayout.toFixed(2),
            down: results.down.spotPayout.toFixed(2),
            neutral: results.neutral.spotPayout.toFixed(2),
        });

        setHedgedPayouts({
            up: results.up.hedgedPayout.toFixed(2),
            down: results.down.hedgedPayout.toFixed(2),
            neutral: results.neutral.hedgedPayout.toFixed(2),
        });

        setOptimalLeverage(results.neutral.optimalLeverage.toFixed(2));
    };

    return (
        <div className="calculator-wrapper">
            <div className="calculator-container">
                <div className="buttons-container">
                    <button
                        className={hedgeType === 'spot' ? 'active' : ''}
                        onClick={() => setHedgeType('spot')}
                    >
                        Short Position
                    </button>
                    <button
                        className={hedgeType === 'future' ? 'active' : ''}
                        onClick={() => setHedgeType('future')}
                    >
                        Futures Contract
                    </button>
                </div>

                {hedgeType === 'spot' ? (
                    <>
                        <h1>Hedging With Short Position</h1>
                        <input
                            type="text"
                            placeholder="Symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Quantity (Q)"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            step="1"
                        />
                        <input
                            type="number"
                            placeholder="Spot Entry Price ($)"
                            value={spotEntryPrice}
                            onChange={(e) => setSpotEntryPrice(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                        <input
                            type="number"
                            placeholder="Initial Margin ($)"
                            value={initialMargin}
                            onChange={(e) => setInitialMargin(e.target.value)}
                            min="0"
                            step="0.01"
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
                        <button onClick={handleCalculateShort}>Calculate</button>

                        {spotPayouts.up !== null && (
                            <div>
                                <h2>Results for Short Position</h2>
                                <p>Optimal Leverage: {optimalLeverage}</p>

                                <h3>Up Scenario (+10%)</h3>
                                <p>Spot Payout: ${spotPayouts.up}</p>
                                <p>Hedged Payout: ${hedgedPayouts.up}</p>

                                <h3>Down Scenario (-10%)</h3>
                                <p>Spot Payout: ${spotPayouts.down}</p>
                                <p>Hedged Payout: ${hedgedPayouts.down}</p>

                                <h3>Neutral Scenario (0%)</h3>
                                <p>Spot Payout: ${spotPayouts.neutral}</p>
                                <p>Hedged Payout: ${hedgedPayouts.neutral}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <h1>Futures Hedging Calculator</h1>
                        <input
                            type="text"
                            placeholder="Symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Quantity (Q)"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            step="1"
                        />
                        <input
                            type="number"
                            placeholder="Spot Entry Price ($)"
                            value={spotEntryPrice}
                            onChange={(e) => setSpotEntryPrice(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                        <input
                            type="number"
                            placeholder="Futures Entry Price ($)"
                            value={futuresEntryPrice}
                            onChange={(e) => setFuturesEntryPrice(e.target.value)}
                            min="0"
                            step="0.01"
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
                        <button onClick={handleCalculateFuture}>Calculate</button>

                        {spotPayouts.up !== null && (
                            <div>
                                <h2>Futures Hedging Results</h2>

                                <h3>Up Scenario (+10%)</h3>
                                <p>Spot Payout: ${spotPayouts.up}</p>
                                <p>Hedged Payout: ${hedgedPayouts.up}</p>

                                <h3>Down Scenario (-10%)</h3>
                                <p>Spot Payout: ${spotPayouts.down}</p>
                                <p>Hedged Payout: ${hedgedPayouts.down}</p>

                                <h3>Neutral Scenario (0%)</h3>
                                <p>Spot Payout: ${spotPayouts.neutral}</p>
                                <p>Hedged Payout: ${hedgedPayouts.neutral}</p>
                            </div>
                        )}
                    </>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );

};

export default HedgingCalculator;
