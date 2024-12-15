import { useState, useEffect } from 'react';
import Select from 'react-select';
import { calculatePayoutFuture, calculatePayoutShort, calculateBestPayout } from '../utils/hedging';
import { getSpotPrice, getFuturesPrice, getAvailableSymbols } from '../utils/data';
import TrendsChart from './TrendsChart';
import { customStyles } from '../utils/config';
import { generateNewTrend } from '../utils/trends';

const HedgingScenarios = () => {
    const [hedgeType, setHedgeType] = useState('spot');
    const [symbol, setSymbol] = useState({ value: 'BTCUSDT', label: 'BTCUSDT' });
    const [quantity, setQuantity] = useState(1);
    const [spotEntryPrice, setSpotEntryPrice] = useState(0);
    const [futuresEntryPrice, setFuturesEntryPrice] = useState(0);
    const [hedgingRatio, setHedgingRatio] = useState(0.03);
    const [platform, setPlatform] = useState('Binance');
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [spotPayouts, setSpotPayouts] = useState({ up: null, down: null, neutral: null });
    const [hedgedPayouts, setHedgedPayouts] = useState({ up: null, down: null, neutral: null });
    const [optimalLeverage, setOptimalLeverage] = useState(null);
    const [error, setError] = useState('');
    const [marginRate, setMarginRate] = useState(0.1);
    const [trend, setTrend] = useState('upTrend');
    const [totalInvested, setTotalInvested] = useState(0);
    const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
    const [riskAversion, setRiskAversion] = useState('medium');
    const [activeScenario, setActiveScenario] = useState('up');
    const [adjustedPayout, setAdjustedPayout] = useState(null);
    const [originalClosePrice, setOriginalClosePrice] = useState(null);
    const [hedgeClosePrice, setHedgeClosePrice] = useState(null);
    const [bestPayout, setBestPayout] = useState({ bestSpotPayout: 0, bestHedgedPayout: 0 });

    const riskAversionOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
    ];

    const formatNumber = (number) => {
        return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    useEffect(() => {
        async function fetchSymbols() {
            const symbols = await getAvailableSymbols();
            const symbolOptions = symbols.map(sym => ({ value: sym, label: sym }));
            setAvailableSymbols(symbolOptions);
        }
        fetchSymbols();
    }, []);

    useEffect(() => {
        setTotalInvested(quantity * spotEntryPrice);
    }, [quantity, spotEntryPrice]);

    useEffect(() => {
        async function fetchPrices() {
            try {
                const spotPrice = await getSpotPrice(symbol.value, platform);
                setSpotEntryPrice(parseFloat(spotPrice));

                const futuresPrice = await getFuturesPrice(symbol.value, platform);
                if (futuresPrice === null || futuresPrice === undefined) {
                    throw new Error('Futures not available for the selected currency.');
                }
                setFuturesEntryPrice(parseFloat(futuresPrice));
                setError('');
            } catch (error) {
                console.error('Error fetching prices:', error);
                setError(error.message);
                setFuturesEntryPrice(0); // Reset futures entry price
            }
        }
        fetchPrices();
    }, [symbol, platform]);

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
            results[scenario] = calculatePayoutFuture(Q, P_spot_achat, P_futures_entree, exitPrice, exitPrice, h, twoWeeksVolume);
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
    
        setTotalInvested(results.neutral.totalInvested);
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
            results[scenario] = calculatePayoutShort(Q, P_spot_achat, exitPrice, h, margin, twoWeeksVolume);
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
        setTotalInvested(results.neutral.totalInvested);
    };

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
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                        step="1"
                    />
                    <label>Spot Entry Price ($)</label>
                    <input
                        type="number"
                        placeholder="Spot Entry Price ($)"
                        value={spotEntryPrice}
                        onChange={(e) => setSpotEntryPrice(e.target.value)}
                        min="0"
                        step="0.01"
                    />
                    <label>Total Invested ($)</label>
                    <input
                        type="number"
                        value={totalInvested}
                        readOnly
                    />
                    <label>Margin Rate: {marginRate}</label>
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
                    <label>Risk Aversion</label>
                    <Select
                        value={riskAversionOptions.find(option => option.value === riskAversion)}
                        onChange={(option) => setRiskAversion(option.value)}
                        options={riskAversionOptions}
                        className="currency-select"
                        styles={customStyles}
                    />
                    <button onClick={handleCalculateShort} className='calculate-button'>Calculate</button>
    
                    {spotPayouts.up !== null && (
                        <div className="results-container">
                            <h2>Results for Short Position</h2>
                            <p>Optimal Leverage: {formatNumber(optimalLeverage)}</p>
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
                            <h3>Stock Trend Simualtion</h3>
                            <TrendsChart 
                            className="trends-chart" 
                            symbol={symbol.value}
                            trend={trend} 
                            quantity={quantity} 
                            hedgingRatio={hedgingRatio} 
                            type={'spot'} 
                            marginRate={marginRate} 
                            spotEntryPrice={spotEntryPrice}
                            futuresEntryPrice={futuresEntryPrice}
                            generateNewTrend={generateNewTrend}
                            setAdjustedPayout={setAdjustedPayout}
                            setOriginalClosePrice={setOriginalClosePrice}
                            setHedgeClosePrice={setHedgeClosePrice}
                            setBestPayout= {setBestPayout}
                            />
                            {adjustedPayout && (
                            <div>
                                <h3>Optimal Payout Calculation</h3>
                                <p>Long Close Price: ${formatNumber(originalClosePrice)}</p>
                                <p>Hedge Close Price: ${formatNumber(hedgeClosePrice)}</p>
                                <h4>Payout: ${formatNumber(adjustedPayout)}</h4>
                                <h4>Best Spot Payout: ${formatNumber(bestPayout.bestSpotPayout)}</h4>
                                <h4>Best Hedged Payout: ${formatNumber(bestPayout.bestHedgedPayout)}</h4>
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
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                        step="1"
                    />
                    <label>Spot Entry Price ($)</label>
                    <input
                        type="number"
                        placeholder="Spot Entry Price ($)"
                        value={spotEntryPrice}
                        onChange={(e) => setSpotEntryPrice(e.target.value)}
                        min="0"
                        step="0.01"
                    />
                    <label>Total Invested ($)</label>
                    <input
                        type="number"
                        value={totalInvested}
                        readOnly
                    />
                    <label>Futures Entry Price ($)</label>
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
                    <label>Risk Aversion</label>
                    <Select
                        value={riskAversionOptions.find(option => option.value === riskAversion)}
                        onChange={(option) => setRiskAversion(option.value)}
                        options={riskAversionOptions}
                        className="currency-select"
                        styles={customStyles}
                    />
                    <button onClick={handleCalculateFuture} className='calculate-button'>Calculate</button>
    
                    {spotPayouts.up !== null && (
                        <div className="results-container">
                            <h2>Futures Hedging Results</h2>
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
                            <TrendsChart 
                            className="trends-chart" 
                            symbol={symbol.value}
                            trend={trend} 
                            quantity={quantity} 
                            hedgingRatio={hedgingRatio} 
                            type={'future'} 
                            marginRate={marginRate} 
                            spotEntryPrice={spotEntryPrice}
                            futuresEntryPrice={futuresEntryPrice}
                            generateNewTrend={generateNewTrend}
                            setAdjustedPayout={setAdjustedPayout}
                            setOriginalClosePrice={setOriginalClosePrice}
                            setHedgeClosePrice={setHedgeClosePrice}
                            setBestPayout= {setBestPayout}
                            />
                            {adjustedPayout && (
                            <div>
                                <h3>Optimal Payout Calculation</h3>
                                <p>Long Close Price: ${formatNumber(originalClosePrice)}</p>
                                <p>Close Future Position: ${formatNumber(hedgeClosePrice)}</p>
                                <h4>Payout: ${formatNumber(adjustedPayout)}</h4>
                                <h4>Best Spot Payout: ${formatNumber(bestPayout.bestSpotPayout)}</h4>
                                <h4>Best Hedged Payout: ${formatNumber(bestPayout.bestHedgedPayout)}</h4>
                            </div>
                            )}
                        </div>
                    )}
                </>
            )}
    
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default HedgingScenarios;