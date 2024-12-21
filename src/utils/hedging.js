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

function calculateFees(quantity, entryPrice, feeRate) {
    return quantity * entryPrice * feeRate;
}

function calculatePayout(longQuantity, shortQuantity, entryPrice, exitPrice, fees) {
    const longPayout = longQuantity * (exitPrice - entryPrice) - fees.long;
    const shortPayout = shortQuantity * (entryPrice - exitPrice) - fees.short;
    return longPayout + shortPayout;
}

// Adjusted Calculate payouts for Futures Hedging
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
    const Q_long = Q * (1 - h / 2);
    const totalInvestedLong = Q_long * futuresEntryPrice;
    const longFees = calculateFees(Q, futuresEntryPrice, fees.takerFee);

    // Hedged futures
    const Q_short = Q * h / 2;
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
        ({ spotPayout: bestSpotPayout, hedgedPayout: bestHedgedPayout } = calculatePayoutFutureDelay(
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

export function calculateShortHedgeParameters({
    spotEntryPrice,
    expectedVariation,
    availableMargin,
    desiredPayout,
    riskAversion,
    twoWeeksVolume,
}) {
    const fees = calculateFEE_RATES(twoWeeksVolume);

    // Calculate required quantities based on risk aversion and margin
    const leverage = riskAversion === 'low' ? 2 : riskAversion === 'medium' ? 5 : 10;
    const shortQuantity = availableMargin / (spotEntryPrice * leverage);
    const spotQuantity = desiredPayout / spotEntryPrice;

    // Calculate fees and margin required
    const marginRequired = shortQuantity * spotEntryPrice / leverage;
    const totalFees = shortQuantity * spotEntryPrice * fees.takerFee;

    return {
        spotQuantity,
        shortQuantity,
        leverage,
        marginRequired,
        fees: totalFees,
    };
}
