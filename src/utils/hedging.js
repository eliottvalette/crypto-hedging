// ===================================
// Fee Rate Calculation
// ===================================
// Calculates trading fees based on two weeks trading volume
// Returns an object with taker, maker, and funding fees
function calculateFEE_RATES(twoWeeksVolume) {
    if (twoWeeksVolume < 5_000_000) {
        return {
            takerFee: 0.00035,
            makerFee: 0.0001,
            fundingFee: 0.0
        }
    } else if (twoWeeksVolume < 25_000_000) {
        return {
            takerFee: 0.00030,
            makerFee: 0.00008,
            fundingFee: -0.00001
        }
    } else if (twoWeeksVolume < 100_000_000) {
        return {
            takerFee: 0.00025,
            makerFee: 0.00005,
            fundingFee: -0.00002
        }

    } else if (twoWeeksVolume < 500_000_000) {
        return {
            takerFee: 0.00022,
            makerFee: 0.00004,
            fundingFee: -0.000025
        }
    } else if (twoWeeksVolume < 2_000_000_000) {
        return {
            takerFee: 0.00020,
            makerFee: 0.00001,
            fundingFee: -0.00003
        }
    } else {
        return {
            takerFee: 0.00019,
            makerFee: 0.0,
            fundingFee: -0.00003
        }
    }
}

// ===================================
// Utility Functions
// ===================================
// Formats numbers with 2 decimal places using US locale
function formatNumber(number) {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2});
}

// Calculates trading fees based on quantity, price and fee rate
function calculateFees(quantity, entryPrice, feeRate) {
    return quantity * entryPrice * feeRate;
}

// Calculates combined payout for long and short positions
function calculatePayout(longQuantity, shortQuantity, entryPrice, exitPrice, fees) {
    const longPayout = longQuantity * (exitPrice - entryPrice) - fees.long;
    const shortPayout = shortQuantity * (entryPrice - exitPrice) - fees.short;
    return longPayout + shortPayout;
}

// ===================================
// Futures Hedging Calculations
// ===================================
// Calculates payouts for futures hedging with simultaneous entry/exit
export function calculatePayoutFuture(quantity, spotEntryPrice, futuresEntryPrice, ExitPrice, hedgingRatio, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);
    const Q = parseFloat(quantity) || 1;
    const h = parseFloat(hedgingRatio) || 0;

    if (!Q || !spotEntryPrice || !futuresEntryPrice || !ExitPrice || h < 0 || h > 1) {
        console.log("Invalid inputs for future hedging calculation:", { quantity, spotEntryPrice, futuresEntryPrice, ExitPrice, hedgingRatio, twoWeeksVolume });
        console.error("Invalid inputs for future hedging calculation:", { Q, spotEntryPrice, futuresEntryPrice, ExitPrice, hedgingRatio });
        return { spotPayout: 0, hedgedPayout: 0, optimalLeverage: 0, totalInvestedLong: 0, totalInvestedFuture: 0 };
    }

    // Long futures
    const Q_long = Q ;
    const totalInvestedLong = Q_long * futuresEntryPrice;
    const longFees = calculateFees(Q, futuresEntryPrice, fees.takerFee);

    // Hedged futures
    const Q_short = Q * h ;
    const totalInvestedFuture = Q_short * futuresEntryPrice;
    const shortFees = calculateFees(Q_short, futuresEntryPrice, fees.takerFee);

    // Combined payout
    const hedgedPayout = calculatePayout(Q_long, Q_short, futuresEntryPrice, ExitPrice, { long: longFees, short: shortFees });
    const optimalLeverage = totalInvestedFuture / (Q_short * futuresEntryPrice);

    return {
        spotPayout: formatNumber(Q_long * (ExitPrice - futuresEntryPrice) - longFees),
        hedgedPayout: formatNumber(hedgedPayout),
        optimalLeverage: formatNumber(optimalLeverage),
        totalInvestedLong: formatNumber(totalInvestedLong),
        totalInvestedFuture: formatNumber(totalInvestedFuture),
    };
}

