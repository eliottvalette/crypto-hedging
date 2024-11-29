import { useState, useEffect } from 'react';
import { calculateNetPnl } from '../utils/hedging';
// import fetchHistoricalData from '../utils/data';


const HedgingCalculator = () => {
    const [inputs, setInputs] = useState({
        Q: 1,
        P_spot_achat: 50000,
        P_spot_vente: 60000,
        P_futures_entree: 50000,
        P_futures_sortie: 60000,
        F_spot: 0.001,
        F_futures: 0.0004,
        F_funding: 0.0001,
        T: 1,
        h: 0.5
    });

    const [netPnl, setNetPnl] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs({ ...inputs, [name]: parseFloat(value) });
    };

    const calculate = async () => {
        const result = calculateNetPnl(
            inputs.Q, inputs.P_spot_achat, inputs.P_spot_vente,
            inputs.P_futures_entree, inputs.P_futures_sortie,
            inputs.F_spot, inputs.F_futures, inputs.F_funding, inputs.T, inputs.h
        );
        setNetPnl(result);
    };

    useEffect(() => {
        calculate(); // Recalculate on initial render
    }, [inputs]);

    return (
        <div className="calculator-container">
            <h1>Hedging Calculator</h1>
            <input type="number" name="Q" value={inputs.Q} onChange={handleChange} placeholder="Quantity (Q)" />
            <input type="number" name="P_spot_achat" value={inputs.P_spot_achat} onChange={handleChange} placeholder="Spot Purchase Price" />
            <input type="number" name="P_spot_vente" value={inputs.P_spot_vente} onChange={handleChange} placeholder="Spot Selling Price" />
            <input type="number" name="P_futures_entree" value={inputs.P_futures_entree} onChange={handleChange} placeholder="Futures Entry Price" />
            <input type="number" name="P_futures_sortie" value={inputs.P_futures_sortie} onChange={handleChange} placeholder="Futures Exit Price" />
            <label>Hedging Ratio (h):</label>
            <input type="range" name="h" min="0" max="1" step="0.01" value={inputs.h} onChange={handleChange} />
            <button onClick={calculate}>Calculate</button>
            <p>Net P&L: {netPnl.toFixed(2)}</p>
        </div>

    );
};

export default HedgingCalculator;
