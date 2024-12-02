import { useState } from 'react';
import { calculateParametersFromPayout } from '../utils/hedging';
import TrendsChart from './TrendsChart';

const ResultBasedCalculator = () => {
    const [desiredPayouts, setDesiredPayouts] = useState({ up: 0, down: 0, neutral: 0 });
    const [trend, setTrend] = useState('upTrend');
    const [calculatedParams, setCalculatedParams] = useState(null);
    const [error, setError] = useState('');

    const handleCalculateParameters = () => {
        const { up, down, neutral } = desiredPayouts;

        if (isNaN(up) || isNaN(down) || isNaN(neutral)) {
            setError('Please enter valid numerical values for payouts.');
            return;
        }

        setError('');

        try {
            const params = calculateParametersFromPayout(up, down, neutral, trend);
            setCalculatedParams(params);
        } catch (err) {
            setError('Calculation failed. Please check your inputs and try again.');
        }
    };

    return (
        <div className="calculator-container">
            <h1>Result-Based Hedging Calculator</h1>

            <label>Desired Payout - Up Scenario (+10%)</label>
            <input
                type="number"
                placeholder="Desired Payout Up ($)"
                value={desiredPayouts.up}
                onChange={(e) => setDesiredPayouts({ ...desiredPayouts, up: parseFloat(e.target.value) })}
            />

            <label>Desired Payout - Down Scenario (-10%)</label>
            <input
                type="number"
                placeholder="Desired Payout Down ($)"
                value={desiredPayouts.down}
                onChange={(e) => setDesiredPayouts({ ...desiredPayouts, down: parseFloat(e.target.value) })}
            />

            <label>Desired Payout - Neutral Scenario (0%)</label>
            <input
                type="number"
                placeholder="Desired Payout Neutral ($)"
                value={desiredPayouts.neutral}
                onChange={(e) => setDesiredPayouts({ ...desiredPayouts, neutral: parseFloat(e.target.value) })}
            />

            <label>Select Trend</label>
            <select value={trend} onChange={(e) => setTrend(e.target.value)}>
                <option value="upTrend">Up Trend</option>
                <option value="downTrend">Down Trend</option>
                <option value="sideTrend">Neutral Trend</option>
            </select>

            <button onClick={handleCalculateParameters}>Calculate Parameters</button>

            {calculatedParams && (
                <div className="results-container">
                    <h2>Calculated Parameters</h2>
                    <p>Quantity (Q): {calculatedParams.quantity}</p>
                    <p>Hedging Ratio (h): {calculatedParams.hedgingRatio}</p>
                    <p>Spot Entry Price: ${calculatedParams.spotEntryPrice}</p>
                    <p>Futures Entry Price: ${calculatedParams.futuresEntryPrice}</p>
                    <p>Margin Rate: {calculatedParams.marginRate}</p>
                    <TrendsChart
                        trend={trend}
                        quantity={calculatedParams.quantity}
                        hedgingRatio={calculatedParams.hedgingRatio}
                        type="resultBased"
                        symbol="BTCUSDT"
                        marginRate={calculatedParams.marginRate}
                    />
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default ResultBasedCalculator;