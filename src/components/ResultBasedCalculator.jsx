import { useState, useEffect } from 'react';
import { calculateShortHedgeParameters } from '../utils/hedging';
import TrendsChart from './TrendsChart';
import { getSpotPrice} from '../utils/data';

const ResultBasedShortHedging = () => {
    const [expectedTrend, setExpectedTrend] = useState(10);
    const [desiredPayout, setDesiredPayout] = useState(1000);
    const [availableMargin, setAvailableMargin] = useState(2000);
    const [riskAversion, setRiskAversion] = useState('medium');
    const [calculatedParams, setCalculatedParams] = useState(null);
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [symbol, setSymbol] = useState('BTCUSDT');
    
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchPrices() {
            const spotPrice = await getSpotPrice(symbol);
            setSpotEntryPrice(spotPrice);
        }
        fetchPrices();
    }, [symbol]);

    const handleCalculateHedge = () => {
        if (isNaN(expectedTrend) || isNaN(desiredPayout) || isNaN(availableMargin) || isNaN(spotEntryPrice)) {
            setError('Please enter valid numerical values.');
            return;
        }

        setError('');

        try {
            const params = calculateShortHedgeParameters(
                expectedTrend,
                desiredPayout,
                availableMargin,
                riskAversion,
                spotEntryPrice
            );
            console.log('Calculated Parameters:', params);
            setCalculatedParams(params);
        } catch (err) {
            console.error('Hedge Calculation Error:', err);
            setError(`Calculation failed : ${err.message}`);
        }
    };

    return (
        <div className="calculator-container">
            <h1>Result-Based Short Hedging</h1>

            <label>Currency</label>
            <input
                type="text"
                placeholder="BTCUSDT"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
            />

            <label>Expected Trend (in %)</label>
            <input
                type="number"
                placeholder="e.g., +10 or -5"
                value={expectedTrend}
                onChange={(e) => setExpectedTrend(parseFloat(e.target.value))}
            />

            <label>Desired Payout ($)</label>
            <input
                type="number"
                placeholder="Desired payout"
                value={desiredPayout}
                onChange={(e) => setDesiredPayout(parseFloat(e.target.value))}
            />

            <label>Available Margin ($)</label>
            <input
                type="number"
                placeholder="Available margin"
                value={availableMargin}
                onChange={(e) => setAvailableMargin(parseFloat(e.target.value))}
            />

            <label>Risk Aversion</label>
            <select value={riskAversion || 'medium'} onChange={(e) => setRiskAversion(e.target.value)} className='risk-select'>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>


            <button onClick={handleCalculateHedge} className='calculate-button'>Calculate Hedge</button>

            {calculatedParams && (
                <div className="results-container">
                    <h2>Calculated Hedge Parameters</h2>
                    <p>Quantity (Q): {calculatedParams.quantity}</p>
                    <p>Hedging Ratio (h): {calculatedParams.hedgingRatio}</p>
                    <p>Leverage: {calculatedParams.leverage}</p>
                    <p>Spot Entry Price: ${calculatedParams.spotEntryPrice}</p>
                    <p>Margin Required: ${calculatedParams.marginRequired}</p>
                    <TrendsChart
                        trend={expectedTrend > 0 ? 'upTrend' : expectedTrend < 0 ? 'downTrend' : 'neutralTrend'}
                        quantity={Number(calculatedParams.quantity)}
                        hedgingRatio={Number(calculatedParams.hedgingRatio)}
                        type="resultBasedShort"
                        symbol="BTCUSDT"
                        marginRate={Number(calculatedParams.marginRate)}
                    />

                </div>
            )}

            {error && <div className="error-message">⚠️ {error}</div>}
        </div>
    );
};

export default ResultBasedShortHedging;
