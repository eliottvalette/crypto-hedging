import { useState, useEffect } from 'react';
import Select from 'react-select';
import { calculateShortHedgeParameters, calculatePayoutShortDelay } from '../utils/hedging';
import { getSpotPrice, getAvailableSymbols } from '../utils/data';
import { customStyles } from '../utils/config';

const ResultBasedShortHedging = () => {
    // Store input values as strings for maximum control
    const [targetReturn, setTargetReturn] = useState(10);
    const [targetReturnText, setTargetReturnText] = useState('+10%');
    const [desiredPayout, setDesiredPayout] = useState('1000');
    const [availableMargin, setAvailableMargin] = useState('2000');
    const [riskAversion, setRiskAversion] = useState('medium');
    const [calculatedParams, setCalculatedParams] = useState(null);
    const [hedgingRatio, setHedgingRatio] = useState(50);

    // Additional states
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [symbol, setSymbol] = useState({ value: 'BTCUSDT', label: 'BTCUSDT' });
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
    const [error, setError] = useState('');
    const [payoutScenarios, setPayoutScenarios] = useState({low:null, noChange:null, high:null});

    // Risk aversion dropdown
    const riskAversionOptions = [
        { value: 'low', label: 'Low', hedging: 0.03 },
        { value: 'medium', label: 'Medium', hedging: 0.25 },
        { value: 'high', label: 'High', hedging: 0.5 }
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
                setError('Failed to fetch symbols.');
            }
        }
        fetchSymbols();
    }, []);

    const formatTargetReturn = (value) => {
        // tranform ±10% to 10 or -10
        const sign = value[0] === '-' ? -1 : 1;
        return sign * parseFloat(value.slice(1));
    };

    useEffect(() => {
        setTargetReturn(formatTargetReturn(targetReturnText));
    }, [targetReturnText]);

    // Fetch the spot price whenever the symbol changes
    useEffect(() => {
        async function fetchPrices() {
            try {
                const spotPrice = await getSpotPrice(symbol.value);
                setSpotEntryPrice(parseFloat(spotPrice));
            } catch (err) {
                console.error('Error fetching spot price:', err);
                setError('Failed to fetch spot price.');
            }
        }
        fetchPrices();
    }, [symbol]);

    const handleCalculateHedge = () => {
        setError('');

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
            // Extract hedging ratio based on risk aversion
            const selectedRisk = riskAversionOptions.find(option => option.value === riskAversion);
            const hedgingRatio = selectedRisk?.hedging || 0.25;

            // Calculate parameters for the current spot price
            const params = calculateShortHedgeParameters({
                spotEntryPrice,
                desiredPayout: parsedDesiredPayout,
                availableMargin: parsedAvailableMargin,
                riskAversion,
                twoWeeksVolume
            });

            // Calculate payout scenarios
            const downScenario = calculatePayoutShortDelay(
                params.spotQuantity,
                spotEntryPrice,
                spotEntryPrice * 0.9,
                spotEntryPrice,
                hedgingRatio,
                twoWeeksVolume
            );

            const noChangeScenario = calculatePayoutShortDelay(
                params.spotQuantity,
                spotEntryPrice,
                spotEntryPrice,
                spotEntryPrice,
                hedgingRatio,
                twoWeeksVolume
            );

            const upScenario = calculatePayoutShortDelay(
                params.spotQuantity,
                spotEntryPrice,
                spotEntryPrice * 1.1,
                spotEntryPrice,
                hedgingRatio,
                twoWeeksVolume
            );

            setPayoutScenarios({
                low: formatNumber(downScenario.hedgedPayout),
                noChange: formatNumber(noChangeScenario.hedgedPayout),
                high: formatNumber(upScenario.hedgedPayout)
            });

            setCalculatedParams(params);
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

            {/* Available Margin */}
            <label>Spot Entry Price ($)</label>
            <input
                type="number"
                step="any"
                placeholder="Available margin"
                value={availableMargin}
                onChange={(e) => setAvailableMargin(e.target.value)}
            />

            {/* Target Exit Input */}
            <label>Exit Target ( % Price Variation ) </label>
            <input
                type="text" 
                placeholder="+10% or -5%"
                value={targetReturnText}
                onChange={(e) => setTargetReturnText(e.target.value)}
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

            {/* Available Margin */}
            <label>Leverage</label>
            <input
                type="number"
                step="any"
                placeholder="Leverage"
                value={5}
                onChange={(e) => setAvailableMargin(e.target.value)}
            />

            {/* Desired Payout */}
            <label>Desired No-fees Payout ($)</label>
            <input
                type="number"
                step="any"
                placeholder="Desired payout"
                value={desiredPayout}
                onChange={(e) => setDesiredPayout(e.target.value)}
            />
            
            {/* Hedging Ratio */}
            <label>Percentage of my position I want covered : {hedgingRatio} %</label>
            <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={hedgingRatio}
                onChange={(e) => setHedgingRatio(e.target.value)}
            />

            <button onClick={handleCalculateHedge} className='calculate-button'>
                Calculate Hedge
            </button>

            {/* Display Results */}
            {calculatedParams && (
                <div className="results-container">
                    <h2>Calculated Hedge Parameters</h2>
                    <p>Buy <strong>{calculatedParams.spotQuantity}</strong> {symbol.value} spot (${formatNumber(calculatedParams.spotQuantity * spotEntryPrice)}).</p>
                    <p>Short <strong>{calculatedParams.shortQuantity}</strong> {symbol.value} (${formatNumber(calculatedParams.shortQuantity * spotEntryPrice)}) at <strong>{calculatedParams.leverage}x</strong> leverage.</p>
                    <p>Required Margin: <strong>${formatNumber(calculatedParams.marginRequired)}</strong></p>
                    <p>Estimated Fees: <strong>${formatNumber(calculatedParams.fees)}</strong></p>
                    {/* Payout Scenarios */}
                    {payoutScenarios && (
                        <>
                            <h2>What would be my payout if the market doesn't go as expected?</h2>
                            <p>Down scenario (-10%) : <strong>${formatNumber(payoutScenarios.low)}</strong></p>
                            <p>No change scenario (0%) : <strong>${formatNumber(payoutScenarios.noChange)}</strong></p>
                            <p>Up scenario (+10%) : <strong>${formatNumber(payoutScenarios.high)}</strong></p>
                        </>
                        
                    )}
                </div>
            )}


            {/* Error Message */}
            {error && <div className="error-message">⚠️ {error}</div>}
        </div>
    );
};

export default ResultBasedShortHedging;
