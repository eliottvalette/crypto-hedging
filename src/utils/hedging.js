export function calculatePayout (quantity, spotEntryPrice, futuresEntryPrice, hedgingRatio){
    const Q = parseFloat(quantity) || 0;
    const P_spot_achat = parseFloat(spotEntryPrice) || 0;
    const P_futures_entree = parseFloat(futuresEntryPrice) || 0;
    const h = parseFloat(hedgingRatio) || 0;

    // Define fee rates
    const F_spot = 0.001; // 0.1%
    const F_futures = 0.0004; // 0.04%
    const F_funding = 0.0001; // 0.01% (example)
    const T = 1; // Holding period (1 interval)

    // Simulate a 10% market increase
    const priceChangePercent = 10;
    const P_spot_vente = P_spot_achat * (1 + priceChangePercent / 100);
    const P_futures_sortie = P_spot_vente;

    // Spot-only P&L
    const P_L_spot = Q * (P_spot_vente - P_spot_achat);
    const Frais_spot = Q * P_spot_achat * F_spot;
    const payoutSpot = P_L_spot - Frais_spot;

    // Hedged P&L
    const P_L_futures = -Q * h * (P_futures_sortie - P_futures_entree);
    const Paiement_financement = Q * h * P_futures_entree * F_funding * T;
    const Frais_futures = Q * h * P_futures_entree * F_futures;
    const Frais_totaux = Frais_spot + Frais_futures + Paiement_financement;
    const payoutHedged = P_L_spot + P_L_futures - Frais_totaux;

    console.log('Value just before return : ', payoutSpot, payoutHedged);

    return { payoutSpot, payoutHedged };
}
    