// hedging.js

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

function formatNumber(number) {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Adjusted Calculate payouts for Futures Hedging
export function calculatePayoutFuture(quantity, spotEntryPrice, futuresEntryPrice, ExitPrice, hedgingRatio, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);
    const Q = parseFloat(quantity) || 1;
    const h = parseFloat(hedgingRatio) || 0;

    if (!Q || !spotEntryPrice || !futuresEntryPrice || !ExitPrice || h < 0 || h > 1) {
        console.error("Invalid inputs for future payout calculation:", { Q, spotEntryPrice, futuresEntryPrice, ExitPrice, hedgingRatio });
        return { spotPayout: 0, hedgedPayout: 0, leverage: 0, totalInvestedLong: 0, totalInvestedFuture: 0 };
    }

    // Long futures
    const Q_long = Q * (1 - h / 2);
    const totalInvestedLong = Q_long * futuresEntryPrice;
    const spotPayout = Q_long * (ExitPrice - futuresEntryPrice) - Q * futuresEntryPrice * fees.takerFee;

    // Hedged futures
    const Q_short = Q * h / 2;
    const totalInvestedFuture = Q_short * futuresEntryPrice;
    const shortPayout = Q_short * (futuresEntryPrice - ExitPrice) - Q_short * futuresEntryPrice * fees.takerFee;

    // Combined payout
    const hedgedPayout = spotPayout + shortPayout;
    const optimalLeverage = totalInvestedFuture / (Q_short * futuresEntryPrice);

    return {
        spotPayout: formatNumber(spotPayout),
        hedgedPayout: formatNumber(hedgedPayout),
        optimalLeverage: formatNumber(optimalLeverage),
        totalInvestedLong: formatNumber(totalInvestedLong),
        totalInvestedFuture: formatNumber(totalInvestedFuture),
    };
}


export function calculatePayoutFutureDelay(quantity, spotEntryPrice, futuresEntryPrice, longExitPrice, futureExitPrice, hedgingRatio, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);
    const Q = parseFloat(quantity) || 1;
    const hedgingRatioFloat = parseFloat(hedgingRatio) || 0;

    if (!Q || !spotEntryPrice || !futuresEntryPrice || !longExitPrice || !futureExitPrice || hedgingRatioFloat < 0 || hedgingRatioFloat > 1) {
        console.error("Invalid inputs for delayed future payout calculation:", { Q, spotEntryPrice, futuresEntryPrice, longExitPrice, futureExitPrice, hedgingRatio });
        return { spotPayout: 0, hedgedPayout: 0 };
    }

    // Long futures
    const Q_long = Q * (1 - hedgingRatioFloat / 2);
    const spotPayout = Q_long * (longExitPrice - futuresEntryPrice) - Q * futuresEntryPrice * fees.takerFee;

    // Hedged futures
    const Q_short = Q * hedgingRatioFloat / 2;
    const shortPayout = Q_short * (futuresEntryPrice - futureExitPrice) - Q_short * futuresEntryPrice * fees.takerFee;

    // Combined payout
    const hedgedPayout = spotPayout + shortPayout;

    return {
        spotPayout: formatNumber(spotPayout),
        hedgedPayout: formatNumber(hedgedPayout),
    };
}

// Calculate payouts for Short Position Hedging
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
    const Q_long = Q * (1 - h / 2);
    const totalInvestedLong = Q_long * P_spot_achat;
    const P_L_long = Q_long * (P_spot_vente - P_spot_achat);

    // Short position details
    const Q_short = Q * h / 2; // Shorted quantity based on hedging ratio
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

export function calculatePayoutShortDelay(Q, P_spot_achat, LongClose, ShortClose, h, twoWeeksVolume) {
    // Re-use the calculatePayoutShort logic
    const fees = calculateFEE_RATES(twoWeeksVolume);

    const Q_long = Q * (1 - h / 2);
    const P_L_long = Q_long * (LongClose - P_spot_achat);

    const Q_short = Q * h / 2;
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

export const calculateShortHedgeParameters = (
    targetReturn,         // % change (+ or -)
    desiredPayout,        // Desired $ profit
    availableMargin,      // $ margin available
    riskAversion,         // Risk level: low, medium, high
    spotPrice,            // Current spot price of the asset
    twoWeeksVolume        // Trading volume for fee calculation
) => {
    const fees = calculateFEE_RATES(twoWeeksVolume);
    
    // Parse inputs
    const returnMultiplier = targetReturn / 100; // Convert % to decimal
    const margin = parseFloat(availableMargin);
    const payout = parseFloat(desiredPayout);

    if (margin <= 0 || spotPrice <= 0 || payout <= 0) {
        throw new Error("Invalid inputs. Values must be positive.");
    }

    // Hedge logic
    const leverageRiskMap = { low: 2, medium: 5, high: 10 }; // Adjust leverage per risk aversion
    const leverage = leverageRiskMap[riskAversion] || 5;     // Default to 'medium' if undefined

    // Determine quantity to short (hedge)
    const shortMargin = margin / leverage;
    const shortQuantity = shortMargin / spotPrice; 

    // Calculate spot quantity to align payout
    const targetSpotGain = payout / returnMultiplier; // Gain needed from spot movement
    const spotQuantity = targetSpotGain / spotPrice;  // Quantity to buy spot

    // Ensure hedging covers payout
    const totalFees = shortQuantity * spotPrice * fees.takerFee; // Fees applied on short position

    return {
        spotQuantity: spotQuantity.toFixed(6),        // Quantity to buy spot
        shortQuantity: shortQuantity.toFixed(6),      // Quantity to short
        leverage: leverage.toFixed(2),                // Optimal leverage
        marginRequired: shortMargin.toFixed(2),       // Margin required for short position
        fees: totalFees.toFixed(2)                    // Total fees
    };
};



export const calculateBestPayout = (seriesData, type, quantity, spot_entry_price, futures_entry_price, hedgingRatio, twoWeeksVolume) => {
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
        ({ spotPayout: bestSpotPayout, hedgedPayout: bestHedgedPayout } = calculatePayoutFuture(
            quantity,
            spot_entry_price,
            futures_entry_price,
            highestClose,
            lowestClose,
            hedgingRatio,
            twoWeeksVolume
        ));
    }

    return {
        bestSpotPayout: formatNumber(bestSpotPayout),
        bestHedgedPayout: formatNumber(bestHedgedPayout),
    };
};

