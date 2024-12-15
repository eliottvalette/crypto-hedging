import { useState, useEffect } from 'react';
import Select from 'react-select';
import { calculateShortHedgeParameters } from '../utils/hedging';
import { getSpotPrice, getAvailableSymbols } from '../utils/data';
import { customStyles } from '../utils/config';

const ResultBasedShortHedging = () => {
    const [targetReturn, setTargetReturn] = useState(10);
    const [desiredPayout, setDesiredPayout] = useState(1000);
    const [availableMargin, setAvailableMargin] = useState(2000);
    const [riskAversion, setRiskAversion] = useState('medium');
    const [calculatedParams, setCalculatedParams] = useState(null);
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [symbol, setSymbol] = useState({ value: 'BTCUSDT', label: 'BTCUSDT' });
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
    const [error, setError] = useState('');

    const riskAversionOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
    ];

    useEffect(() => {
        async function fetchSymbols() {
            const symbols = await getAvailableSymbols();
            const symbolOptions = symbols.map(sym => ({ value: sym, label: sym }));
            setAvailableSymbols(symbolOptions);
        }
        fetchSymbols();
    }, []);

    useEffect(() => {
        async function fetchPrices() {
            const spotPrice = await getSpotPrice(symbol.value);
            setSpotEntryPrice(parseFloat(spotPrice));
        }
        fetchPrices();
    }, [symbol]);

    const handleCalculateHedge = () => {
        if (isNaN(targetReturn) || isNaN(desiredPayout) || isNaN(availableMargin) || isNaN(spotEntryPrice)) {
            setError('Please enter valid numerical values.');
            return;
        }

        setError('');

        try {
            const params = calculateShortHedgeParameters(
                targetReturn,
                desiredPayout,
                availableMargin,
                riskAversion,
                spotEntryPrice,
                twoWeeksVolume
            );
            console.log('Calculated Parameters:', params);
            setCalculatedParams(params);
        } catch (err) {
            console.error('Hedge Calculation Error:', err);
            setError(`Calculation failed: ${err.message}`);
        }
    };

    return (
        <div className="calculator-container">
            <h1>Result-Based Short Hedging</h1>

            <label>Currency</label>
            <Select
                value={symbol}
                onChange={setSymbol}
                options={availableSymbols}
                className="currency-select"
                styles={customStyles}
            />

            <label>Target Return (in %)</label>
            <input
                type="number"
                placeholder="e.g., +10 or -5"
                value={targetReturn}
                onChange={(e) => setTargetReturn(parseFloat(e.target.value))}
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
            <Select
                value={riskAversionOptions.find(option => option.value === riskAversion)}
                onChange={(option) => setRiskAversion(option.value)}
                options={riskAversionOptions}
                className="currency-select"
                styles={customStyles}
            />

            <button onClick={handleCalculateHedge} className='calculate-button'>Calculate Hedge</button>

            {calculatedParams && (
                <div className="results-container">
                    <h2>Calculated Hedge Parameters</h2>
                    <p>Quantity (Q): {calculatedParams.quantity}</p>
                    <p>Hedging Ratio (h): {calculatedParams.hedgingRatio}</p>
                    <p>Leverage: {calculatedParams.leverage}</p>
                    <p>Spot Entry Price: ${calculatedParams.spotEntryPrice}</p>
                    <p>Margin Required: ${calculatedParams.marginRequired}</p>
                </div>
            )}

            {error && <div className="error-message">⚠️ {error}</div>}
        </div>
    );
};

export default ResultBasedShortHedging;