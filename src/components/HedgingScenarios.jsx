// HedgingCalculator.jsx

import { useState, useEffect } from 'react';
import { calculatePayoutFuture, calculatePayoutShort } from '../utils/hedging';
import { getSpotPrice, getFuturesPrice} from '../utils/data';
import TrendsChart from './TrendsChart';

const HedgingScenarios = () => {
    const [hedgeType, setHedgeType] = useState('spot');
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [quantity, setQuantity] = useState(1);
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [futuresEntryPrice, setFuturesEntryPrice] = useState(0);
    const [hedgingRatio, setHedgingRatio] = useState(0.03);
    const [platform, setPlatform] = useState('Binance');

    const [spotPayouts, setSpotPayouts] = useState({ up: null, down: null, neutral: null });
    const [hedgedPayouts, setHedgedPayouts] = useState({ up: null, down: null, neutral: null });
    const [optimalLeverage, setOptimalLeverage] = useState(null);
    const [error, setError] = useState('');
    const [marginRate, setMarginRate] = useState(0.1); // Added marginRate state

    const [trend, setTrend] = useState('upTrend');

    useEffect(() => {
        async function fetchPrices() {
            const spotPrice = await getSpotPrice(symbol, platform);
            const futuresPrice = await getFuturesPrice(symbol, platform);
            setSpotEntryPrice(spotPrice);
            setFuturesEntryPrice(futuresPrice);
        }
        fetchPrices();
    }, [symbol, platform]);

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
            results[scenario] = calculatePayoutFuture(Q, P_spot_achat, P_futures_entree, h, changePercent);
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
        const margin = parseFloat(marginRate);
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
            results[scenario] = calculatePayoutShort(Q, P_spot_achat, exitPrice, h, margin);
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
                            type="text"
                            placeholder="Platform"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
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
                        <label>Margin Rate : {marginRate}</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={marginRate}
                            onChange={(e) => setMarginRate(e.target.value)}
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
                        <button onClick={handleCalculateShort} className='calculate-button'>Calculate</button>

                        {spotPayouts.up !== null && (                            
                            <div className="results-container">
                                <h2>Results for Short Position</h2>
                                <p>Optimal Leverage: {optimalLeverage}</p>
                                <div className="results-types-container">
                                  <div className="results-up" onClick={() => setTrend('upTrend')}>
                                    <h3>Up Scenario (+10%)</h3>
                                    <p>Without Hedge: ${spotPayouts.up}</p>
                                    <p>With Hedge: ${hedgedPayouts.up}</p>
                                  </div>
                                  <div className="results-down" onClick={() => setTrend('downTrend')}>
                                      <h3>Down Scenario (-10%)</h3>
                                      <p>Without Hedge: ${spotPayouts.down}</p>
                                      <p>With Hedge: ${hedgedPayouts.down}</p>
                                  </div>
                                  <div className="results-neutral" onClick={() => setTrend('sideTrend')}>
                                      <h3>Neutral Scenario (0%)</h3>
                                      <p>Without Hedge: ${spotPayouts.neutral}</p>
                                      <p>With Hedge: ${hedgedPayouts.neutral}</p>
                                  </div>
                                </div>
                                <TrendsChart trend={trend} quantity={quantity} hedgingRatio={hedgingRatio} type ={'spot'} symbol={symbol} marginRate={marginRate}/>
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
                            type="text"
                            placeholder="Platform"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
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
                        <button onClick={handleCalculateFuture} className='calculate-button' >Calculate</button>

                        {spotPayouts.up !== null && (
                            <div className="results-container">
                                <h2>Futures Hedging Results</h2>
                                <div className="results-types-container">
                                  <div className="results-up" onClick={() => setTrend('upTrend')}>
                                    <h3>Up Scenario (+10%)</h3>
                                    <p>Without Hedge: ${spotPayouts.up}</p>
                                    <p>With Hedge: ${hedgedPayouts.up}</p>
                                  </div>
                                  <div className="results-down" onClick={() => setTrend('downTrend')}>
                                      <h3>Down Scenario (-10%)</h3>
                                      <p>Without Hedge: ${spotPayouts.down}</p>
                                      <p>With Hedge: ${hedgedPayouts.down}</p>
                                  </div>
                                  <div className="results-neutral" onClick={() => setTrend('sideTrend')}>
                                      <h3>Neutral Scenario (0%)</h3>
                                      <p>Without Hedge: ${spotPayouts.neutral}</p>
                                      <p>With Hedge: ${hedgedPayouts.neutral}</p>
                                  </div>
                                </div>
                                <TrendsChart trend={trend} quantity={quantity} hedgingRatio={hedgingRatio} type ={'future'} symbol={symbol}/>
                            </div>
                        )}
                    </>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
    );

};

export default HedgingScenarios;