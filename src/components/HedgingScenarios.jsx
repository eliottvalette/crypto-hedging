// ===================================
// Hedging Scenarios Calculator
// Main component for calculating and visualizing different
// hedging strategies using spot and futures positions
// ===================================

import { useState, useEffect, useContext } from 'react';
import Select from 'react-select';
import { calculatePayoutFuture, calculatePayoutShort } from '../utils/hedging';
import { getSpotPrice, getFuturesPrice, getAvailableSymbols } from '../utils/data';
import TrendsChart from './TrendsChart';
import { customStyles } from '../utils/config';
import { generateNewTrend } from '../utils/trends';
import { UserContext } from './UserContext';
import { savePosition } from '../utils/firestore';

const HedgingScenarios = () => {
    // ===================================
    // State Management
    // ===================================
    // Strategy States
    const [hedgeType, setHedgeType] = useState('spot');
    const [symbol, setSymbol] = useState({ value: 'BTCUSDT', label: 'BTCUSDT' });
    const [quantity, setQuantity] = useState(1);
    const [hedgingRatio, setHedgingRatio] = useState(0.5);

    // Price States
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [futuresEntryPrice, setFuturesEntryPrice] = useState(0);
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [twoWeeksVolume] = useState(0);

    // Investment States
    const [totalInvested, setTotalInvested] = useState(0);
    const [totalInvestedLong, setTotalInvestedLong] = useState(0);
    const [totalInvestedShort, setTotalInvestedShort] = useState(0);
    const [totalInvestedFuture, setTotalInvestedFuture] = useState(0);
    const [optimalLeverage, setOptimalLeverage] = useState(null);

    // Result States
    const [spotPayouts, setSpotPayouts] = useState({ up: null, down: null, neutral: null });
    const [hedgedPayouts, setHedgedPayouts] = useState({ up: null, down: null, neutral: null });
    const [adjustedPayout, setAdjustedPayout] = useState(null);
    const [originalClosePrice, setOriginalClosePrice] = useState(null);
    const [hedgeClosePrice, setHedgeClosePrice] = useState(null);
    const [bestPayout, setBestPayout] = useState({ bestSpotPayout: 0, bestHedgedPayout: 0 });

    // UI States
    const [error, setError] = useState('');
    const [trend, setTrend] = useState('upTrend');
    const [activeScenario, setActiveScenario] = useState('up');

    const { user } = useContext(UserContext);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // ===================================
    // Utility Functions
    // ===================================
    // Format numbers for display
    const formatNumber = (number) => {
        return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // ===================================
    // Data Fetching Effects
    // ===================================
    // Fetch available trading symbols
    useEffect(() => {
        async function fetchSymbols() {
            const symbols = await getAvailableSymbols();
            const symbolOptions = symbols.map(sym => ({ value: sym, label: sym }));
            setAvailableSymbols(symbolOptions);
        }
        fetchSymbols();
    }, []);

    // Update total invested amount when quantity or price changes
    useEffect(() => {
        setTotalInvested(quantity * spotEntryPrice);
    }, [quantity, spotEntryPrice]);

    // Fetch current market prices
    useEffect(() => {
        async function fetchPrices() {
            try {
                if (hedgeType === 'spot') {
                    const spotPrice = await getSpotPrice(symbol.value);
                    setSpotEntryPrice(parseFloat(spotPrice));
                    setError('');
                } else {
                    const futuresPrice = await getFuturesPrice(symbol.value, setError);
                    if (futuresPrice === null || futuresPrice === undefined) {
                        throw new Error('Futures not available for the selected currency.');
                    }
                    setFuturesEntryPrice(parseFloat(futuresPrice));
                }
            } catch (error) {
                console.error('Error fetching prices:', error);
                setError(error.message);
                setFuturesEntryPrice(0); // Reset futures entry price
            }
        }
        fetchPrices();
    }, [symbol]);

    // ===================================
    // Event Handlers
    // ===================================
    // Handle total invested amount changes
    const handleTotalInvestedChange = (e) => {
        const value = e.target.value.replace(/,/g, ''); // Remove commas
        if (!isNaN(value)) {
            setTotalInvested(parseFloat(value) || 0); // Update state with the numeric value
        }
    };

    // Calculate futures hedging scenarios
    const handleCalculateFuture = () => {
        if (error) {
            console.error('Calculation error:', error);
            return;
        }
    
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
            up: P_spot_achat * 1.10,    // 10% up
            down: P_spot_achat * 0.90,  // 10% down
            neutral: P_spot_achat,      // No change
        };
        const results = {};
    
        Object.entries(scenarios).forEach(([scenario, exitPrice]) => {
            results[scenario] = calculatePayoutFuture(Q, P_spot_achat, P_futures_entree, exitPrice, h, twoWeeksVolume);
        });

        setSpotPayouts({
            up: results.up.spotPayout,
            down: results.down.spotPayout,
            neutral: results.neutral.spotPayout,
        });
    
        setHedgedPayouts({
            up: results.up.hedgedPayout,
            down: results.down.hedgedPayout,
            neutral: results.neutral.hedgedPayout,
        });
    
        setOptimalLeverage(results.neutral.optimalLeverage);
        setTotalInvestedLong(results.neutral.totalInvestedLong);
        setTotalInvestedFuture(results.neutral.totalInvestedFuture);
    };

    // Calculate spot hedging scenarios
    const handleCalculateShort = () => {
        const Q = parseFloat(quantity);
        const P_spot_achat = parseFloat(spotEntryPrice);
        const h = parseFloat(hedgingRatio);
    
        if (isNaN(Q) || isNaN(P_spot_achat) || isNaN(h)) {
            setError('Please enter valid numerical values.');
            return;
        }
    
        if (h < 0 || h > 1) {
            setError('Hedging ratio must be between 0 and 1.');
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
            results[scenario] = calculatePayoutShort(Q, P_spot_achat, exitPrice, h, twoWeeksVolume);
        });

        setSpotPayouts({
            up: results.up.spotPayout,
            down: results.down.spotPayout,
            neutral: results.neutral.spotPayout,
        });
    
        setHedgedPayouts({
            up: results.up.hedgedPayout,
            down: results.down.hedgedPayout,
            neutral: results.neutral.hedgedPayout,
        });
    
        setOptimalLeverage(results.neutral.optimalLeverage);
        setTotalInvestedLong(results.neutral.totalInvestedLong);
        setTotalInvestedShort(results.neutral.totalInvestedShort);
    };

    const handleSavePosition = async () => {
        if (!user) {
            setSaveError('Please log in to save positions');
            return;
        }

        if (!spotEntryPrice || !quantity) {
            setSaveError('Please fill in all required fields');
            return;
        }

        try {
            const positionData = {
                id: Date.now(),
                symbol: symbol.value,
                longPosition: {
                    quantity: parseFloat(quantity),
                    entryPrice: parseFloat(spotEntryPrice),
                    value: parseFloat(quantity) * parseFloat(spotEntryPrice)
                },
                hedgePosition: {
                    type: hedgeType,
                    quantity: hedgeType === 'spot' ? quantity * hedgingRatio : quantity * hedgingRatio,
                    entryPrice: hedgeType === 'spot' ? spotEntryPrice : futuresEntryPrice,
                    leverage: hedgeType === 'spot' ? totalInvestedShort / (quantity * hedgingRatio * spotEntryPrice) : totalInvestedFuture / (quantity * hedgingRatio * futuresEntryPrice),
                    margin: hedgeType === 'spot' ? totalInvestedShort : totalInvestedFuture
                },
                hedgingRatio: hedgingRatio,
                status: 'active',
                LongclosePrice: null,
                HedgeclosePrice: null,
                pnl: null
            };

            await savePosition(user.uid, positionData);
            setSaveSuccess(true);
            setSaveError('');

            // Reset success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        } catch (error) {
            console.error('Error saving position:', error);
            setSaveError('Error saving position. Please try again.');
        }
    };

    // ===================================
    // Component Render
    // ===================================
    return (
        <div className="calculator-container">
            <div className="buttons-container">
                <button
                    className={hedgeType === 'spot' ? 'active' : ''}
                    onClick={() => {setHedgeType('spot'), spotPayouts.up = null}}
                >
                    Short Position
                </button>
                <button
                    className={hedgeType === 'future' ? 'active' : ''}
                    onClick={() => {setHedgeType('future'), spotPayouts.up = null}}
                >
                    Futures Contract
                </button>
                {user && (
                    <button
                        className="save-button"
                        onClick={handleSavePosition}
                        disabled={!spotEntryPrice || !quantity}
                    >
                        Save Position
                    </button>
                )}
            </div>
    
            {hedgeType === 'spot' ? (
                <>
                    <h1>Hedging With Short Position</h1>
                    <label>Currency</label>
                    <Select
                        value={symbol}
                        onChange={setSymbol}
                        options={availableSymbols}
                        className="currency-select"
                        styles={customStyles}
                    />
                    <label>Quantity (Q)</label>
                    <input
                        type="number"
                        placeholder="Quantity (Q)"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value || 0)}
                        min="0"
                        step="1"
                    />
                    <label>Spot Entry Price ($)</label>
                    <input
                        type="text"
                        placeholder="Spot Entry Price ($)"
                        value={spotEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={(e) => setSpotEntryPrice(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                        min="0"
                        step="0.01"
                    />
                    <label>Total Investing Long ($)</label>
                    <input
                        type="text"
                        value={totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={handleTotalInvestedChange} 
                        onBlur={() => setTotalInvested(Number(totalInvested.toFixed(2)))}
                    />
                    <label>Hedging Ratio (h): 
                        <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={hedgingRatio}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= 0 && value <= 1) {
                                    setHedgingRatio(value);
                                }
                            }}
                            className='nested-input'
                        />
                    </label>
                    
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={hedgingRatio}
                        onChange={(e) => setHedgingRatio(parseFloat(e.target.value))}
                    />
                    <button onClick={handleCalculateShort} className='calculate-button'>Calculate</button>
    
                    {spotPayouts.up !== null && (
                        <div className="results-container">
                            <h2>Results for Short Position</h2>
                            <p>Total Invested Long: ${formatNumber(totalInvestedLong)}</p>
                            <p>Total Invested Short: ${formatNumber(totalInvestedShort)} at {formatNumber(optimalLeverage)}x Leverage</p>
                            <div className="results-types-container">
                                <div className={`results-up ${activeScenario === 'up' ? 'active' : ''}`} onClick={() => { setTrend('upTrend'); setActiveScenario('up'); }}>
                                    <h3>Up Scenario (+10%)</h3>
                                    <p className="results-without">No Hedge: ${formatNumber(spotPayouts.up)}</p>
                                    <p>With Hedge: ${formatNumber(hedgedPayouts.up)}</p>
                                </div>
                                <div className={`results-down ${activeScenario === 'down' ? 'active' : ''}`} onClick={() => { setTrend('downTrend'); setActiveScenario('down'); }}>
                                    <h3>Down Scenario (-10%)</h3>
                                    <p className="results-without">No Hedge: ${formatNumber(spotPayouts.down)}</p>
                                    <p>With Hedge: ${formatNumber(hedgedPayouts.down)}</p>
                                </div>
                                <div className={`results-neutral ${activeScenario === 'neutral' ? 'active' : ''}`} onClick={() => { setTrend('sideTrend'); setActiveScenario('neutral'); }}>
                                    <h3>Neutral Scenario (0%)</h3>
                                    <p className="results-without">No Hedge: ${formatNumber(spotPayouts.neutral)}</p>
                                    <p>With Hedge: ${formatNumber(hedgedPayouts.neutral)}</p>
                                </div>
                            </div>
                            <h2 className="second-title">Stock Trend Simualtion</h2>
                            <TrendsChart 
                                className="trends-chart" 
                                symbol={symbol.value}
                                trend={trend} 
                                quantity={quantity} 
                                hedgingRatio={parseFloat(hedgingRatio)} 
                                type={'spot'} 
                                spotEntryPrice={spotEntryPrice}
                                futuresEntryPrice={futuresEntryPrice}
                                generateNewTrend={generateNewTrend}
                                setAdjustedPayout={setAdjustedPayout}
                                setOriginalClosePrice={setOriginalClosePrice}
                                setHedgeClosePrice={setHedgeClosePrice}
                                setBestPayout= {setBestPayout}
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
                </>
            ) : (
                <>
                    <h1>Futures Hedging Calculator</h1>
                    <label>Currency</label>
                    <Select
                        value={symbol}
                        onChange={setSymbol}
                        options={availableSymbols}
                        className="currency-select"
                        styles={customStyles}
                    />
                    <label>Quantity (Q)</label>
                    <input
                        type="number"
                        placeholder="Quantity (Q)"
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                    />
                    <label>Spot Entry Price ($)</label>
                    <input
                        type="text"
                        placeholder="Spot Entry Price ($)"
                        value={spotEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={(e) => setSpotEntryPrice(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                        min="0"
                        step="0.01"
                    />
                    <label>Total Investing Long ($)</label>
                    <input
                        type="text"
                        value={totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={handleTotalInvestedChange} 
                        onBlur={() => setTotalInvested(Number(totalInvested.toFixed(2)))}
                    />
                    <label>Futures Entry Price ($)</label>
                    <input
                        type="text"
                        placeholder="Futures Entry Price ($)"
                        value={futuresEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={(e) => {
                            const value = e.target.value.replace(/,/g, ''); // Remove commas for parsing
                            if (!isNaN(value)) {
                                setFuturesEntryPrice(parseFloat(value) || 0); // Update state
                            }
                        }}
                        onBlur={() => setFuturesEntryPrice(Number(futuresEntryPrice.toFixed(2)))} // Reapply formatting
                    />
                    <label>Hedging Ratio (h): 
                        <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={hedgingRatio}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= 0 && value <= 1) {
                                    setHedgingRatio(value);
                                }
                            }}
                            className='nested-input'
                        /></label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={hedgingRatio}
                            onChange={(e) => setHedgingRatio(parseFloat(e.target.value))}
                        />
                    <button onClick={handleCalculateFuture} className='calculate-button'>Calculate</button>
    
                    {spotPayouts.up !== null && (
                        <div className="results-container">
                            <h2>Futures Hedging Results</h2>
                            <p>Total Invested Long: ${formatNumber(totalInvestedLong)}</p>
                            <p>Total Invested Short: ${formatNumber(totalInvestedFuture)} at {formatNumber(optimalLeverage)}x Leverage</p>
                            <div className="results-types-container">
                                <>
                                    <div className={`results-up ${activeScenario === 'up' ? 'active' : ''}`} onClick={() => { setTrend('upTrend'); setActiveScenario('up'); }}>
                                        <h3>Up Scenario (+10%)</h3>
                                        <p className="results-without">No Hedge: ${formatNumber(spotPayouts.up)}</p>
                                        <p>With Hedge: ${formatNumber(hedgedPayouts.up)}</p>
                                    </div>
                                    <div className={`results-down ${activeScenario === 'down' ? 'active' : ''}`} onClick={() => { setTrend('downTrend'); setActiveScenario('down'); }}>
                                        <h3>Down Scenario (-10%)</h3>
                                        <p className="results-without">No Hedge: ${formatNumber(spotPayouts.down)}</p>
                                        <p>With Hedge: ${formatNumber(hedgedPayouts.down)}</p>
                                    </div>
                                    <div className={`results-neutral ${activeScenario === 'neutral' ? 'active' : ''}`} onClick={() => { setTrend('sideTrend'); setActiveScenario('neutral'); }}>
                                        <h3>Neutral Scenario (0%)</h3>
                                        <p className="results-without">No Hedge: ${formatNumber(spotPayouts.neutral)}</p>
                                        <p>With Hedge: ${formatNumber(hedgedPayouts.neutral)}</p>
                                    </div>
                                </>
                            </div>
                            <h2 className="second-title">Stock Trend Simualtion</h2>
                            <TrendsChart 
                                className="trends-chart" 
                                symbol={symbol.value}
                                trend={trend} 
                                quantity={quantity} 
                                hedgingRatio={hedgingRatio} 
                                type={hedgeType} 
                                spotEntryPrice={spotEntryPrice}
                                futuresEntryPrice={futuresEntryPrice}
                                generateNewTrend={generateNewTrend}
                                setAdjustedPayout={setAdjustedPayout}
                                setOriginalClosePrice={setOriginalClosePrice}
                                setHedgeClosePrice={setHedgeClosePrice}
                                setBestPayout={setBestPayout}
                            />
                            {adjustedPayout ? (
                            <div className="adjusted-payout">
                                <h3>Adjusted Payout Calculation</h3>
                                <p>Long Close Price: ${formatNumber(originalClosePrice)}</p>
                                <p>Close Future Position: ${formatNumber(hedgeClosePrice)}</p>
                                <h4>If you had closed those positions, your final payout would have been: <br/>${formatNumber(adjustedPayout)}</h4>
                                <h3>Best Possible payouts</h3>
                                <p>Best Spot Payout: ${formatNumber(bestPayout.bestSpotPayout)}</p>
                                <p>Best Hedged Payout: ${formatNumber(bestPayout.bestHedgedPayout)}</p>
                            </div>
                            ) :(
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
                </>
            )}
    
            {error && <div className="error-message">{error}</div>}
            {saveError && <div className="error-message">{saveError}</div>}
            {saveSuccess && <div className="success-message">Position saved successfully!</div>}
        </div>
    );
};

export default HedgingScenarios;