// Calculates payouts for futures hedging with different exit times
export function calculatePayoutFutureDelay(quantity, spotEntryPrice, futuresEntryPrice, longExitPrice, futureExitPrice, hedgingRatio, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);
    const Q = parseFloat(quantity) || 1;
    const hedgingRatioFloat = parseFloat(hedgingRatio) || 0;

    if (!Q || !spotEntryPrice || !futuresEntryPrice || !longExitPrice || !futureExitPrice || hedgingRatioFloat < 0 || hedgingRatioFloat > 1) {
        console.error("Invalid inputs for delayed future payout calculation:", { Q, spotEntryPrice, futuresEntryPrice, longExitPrice, futureExitPrice, hedgingRatio });
        return { spotPayout: 0, hedgedPayout: 0 };
    }

    // Long futures
    const Q_long = Q;
    const spotPayout = Q_long * (longExitPrice - futuresEntryPrice) - Q * futuresEntryPrice * fees.takerFee;

    // Hedged futures
    const Q_short = Q * hedgingRatioFloat;
    const shortPayout = Q_short * (futuresEntryPrice - futureExitPrice) - Q_short * futuresEntryPrice * fees.takerFee;

    // Combined payout
    const hedgedPayout = spotPayout + shortPayout;

    return {
        spotPayout: formatNumber(spotPayout),
        hedgedPayout: formatNumber(hedgedPayout),
    };
}

// ===================================
// Spot Hedging Calculations
// ===================================
// Calculates payouts for spot hedging with simultaneous entry/exit
export function calculatePayoutShort(quantity, spotEntryPrice, spotExitPrice, hedgingRatio, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);

    const Q = parseFloat(quantity) || 1;
    const P_spot_achat = parseFloat(spotEntryPrice) || 1;
    const P_spot_vente = parseFloat(spotExitPrice) || 1;
    const h = parseFloat(hedgingRatio) || 0.03; // Default hedging ratio

    if (!Q || !P_spot_achat || !P_spot_vente || h < 0 || h > 1) {
        console.error("Invalid inputs for short hedging calculation:", { Q, P_spot_achat, P_spot_vente, h });
        return { spotPayout: 0, hedgedPayout: 0, optimalLeverage: 0, totalInvestedLong: 0, totalInvestedShort: 0 };
    }

    // Long position details
    const Q_long = Q;
    const totalInvestedLong = Q_long * P_spot_achat;
    const P_L_long = Q_long * (P_spot_vente - P_spot_achat);

    // Short position details
    const Q_short = Q * h; // Shorted quantity based on hedging ratio
    const totalInvestedShort = Q_short * P_spot_achat;
    const P_L_short = Q_short * (P_spot_achat - P_spot_vente); // Short position P&L

    // Fees
    const Frais_long = Q * P_spot_achat * fees.takerFee; // Fees for the long position
    const Frais_short = Q_short * P_spot_achat * fees.takerFee; // Fees for the short position

    // Adjusted Payout
    const spotPayout = P_L_long - Frais_long;
    const shortPayout = P_L_short - Frais_short;

    // Hedged Payout (Long + Short - Fees)
    const hedgedPayout = spotPayout + shortPayout;

    // Optimal Leverage for Short
    const optimalLeverage = totalInvestedShort / (Q_short * P_spot_achat);

    return {
        spotPayout: formatNumber(spotPayout),
        hedgedPayout: formatNumber(hedgedPayout),
        optimalLeverage: formatNumber(optimalLeverage),
        totalInvestedLong: formatNumber(totalInvestedLong),
        totalInvestedShort: formatNumber(totalInvestedShort),
    };
}

// Calculates payouts for spot hedging with different exit times
export function calculatePayoutShortDelay(Q, P_spot_achat, LongClose, ShortClose, h, twoWeeksVolume) {    
    const fees = calculateFEE_RATES(twoWeeksVolume);

    const Q_long = Q;
    const P_L_long = Q_long * (LongClose - P_spot_achat);

    const Q_short = Q * h ;
    const P_L_short = Q_short * (P_spot_achat - ShortClose);

    const Frais_long = Q * P_spot_achat * fees.takerFee; // Fees for the long position
    const Frais_short = Q_short * P_spot_achat * fees.takerFee; // Fees for the short position

    // Adjusted Payout
    const spotPayout = P_L_long - Frais_long;
    const shortPayout = P_L_short - Frais_short;

    return {
        spotPayout: spotPayout,
        hedgedPayout: shortPayout + spotPayout,
    };
}

