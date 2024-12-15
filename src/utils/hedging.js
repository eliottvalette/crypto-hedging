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

// Adjusted Calculate payouts for Futures Hedging
export function calculatePayoutFuture(quantity, spotEntryPrice, futuresEntryPrice, spotExitPrice, futuresExitPrice, hedgingRatio, twoWeeksVolume) {
    console.log("Calculating payouts for futures hedging:", { quantity, spotEntryPrice, futuresEntryPrice, spotExitPrice, futuresExitPrice, hedgingRatio, twoWeeksVolume });
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
        spotPayout: parseFloat(spotPayout.toFixed(2)),
        hedgedPayout: parseFloat(hedgedPayout.toFixed(2)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
    };
}

// Calculate payouts for Short Position Hedging
export function calculatePayoutShort(quantity, spotEntryPrice, spotExitPrice, hedgingRatio, marginRate, twoWeeksVolume) {
    const fees = calculateFEE_RATES(twoWeeksVolume);

    const Q = parseFloat(quantity) || 1;
    const P_spot_achat = parseFloat(spotEntryPrice) || 1;
    const P_spot_vente = parseFloat(spotExitPrice) || 1;
    const h = parseFloat(hedgingRatio) || 0.03;
    const margin_rate = parseFloat(marginRate) || 0;

    if (!Q || !P_spot_achat || !P_spot_vente || h < 0 || h > 1 || margin_rate <= 0) {
        console.error("Invalid inputs for short hedging calculation:", { Q, P_spot_achat, P_spot_vente, h, margin_rate });
        return { spotPayout: 0, hedgedPayout: 0, optimalLeverage: 0, totalInvested: 0 };
    }

    // Calculate margin based on margin rate
    const margin = Q * P_spot_achat * margin_rate;

    // Shorted quantity
    const Q_short = Q * h;

    // P&L Calculations
    const P_L_long = Q * (P_spot_vente - P_spot_achat); // Long position
    const P_L_short = Q_short * (P_spot_achat - P_spot_vente); // Short position
    const optimalLeverage = (Q_short * P_spot_achat) / margin;

    // Fees
    const Frais_totaux = Q * P_spot_achat * fees.takerFee;

    // Hedged Payout
    const hedgedPayout = P_L_long + P_L_short - Frais_totaux;

    // Total invested
    const totalInvested = Q * P_spot_achat;

    return {
        spotPayout: parseFloat(P_L_long.toFixed(2)),
        hedgedPayout: parseFloat(hedgedPayout.toFixed(2)),
        optimalLeverage: parseFloat(optimalLeverage.toFixed(2)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
    };
}

export const calculateShortHedgeParameters = (
    targetReturn,
    desiredPayout,
    availableMargin,
    riskAversion,
    spotEntryPrice
) => {
    // Define risk-based hedging ratio multipliers
    const riskMultiplier = {
        low: 0.2,
        medium: 0.5,
        high: 0.8,
    };

    const hedgingRatio = Math.min(1, desiredPayout / (targetReturn * 100));
    const adjustedHedgingRatio = hedgingRatio * riskMultiplier[riskAversion];

    const quantity = desiredPayout / (adjustedHedgingRatio * spotEntryPrice);
    const leverage = availableMargin / (quantity * spotEntryPrice);
    const marginRequired = quantity * spotEntryPrice * adjustedHedgingRatio;

    if (marginRequired > availableMargin) {
        throw new Error('Not enough margin to execute this hedge.');
    }

    return {
        quantity: quantity.toFixed(2),
        hedgingRatio: adjustedHedgingRatio.toFixed(2),
        leverage: leverage.toFixed(2),
        spotEntryPrice: spotEntryPrice.toFixed(2),
        marginRequired: marginRequired.toFixed(2),
    };
};