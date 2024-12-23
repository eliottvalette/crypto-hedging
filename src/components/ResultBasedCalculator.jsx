// ===================================
// Result Based Short Hedging Calculator
// Main component for calculating and displaying hedging parameters
// based on user-defined target results
// ===================================

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { calculateShortHedgeParameters, calculateUsingParams } from '../utils/hedging';
import { getSpotPrice, getAvailableSymbols } from '../utils/data';
import { customStyles } from '../utils/config';
import TrendsChart from './TrendsChart';
import { generateNewTrend } from '../utils/trends';

const ResultBasedShortHedging = () => {
    // ===================================
    // State Management
    // ===================================
    // Input States
    const [expectedVariationText, setExpectedVariationText] = useState('+10%');
    const [expectedVariation, setExpectedVariation] = useState(10);
    const [availableMargin, setAvailableMargin] = useState('2000');
    const [leverage, setLeverage] = useState('5');
    const [desiredPayout, setDesiredPayout] = useState('100');
    const [calculatedParams, setCalculatedParams] = useState(null);
    const [hedgingRatio, setHedgingRatio] = useState(50);

    // Market Data States
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [symbol, setSymbol] = useState({ value: 'BTCUSDT', label: 'BTCUSDT' });
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [twoWeeksVolume] = useState(0);

    // UI States
    const [error, setError] = useState('');
    const [payoutScenarios, setPayoutScenarios] = useState({low:null, noChange:null, high:null});
    const [isLeverageRegistred, setIsLeverageRegistred] = useState(false);
    const [trend, setTrend] = useState('upTrend');

    // Result States
    const [adjustedPayout, setAdjustedPayout] = useState(null);
    const [originalClosePrice, setOriginalClosePrice] = useState(null);
    const [hedgeClosePrice, setHedgeClosePrice] = useState(null);
    const [bestPayout, setBestPayout] = useState({ bestSpotPayout: 0, bestHedgedPayout: 0 });

    // ===================================
    // Data Fetching Effects
    // ===================================
    // Fetch available trading symbols
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

    // Fetch current spot price when symbol changes
    useEffect(() => {
        async function fetchPrices() {
            try {
                const spotPrice = await getSpotPrice(symbol.value, 'binance');
                setSpotEntryPrice(parseFloat(spotPrice));

                setError('');
            } catch (error) {
                console.error('Error fetching prices:', error);
                setError(error.message);
            }
        }
        fetchPrices();
    }, [symbol]);

    // ===================================
    // Utility Functions
    // ===================================
    // Format expected variation from text input
    const formatExpectedVariation = (value) => {
        // tranform ±10% to 10 or -10
        const sign = value[0] === '-' ? -1 : 1;
        return sign * parseFloat(value.slice(1));
    };

    // Format number display
    const formatNumber = (number) => {
        if (number < 0.01 && number > 0) return number.toExponential(2);
        return parseFloat(number).toFixed(3);
    };

    const formatPreciseNumber = (number) => {
        if (number < 0.001 && number > 0) return number.toExponential(2);
        return parseFloat(number).toFixed(6);
    };

    // ===================================
    // Event Handlers
    // ===================================
    // Handle variation text changes
    useEffect(() => {
        setExpectedVariation(formatExpectedVariation(expectedVariationText));
    }, [expectedVariationText]);

    // Calculate hedge parameters
    const handleCalculateHedge = () => {
        setError('');

        const parsedexpectedVariation = parseFloat(expectedVariation);
        const parsedDesiredPayout = parseFloat(desiredPayout);
        const parsedAvailableMargin = parseFloat(availableMargin);
        const parsedLeverage = parseFloat(leverage);

        if (
            isNaN(parsedexpectedVariation) ||
            isNaN(parsedDesiredPayout) ||
            isNaN(parsedAvailableMargin) ||
            isNaN(spotEntryPrice)
        ) {
            setError('Please enter valid numerical values in all fields.');
            return;
        }

        try {
            // Calculate parameters for the current spot price
            const params = calculateShortHedgeParameters({
                spotEntryPrice: spotEntryPrice,
                expectedVariation: parsedexpectedVariation,
                availableMargin: parsedAvailableMargin,
                leverage: parsedLeverage,
                desiredPayout: parsedDesiredPayout,
                hedgingRatio: hedgingRatio,
                twoWeeksVolume: twoWeeksVolume,
                isLeverageRegistred: isLeverageRegistred,
                setError: setError
            });

            // Calculate payout scenarios
            const downScenario = calculateUsingParams(
                params.spotQuantity,
                params.shortQuantity,
                params.leverage,
                params.fees,
                params.requiredMargin,
                -10,
                twoWeeksVolume,
                spotEntryPrice
            );

            const noChangeScenario = calculateUsingParams(
                params.spotQuantity,
                params.shortQuantity,
                params.leverage,
                params.fees,
                params.requiredMargin,
                0,
                twoWeeksVolume,
                spotEntryPrice
            );

            const upScenario = calculateUsingParams(
                params.spotQuantity,
                params.shortQuantity,
                params.leverage,
                params.fees,
                params.requiredMargin,
                10,
                twoWeeksVolume,
                spotEntryPrice
            );

            setPayoutScenarios({
                low: downScenario.hedgedPayout,
                noChange: noChangeScenario.hedgedPayout,
                high: upScenario.hedgedPayout
            });

            setCalculatedParams(params);
            
        } catch (err) {
            console.error('Hedge Calculation Error:', err);
            setError(`Calculation failed: ${err.message}`);
        }
    };

    // ===================================
    // Component Render
    // ===================================
    return (
        <div className="result-based-grid calculator-container">
            <h1 className='result-based-h1'>Result-Based Short Hedging</h1>

            {/* Currency Selection */}
            <div className='result-based-currency'>
                <label>Currency</label>
                <Select
                    value={symbol}
                    onChange={setSymbol}
                    options={availableSymbols}
                    className="currency-select"
                    styles={customStyles}
                />
            </div>

            {/* Spot Entry Price */}
            <div className='result-based-spot-entry' >
                <label>Spot Entry Price ($)</label>
                <input
                    type="number"
                    step="any"
                    placeholder="Available margin"
                    value={spotEntryPrice}
                    onChange={(e) => setSpotEntryPrice(e.target.value)}
                />
            </div>

            {/* Target Exit Input */}
            <div className='result-based-exit-target'>
                <label>Exit Target ( % Price Variation ) </label>
                <input
                    type="text" 
                    placeholder="+10% or -5%"
                    value={expectedVariationText}
                    onChange={(e) => setExpectedVariationText(e.target.value)}
                />
            </div>

            {/* Available Margin */}
            <div className={`result-based-margin ${!isLeverageRegistred ? 'used' : 'not-used'}`} onClick={() => setIsLeverageRegistred(false)}>
                <label>Available Margin ($)</label>
                <input
                    type="number"
                    step="any"
                    placeholder="Available margin"
                    value={availableMargin}
                    onChange={(e) => setAvailableMargin(e.target.value)}
                    onClick={() => setIsLeverageRegistred(false)}
                />
            </div>

            {/* Leverage */}
            <div className={`result-based-leverage ${isLeverageRegistred ? 'used' : 'not-used'}`} onClick={() => setIsLeverageRegistred(true)}>
                <label>Leverage</label>
                <input
                    type="number"
                    step="any"
                    placeholder="Leverage"
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                />
            </div>

            {/* Desired Payout */}
            <div className='result-based-payout'>
                <label>Desired No-fees Payout ($)</label>
                <input
                    type="number"
                    step="any"
                    placeholder="Desired payout"
                    value={desiredPayout}
                    onChange={(e) => setDesiredPayout(e.target.value)}
                />
            </div>
            
            {/* Hedging Ratio */}
            <div className='result-based-ratio'>
                <label>Percentage of my position I want covered :
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={hedgingRatio}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0 && value <= 100) {
                                setHedgingRatio(value);
                            }
                        }}
                        className='nested-input'
                    /> %
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={hedgingRatio}
                    onChange={(e) => setHedgingRatio(parseFloat(e.target.value))}
                />
                    
            </div>

            <button onClick={handleCalculateHedge} className='calculate-button result-based-button'>
                Calculate Hedge
            </button>

            {/* Display Results */}
            {calculatedParams && (
                <div className="results-container">
                    <h2>Calculated Hedge Parameters</h2>
                    <p>Buy <strong>{formatPreciseNumber(calculatedParams.spotQuantity)}</strong> {symbol.value} spot (${formatNumber(calculatedParams.spotQuantity * spotEntryPrice)}).</p>
                    <p>Short <strong>{formatPreciseNumber(calculatedParams.shortQuantity)}</strong> {symbol.value} (${formatNumber(calculatedParams.shortQuantity * spotEntryPrice)}) at <strong>{calculatedParams.leverage.toFixed(4)}x</strong> leverage.</p>
                    <p>Estimated Fees: <strong>${formatNumber(calculatedParams.fees)}</strong></p>
                    {isLeverageRegistred && <p>Required Margin : <strong>${formatNumber(calculatedParams.requiredMargin)}</strong></p>}
                    {/* Payout Scenarios */}
                    {payoutScenarios && (
                        <>
                            <h2>What would be my payout if the market doesn't go as expected?</h2>
                            <div className="results-types-container">
                                <div className={`results-down ${trend === 'downTrend' ? 'active' : ''}`} onClick={() => setTrend('downTrend')}>
                                    <h3>Down Scenario (-10%)</h3>
                                    <p className="results-without">No Hedge: ${formatNumber(payoutScenarios.low)}</p>
                                    <p>With Hedge: ${formatNumber(payoutScenarios.low)}</p>
                                </div>
                                <div className={`results-neutral ${trend === 'sideTrend' ? 'active' : ''}`} onClick={() => setTrend('sideTrend')}>
                                    <h3>Neutral Scenario (0%)</h3>
                                    <p className="results-without">No Hedge: ${formatNumber(payoutScenarios.noChange)}</p>
                                    <p>With Hedge: ${formatNumber(payoutScenarios.noChange)}</p>
                                </div>
                                <div className={`results-up ${trend === 'upTrend' ? 'active' : ''}`} onClick={() => setTrend('upTrend')}>
                                    <h3>Up Scenario (+10%)</h3>
                                    <p className="results-without">No Hedge: ${formatNumber(payoutScenarios.high)}</p>
                                    <p>With Hedge: ${formatNumber(payoutScenarios.high)}</p>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* Add TrendsChart */}
                    <h2 className="second-title">Stock Trend Simulation</h2>
                    <TrendsChart 
                        className="trends-chart" 
                        symbol={symbol.value}
                        trend={trend} 
                        quantity={parseFloat(calculatedParams.spotQuantity)} 
                        hedgingRatio={hedgingRatio} 
                        type="result-based" 
                        spotEntryPrice={spotEntryPrice}
                        futuresEntryPrice={spotEntryPrice}
                        generateNewTrend={generateNewTrend}
                        setAdjustedPayout={setAdjustedPayout}
                        setOriginalClosePrice={setOriginalClosePrice}
                        setHedgeClosePrice={setHedgeClosePrice}
                        setBestPayout={setBestPayout}
                        params={{
                            spotQuantity: calculatedParams.spotQuantity,
                            shortQuantity: calculatedParams.shortQuantity,
                            leverage: calculatedParams.leverage,
                            fees: calculatedParams.fees,
                            requiredMargin: calculatedParams.requiredMargin
                        }}
                    />
                    {adjustedPayout ? (
                        <div className="adjusted-payout">
                            <h3>Adjusted Payout Calculation</h3>
                            <p>Long Close Price: ${formatNumber(originalClosePrice)}</p>
                            <p>Hedge Close Price: ${formatNumber(hedgeClosePrice)}</p>
                            <h4>If you had closed those positions, your final payout would have been: <br/>${formatNumber(adjustedPayout)}</h4>
                            <h3>Best Possible payouts</h3>
                            <p>Best Spot Payout: ${formatNumber(bestPayout.bestSpotPayout)}</p>
                            <p>Best Hedged Payout: ${formatNumber(bestPayout.bestHedgedPayout)}</p>
                        </div>
                    ) : (
                        <div className="adjusted-payout">
                            <h3>Adjusted Payout Calculation</h3>
                            <h4><i>(Click the chart to set or update the selected position's close price.)</i></h4>
                            <h3>Best Possible payouts</h3>
                            <p>Best Spot Payout: ${formatNumber(bestPayout.bestSpotPayout)}</p>
                            <p>Best Hedged Payout: ${formatNumber(bestPayout.bestHedgedPayout)}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && <div className="error-message">⚠️ {error}</div>}
        </div>
    );
};

export default ResultBasedShortHedging;
