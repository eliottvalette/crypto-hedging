import { useState, useEffect } from 'react';
import Select from 'react-select';
import { calculateShortHedgeParameters } from '../utils/hedging';
import { getSpotPrice, getAvailableSymbols } from '../utils/data';
import { customStyles } from '../utils/config';

const ResultBasedShortHedging = () => {
    // Store input values as strings for maximum control
    const [targetReturn, setTargetReturn] = useState('10');
    const [desiredPayout, setDesiredPayout] = useState('1000');
    const [availableMargin, setAvailableMargin] = useState('2000');
    const [riskAversion, setRiskAversion] = useState('medium');
    const [calculatedParams, setCalculatedParams] = useState(null);
    const [calculatedDownTrendParams, setCalculatedDownTrendParams] = useState(null);
    const [calculatedSideTrendParams, setCalculatedSideTrendParams] = useState(null);
    const [calculatedUpTrendParams, setCalculatedUpTrendParams] = useState(null);

    // Additional states
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [symbol, setSymbol] = useState({ value: 'BTCUSDT', label: 'BTCUSDT' });
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
    const [error, setError] = useState('');

    // Risk aversion dropdown
    const riskAversionOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
    ];

    // Fetch the list of available symbols once
    useEffect(() => {
        async function fetchSymbols() {
            try {
                const symbols = await getAvailableSymbols();
                const symbolOptions = symbols.map(sym => ({ value: sym, label: sym }));
                setAvailableSymbols(symbolOptions);
            } catch (err) {
                console.error('Error fetching symbols:', err);
            }
        }
        fetchSymbols();
    }, []);

    // Fetch the spot price whenever the symbol changes
    useEffect(() => {
        async function fetchPrices() {
            try {
                const spotPrice = await getSpotPrice(symbol.value);
                setSpotEntryPrice(parseFloat(spotPrice));
            } catch (err) {
                console.error('Error fetching spot price:', err);
            }
        }
        fetchPrices();
    }, [symbol]);

    // Calculate button handler
    const handleCalculateHedge = () => {
        setError(''); // Reset any old errors
    
        const parsedTargetReturn = parseFloat(targetReturn);
        const parsedDesiredPayout = parseFloat(desiredPayout);
        const parsedAvailableMargin = parseFloat(availableMargin);
    
        if (
            isNaN(parsedTargetReturn) ||
            isNaN(parsedDesiredPayout) ||
            isNaN(parsedAvailableMargin) ||
            isNaN(spotEntryPrice)
        ) {
            setError('Please enter valid numerical values in all fields.');
            return;
        }
    
        try {
            // Calculate parameters for the current spot price
            const params = calculateShortHedgeParameters(
                parsedTargetReturn,
                parsedDesiredPayout,
                parsedAvailableMargin,
                riskAversion,
                spotEntryPrice,
                twoWeeksVolume
            );
    
            // Calculate for downtrend (e.g., -10%)
            const downTrendPrice = spotEntryPrice * 0.9;
            const downTrendParams = calculateShortHedgeParameters(
                parsedTargetReturn,
                parsedDesiredPayout,
                parsedAvailableMargin,
                riskAversion,
                downTrendPrice,
                twoWeeksVolume
            );
    
            // Calculate for uptrend (e.g., +10%)
            const upTrendPrice = spotEntryPrice * 1.1;
            const upTrendParams = calculateShortHedgeParameters(
                parsedTargetReturn,
                parsedDesiredPayout,
                parsedAvailableMargin,
                riskAversion,
                upTrendPrice,
                twoWeeksVolume
            );
    
            // Calculate for side trend (e.g., 0%)
            const sideTrendPrice = spotEntryPrice * 1; // Adjust as needed
            const sideTrendParams = calculateShortHedgeParameters(
                parsedTargetReturn,
                parsedDesiredPayout,
                parsedAvailableMargin,
                riskAversion,
                sideTrendPrice,
                twoWeeksVolume
            );
    
            // Update state
            setCalculatedParams(params);
            setCalculatedDownTrendParams(downTrendParams);
            setCalculatedUpTrendParams(upTrendParams);
            setCalculatedSideTrendParams(sideTrendParams);
        } catch (err) {
            console.error('Hedge Calculation Error:', err);
            setError(`Calculation failed: ${err.message}`);
        }
    };

    const formatNumber = (number) => {
        if (number < 0.01 && number > 0) return number.toExponential(2); // Use scientific notation for small values
        return parseFloat(number).toFixed(2); // Round to 2 decimal places for other cases
    };
    

    return (
        <div className="calculator-container">
            <h1>Result-Based Short Hedging</h1>

            {/* Currency Selection */}
            <label>Currency</label>
            <Select
                value={symbol}
                onChange={setSymbol}
                options={availableSymbols}
                className="currency-select"
                styles={customStyles}
            />

            {/* Target Exit Input */}
            <label>What’s your target exit? (%)</label>
            <input
                type="number"
                step="any"
                placeholder="+10% or -5%"
                value={targetReturn}
                onChange={(e) => setTargetReturn(e.target.value)}
            />

            {/* Desired Payout */}
            <label>Desired Payout ($)</label>
            <input
                type="number"
                step="any"
                placeholder="Desired payout"
                value={desiredPayout}
                onChange={(e) => setDesiredPayout(e.target.value)}
            />

            {/* Available Margin */}
            <label>Available Margin ($)</label>
            <input
                type="number"
                step="any"
                placeholder="Available margin"
                value={availableMargin}
                onChange={(e) => setAvailableMargin(e.target.value)}
            />

            {/* Risk Aversion */}
            <label>Risk Aversion</label>
            <Select
                value={riskAversionOptions.find(option => option.value === riskAversion)}
                onChange={(option) => setRiskAversion(option.value)}
                options={riskAversionOptions}
                className="currency-select"
                styles={customStyles}
            />

            <button onClick={handleCalculateHedge} className='calculate-button'>
                Calculate Hedge
            </button>

            {/* Display Results */}
            {calculatedParams && (
            <div className="results-container">
                <h2>Calculated Hedge Parameters</h2>
                <p>
                    Buy: {formatNumber(calculatedParams.quantity)} {symbol.value} spot at 
                    ${formatNumber(spotEntryPrice)}.
                </p>
                <p>
                    Open short with ${formatNumber(calculatedParams.marginRequired)} at 
                    {formatNumber(calculatedParams.leverage)}x leverage.
                </p>

                <h3>Trend Scenarios</h3>
                <p><strong>Downtrend (-10%):</strong></p>
                <p>
                    Buy: {formatNumber(calculatedDownTrendParams.quantity)} {symbol.value} spot at 
                    ${formatNumber(spotEntryPrice * 0.9)}.
                </p>
                <p>
                    Open short with ${formatNumber(calculatedDownTrendParams.marginRequired)} at 
                    {formatNumber(calculatedDownTrendParams.leverage)}x leverage.
                </p>

                <p><strong>Uptrend (+10%):</strong></p>
                <p>
                    Buy: {formatNumber(calculatedUpTrendParams.quantity)} {symbol.value} spot at 
                    ${formatNumber(spotEntryPrice * 1.1)}.
                </p>
                <p>
                    Open short with ${formatNumber(calculatedUpTrendParams.marginRequired)} at 
                    {formatNumber(calculatedUpTrendParams.leverage)}x leverage.
                </p>

                <p><strong>Side Trend (0%):</strong></p>
                <p>
                    Buy: {formatNumber(calculatedSideTrendParams.quantity)} {symbol.value} spot at 
                    ${formatNumber(spotEntryPrice * 1)}.
                </p>
                <p>
                    Open short with ${formatNumber(calculatedSideTrendParams.marginRequired)} at 
                    {formatNumber(calculatedSideTrendParams.leverage)}x leverage.
                </p>
            </div>
        )}


            {/* Error Message */}
            {error && <div className="error-message">⚠️ {error}</div>}
        </div>
    );
};

export default ResultBasedShortHedging;
