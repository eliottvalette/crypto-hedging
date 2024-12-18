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

const apiInfo = {
    marginRate: 0.05,
}

function formatNumber(number) {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Adjusted Calculate payouts for Futures Hedging
export function calculatePayoutFuture(quantity, spotEntryPrice, futuresEntryPrice, spotExitPrice, futuresExitPrice, hedgingRatio, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);

    const Q = parseFloat(quantity) || 1; // Total quantity
    const P_spot_achat = parseFloat(spotEntryPrice) || 1; // Spot entry price
    const P_futures_entree = parseFloat(futuresEntryPrice) || 1; // Futures entry price
    const P_spot_vente = parseFloat(spotExitPrice) || 1; // Spot exit price
    const P_futures_sortie = parseFloat(futuresExitPrice) || 1; // Futures close price
    const h = parseFloat(hedgingRatio) || 0.03; // Hedging ratio (default: 3%)

    if (!Q || !P_spot_achat || !P_futures_entree || !P_spot_vente || !P_futures_sortie || h < 0 || h > 1) {
        console.error("Invalid inputs for futures calculation:", { Q, P_spot_achat, P_futures_entree, P_spot_vente, P_futures_sortie, h });
        return { spotPayout: 0, hedgedPayout: 0, totalInvested: 0 };
    }

    // Spot-only P&L
    const P_L_spot = Q * (P_spot_vente - P_spot_achat); // Profit/Loss on spot position
    const Fees_spot = Q * P_spot_achat * fees.makerFee; // Maker fees on spot
    const spotPayout = P_L_spot - Fees_spot; // Net payout for spot position

    // Futures P&L
    const P_L_futures = - Q * h * (P_futures_sortie - P_futures_entree); // Profit/Loss on futures position
    const Funding_Fee = Q * h * P_futures_entree * fees.fundingFee; // Funding fee applied on futures entry
    const Fees_futures = Q * h * P_futures_entree * fees.takerFee; // Taker fees on futures
    const Total_Fees = Fees_spot + Fees_futures + Funding_Fee; // Total fees across both positions

    // Hedged Payout
    const hedgedPayout = P_L_spot - P_L_futures - Total_Fees;

    // Total invested capital
    const totalInvested = Q * P_spot_achat;

    // Return results with proper formatting
    return {
        spotPayout: formatNumber(spotPayout),
        hedgedPayout: formatNumber(hedgedPayout),
        totalInvested: formatNumber(totalInvested),
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
    const longPayout = P_L_long - Frais_long;
    const shortPayout = P_L_short - Frais_short;

    // Hedged Payout (Long + Short - Fees)
    const hedgedPayout = longPayout + shortPayout;

    // Optimal Leverage for Short
    const optimalLeverage = totalInvestedShort / (Q_short * P_spot_achat);

    return {
        spotPayout: formatNumber(longPayout),
        hedgedPayout: formatNumber(hedgedPayout),
        optimalLeverage: formatNumber(optimalLeverage),
        totalInvestedLong: formatNumber(totalInvestedLong),
        totalInvestedShort: formatNumber(totalInvestedShort),
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

    const fees = calculateFEE_RATES(twoWeeksVolume);

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
        // Re-use the calculatePayoutShort logic
        const Q_long = Q * (1 - h / 2);
        const P_L_long = Q_long * (highestClose - P_spot_achat);

        const Q_short = Q * h / 2;
        const P_L_short = Q_short * (P_spot_achat - lowestClose);

        const Frais_long = Q * P_spot_achat * fees.takerFee; // Fees for the long position
        const Frais_short = Q_short * P_spot_achat * fees.takerFee; // Fees for the short position

        // Adjusted Payout
        const longPayout = P_L_long - Frais_long;
        const shortPayout = P_L_short - Frais_short;

        console.log('longPayout', longPayout);
        console.log('shortPayout', shortPayout);

        bestSpotPayout = longPayout;
        bestHedgedPayout = longPayout + shortPayout;

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
