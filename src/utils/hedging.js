// hedging.js

/**
 * Calcul du Profit & Loss (P/L) sur le marché Spot
 * @param {number} Q - Quantité de l'actif
 * @param {number} P_spot_achat - Prix d'achat sur le marché spot
 * @param {number} P_spot_vente - Prix de vente sur le marché spot
 * @returns {number} P/L Spot
 */
export const calculatePnlSpot = (Q, P_spot_achat, P_spot_vente) => {
    return Q * (P_spot_vente - P_spot_achat);
};

/**
 * Calcul du Profit & Loss (P/L) sur le marché Futures
 * @param {number} Q - Quantité de l'actif
 * @param {number} h - Ratio de couverture
 * @param {number} P_futures_entree - Prix d'entrée sur les futures
 * @param {number} P_futures_sortie - Prix de sortie sur les futures
 * @returns {number} P/L Futures
 */
export const calculatePnlFutures = (Q, h, P_futures_entree, P_futures_sortie) => {
    return -Q * h * (P_futures_sortie - P_futures_entree);
};


/**
 * Calcul des frais de trading spot
 * @param {number} Q - Quantité de l'actif
 * @param {number} P_spot_achat - Prix d'achat sur le marché spot
 * @param {number} F_spot - Taux de frais de trading spot
 * @returns {number} Frais Spot
 */
export const calculateSpotFees = (Q, P_spot_achat, F_spot) => {
    return Q * P_spot_achat * F_spot;
};

/**
 * Calcul des frais de trading futures
 * @param {number} Q - Quantité de l'actif
 * @param {number} h - Ratio de couverture
 * @param {number} P_futures_entree - Prix d'entrée sur les futures
 * @param {number} F_futures - Taux de frais de trading futures
 * @returns {number} Frais Futures
 */
export const calculateFuturesFees = (Q, h, P_futures_entree, F_futures) => {
    return Q * h * P_futures_entree * F_futures;
};

/**
 * Paiements de financement pour futures
 * @param {number} Q - Quantité de l'actif
 * @param {number} h - Ratio de couverture
 * @param {number} P_mark - Prix de référence pour le financement
 * @param {number} F_funding - Taux de financement
 * @param {number} T - Durée de détention
 * @returns {number} Paiements de financement
 */
export const calculateFundingPayments = (Q, h, P_mark, F_funding, T) => {
    return Q * h * P_mark * F_funding * T;
};


/**
 * Calcul du P&L Net
 * @param {number} Q - Quantité de l'actif
 * @param {number} P_spot_achat - Prix d'achat sur le marché spot
 * @param {number} P_spot_vente - Prix de vente sur le marché spot
 * @param {number} P_futures_entree - Prix d'entrée sur les futures
 * @param {number} P_futures_sortie - Prix de sortie sur les futures
 * @param {number} F_spot - Taux de frais de trading spot
 * @param {number} F_futures - Taux de frais de trading futures
 * @param {number} F_funding - Taux de financement
 * @param {number} T - Durée de détention
 * @param {number} h - Ratio de couverture
 * @returns {number} P&L Net
 */
export const calculateNetPnl = (
    Q, P_spot_achat, P_spot_vente,
    P_futures_entree, P_futures_sortie,
    F_spot, F_futures, F_funding, T, h
) => {
    const pnlSpot = calculatePnlSpot(Q, P_spot_achat, P_spot_vente);
    const pnlFutures = calculatePnlFutures(Q, h, P_futures_entree, P_futures_sortie);
    const spotFees = calculateSpotFees(Q, P_spot_achat, F_spot);
    const futuresFees = calculateFuturesFees(Q, h, P_futures_entree, F_futures);
    const fundingPayments = calculateFundingPayments(Q, h, P_futures_entree, F_funding, T);
    const totalFees = spotFees + futuresFees + fundingPayments;

    return pnlSpot + pnlFutures - totalFees;
};
