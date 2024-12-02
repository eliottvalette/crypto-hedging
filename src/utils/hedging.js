// hedging.js

// Constants for fees and funding rates
export const FEE_RATES = {
    spot: 0.001,        // Spot trading fee: 0.1%
    futures: 0.0004,    // Futures trading fee: 0.04%
    funding: 0.0001,    // Funding fee: 0.01%
    trading: 0.001      // General trading fee: 0.1%
};

// Calculate payouts for Futures Hedging
export function calculatePayoutFuture(quantity, spotEntryPrice, futuresEntryPrice, hedgingRatio, priceChangePercent) {

    ////////////////////////////////////////////
    const Q = parseFloat(quantity) || 1;
    const P_spot_achat = parseFloat(spotEntryPrice) || 1;
    const P_futures_entree = parseFloat(futuresEntryPrice) || 1;
    const h = parseFloat(hedgingRatio) || 0.03;

    if (!Q || !P_spot_achat || !P_futures_entree || h < 0 || h > 1) {
        console.error("Invalid inputs for futures calculation:", { Q, P_spot_achat, P_futures_entree, h });
        return { spotPayout: 0, hedgedPayout: 0 };
    }
    ////////////////////////////////////////////

    // Calculate exit spot price based on price change
    const P_spot_vente = P_spot_achat * (1 + priceChangePercent / 100);
    const P_futures_sortie = P_spot_vente;

    // Spot-only P&L
    const P_L_spot = Q * (P_spot_vente - P_spot_achat);
    const Frais_spot = Q * P_spot_achat * FEE_RATES.spot;
    const spotPayout = P_L_spot - Frais_spot;

    // Futures P&L
    const P_L_futures = - Q * h * (P_futures_sortie - P_futures_entree);
    const Paiement_financement = Q * h * P_futures_entree * FEE_RATES.funding;
    const Frais_futures = Q * h * P_futures_entree * FEE_RATES.futures;
    const Frais_totaux = Frais_spot + Frais_futures + Paiement_financement;
    const hedgedPayout = P_L_spot + P_L_futures - Frais_totaux;

    return { spotPayout, hedgedPayout };
}

// Calculate payouts for Short Position Hedging
export function calculatePayoutShort(quantity, spotEntryPrice, spotExitPrice, hedgingRatio, marginRate) {
    const Q = parseFloat(quantity) || 1;
    const P_spot_achat = parseFloat(spotEntryPrice) || 1;
    const P_spot_vente = parseFloat(spotExitPrice) || 1;
    const h = parseFloat(hedgingRatio) || 0.03;
    const margin_rate = parseFloat(marginRate) || 0;

    if (!Q || !P_spot_achat || !P_spot_vente || h < 0 || h > 1 || margin_rate <= 0) {
        console.error("Invalid inputs for short hedging calculation:", { Q, P_spot_achat, P_spot_vente, h, margin_rate });
        return { spotPayout: 0, hedgedPayout: 0, optimalLeverage: 0 };
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
    const Frais_totaux = Q * P_spot_achat * FEE_RATES.trading;

    // Hedged Payout
    const hedgedPayout = P_L_long + P_L_short - Frais_totaux;

    return { spotPayout: P_L_long, hedgedPayout, optimalLeverage };
}


export const calculateShortHedgeParameters = (
    expectedTrend,
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

    const hedgingRatio = Math.min(1, desiredPayout / (expectedTrend * 100)); // Example logic
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