// ===================================
// Optimization and Analysis Functions
// ===================================
// Calculates the best possible payout based on historical price data
export const calculateBestPayout = (seriesData, type, quantity, spot_entry_price, futures_entry_price, hedgingRatio, twoWeeksVolume, params={}) => {
    if (!seriesData || seriesData.length === 0) {
        console.error("Empty or invalid seriesData");
        return { bestSpotPayout: 0, bestHedgedPayout: 0 };
    }

    const Q = parseFloat(quantity) || 1;
    const h = parseFloat(hedgingRatio) || 0.03;
    const P_spot_achat = parseFloat(spot_entry_price) || 1;

    const closingPrices = seriesData.map(dataPoint => parseFloat(dataPoint.y[3]));
    const highestClose = Math.max(...closingPrices); // Close Long at this price
    const lowestClose = Math.min(...closingPrices); // Close Short at this price

    if (isNaN(highestClose) || isNaN(lowestClose)) {
        console.error("Invalid closing prices:", { highestClose, lowestClose });
        return { bestSpotPayout: 0, bestHedgedPayout: 0 };
    }

    let bestSpotPayout = 0;
    let bestHedgedPayout = 0;

    if (type === 'spot') {
        ({ spotPayout: bestSpotPayout, hedgedPayout: bestHedgedPayout } = calculatePayoutShortDelay(
            Q,
            P_spot_achat,
            highestClose,
            lowestClose,
            h,
            twoWeeksVolume
        ));
    } else if (type === 'future') {
        ({ spotPayout: bestSpotPayout, hedgedPayout: bestHedgedPayout } = calculatePayoutFutureDelay(
            quantity,
            spot_entry_price,
            futures_entry_price,
            highestClose,
            lowestClose,
            hedgingRatio,
            twoWeeksVolume
        ));
    } else if (type === 'result-based' && params) {
        ({ spotPayout: bestSpotPayout, hedgedPayout: bestHedgedPayout } = calculateUsingParamsDelay(
            params.spotQuantity,
            params.shortQuantity,
            params.leverage,
            params.fees,
            params.requiredMargin,
            highestClose,
            lowestClose,
            twoWeeksVolume,
            spot_entry_price
        ));
    }

    return {
        bestSpotPayout: formatNumber(bestSpotPayout),
        bestHedgedPayout: formatNumber(bestHedgedPayout)
    };
};

// Calculates optimal parameters for short hedging strategy
export function calculateShortHedgeParameters({
    spotEntryPrice,
    expectedVariation,
    availableMargin,
    leverage,
    desiredPayout,
    hedgingRatio,
    twoWeeksVolume,
    isLeverageRegistred,
    setError
}) {
    // Convert inputs to floats and validate
    spotEntryPrice = parseFloat(spotEntryPrice);
    expectedVariation = parseFloat(expectedVariation);
    availableMargin = parseFloat(availableMargin);
    leverage = parseFloat(leverage);
    desiredPayout = parseFloat(desiredPayout);
    hedgingRatio = parseFloat(hedgingRatio / 100);

    // Ensure hedging ratio is within valid bounds
    if (hedgingRatio < 1e-3) {
        hedgingRatio = 1e-3;
      } else if (hedgingRatio > 1 - 1e-3) {
        hedgingRatio = 1 - 1e-3;
      }
      

    if (!spotEntryPrice || !expectedVariation || !desiredPayout) {
        setError('Invalid input parameters');
        return {
            spotQuantity: 0,
            shortQuantity: 0,
            leverage: 0,
            fees: 0,
            requiredMargin: 0,
            expectedPayout: 0
        };
    }

    const fees = calculateFEE_RATES(twoWeeksVolume);
    const totalFees = fees.takerFee * 2; // Entry and exit fees

    // Calculate the required spot position size
    const priceChangePercent = expectedVariation / 100;
    const Q_spot = (desiredPayout + (spotEntryPrice * totalFees)) / (spotEntryPrice * priceChangePercent);
    
    // Calculate the short position size based on hedging ratio
    const Q_short = Q_spot * hedgingRatio;

    // Calculate position values
    const totalInvestedLong = Q_spot * spotEntryPrice;
    const shortPositionValue = Q_short * spotEntryPrice;

    // Calculate leverage and margin for the short position
    let requiredMargin;
    if (isLeverageRegistred) {
        requiredMargin = shortPositionValue / leverage;
    } else {
        requiredMargin = availableMargin;
        leverage = shortPositionValue / availableMargin ;
    }

    // Calculate expected P&L at different price points
    const exitPrice = spotEntryPrice * (1 + priceChangePercent);
    const longPnL = Q_spot * (exitPrice - spotEntryPrice);
    const shortPnL = Q_short * (spotEntryPrice - exitPrice);
    const totalFeesCost = (totalInvestedLong + shortPositionValue) * totalFees;
    const expectedTotalPnL = longPnL + shortPnL - totalFeesCost;

    
    return {
        spotQuantity: Q_spot,
        shortQuantity: Q_short,
        leverage: leverage,
        fees: totalFeesCost,
        requiredMargin: requiredMargin,
        expectedPayout: expectedTotalPnL
    };
}

// ===================================
// Parameter-Based Calculations
// ===================================
// Calculates hedging results using predefined parameters for simultaneous entry/exit
export function calculateUsingParams(
    spotQuantity,
    shortQuantity,
    leverage,
    fees,
    requiredMargin,
    priceVariation,
    twoWeeksVolume,
    spotEntryPrice
) {
    const feeRates = calculateFEE_RATES(twoWeeksVolume);
    const totalFees = feeRates.takerFee * 2; // Entry and exit fees

    // Calculate price change based on variation percentage
    const exitPrice = spotEntryPrice * (1 + priceVariation / 100);

    // Calculate P&L for long position
    const longPnL = spotQuantity * (exitPrice - spotEntryPrice);

    // Calculate P&L for short position
    const shortPnL = shortQuantity * (spotEntryPrice - exitPrice);

    // Calculate total fees
    const totalInvestedLong = spotQuantity * spotEntryPrice;
    const shortPositionValue = shortQuantity * spotEntryPrice;
    const totalFeesCost = (totalInvestedLong + shortPositionValue) * totalFees;

    // Calculate total payout
    const spotPayout = longPnL - (totalInvestedLong * totalFees);
    const hedgedPayout = longPnL + shortPnL - totalFeesCost;

    return {
        spotQuantity: spotQuantity,
        shortQuantity: shortQuantity,
        spotPayout: spotPayout,
        hedgedPayout: hedgedPayout,
        leverage: leverage,
        requiredMargin: requiredMargin,
        fees: totalFeesCost
    };
}

// Calculates hedging results using predefined parameters for different exit times
export function calculateUsingParamsDelay(
    spotQuantity,
    shortQuantity,
    leverage,
    fees,
    requiredMargin,
    longClosePrice,
    shortClosePrice,
    twoWeeksVolume,
    spotEntryPrice
) {
    const feeRates = calculateFEE_RATES(twoWeeksVolume);
    const totalFees = feeRates.takerFee * 2; // Entry and exit fees

    // Calculate P&L for long position
    const longPnL = spotQuantity * (longClosePrice - spotEntryPrice);

    // Calculate P&L for short position
    const shortPnL = shortQuantity * (spotEntryPrice - shortClosePrice);

    // Calculate total fees
    const totalInvestedLong = spotQuantity * spotEntryPrice;
    const shortPositionValue = shortQuantity * spotEntryPrice;
    const totalFeesCost = (totalInvestedLong + shortPositionValue) * totalFees;

    // Calculate total payout
    const spotPayout = longPnL - (totalInvestedLong * totalFees);
    const hedgedPayout = longPnL + shortPnL - totalFeesCost;

    return {
        spotPayout: spotPayout,
        hedgedPayout: hedgedPayout,
        leverage: leverage,
        requiredMargin: requiredMargin,
        fees: totalFeesCost
    };
}