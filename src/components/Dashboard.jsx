// src/components/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { calculatePnlSpot } from '../utils/hedging';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Enregistrement des composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  // États pour les données de marché, les données du graphique, les erreurs et le chargement
  const [marketData, setMarketData] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effet pour récupérer les données de marché depuis l'API de Binance
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
          params: { symbol: 'BTCUSDT' }
        });
        console.log('Données de marché reçues:', response.data); // Pour le débogage
        setMarketData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des données de marché :', error);
        setError('Impossible de récupérer les données de marché.');
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Effet pour configurer les données du graphique (statique pour l'exemple)
  useEffect(() => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const data = {
      labels,
      datasets: [
        {
          label: 'Prix BTC',
          data: [30000, 40000, 32000, 47000, 48000, 55000], // Remplacez par des données dynamiques si nécessaire
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
    setChartData(data);
  }, []);

  // Variables pour le calcul P&L Spot
  const Q = 1; // Quantité
  const P_spot_achat = 95_000; // Prix d'achat spot
  const P_spot_vente = marketData && marketData.lastPrice ? parseFloat(marketData.lastPrice) : P_spot_achat; // Prix de vente spot (ou prix d'achat si non disponible)
  const pnlSpot = calculatePnlSpot(Q, P_spot_achat, P_spot_vente); // Calcul du P&L Spot

  return (
    <div className="dashboard">
      <h2>Tableau de Bord</h2>
      
      {/* Gestion des états de chargement et d'erreur */}
      {loading ? (
        <p>Chargement des données...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Informations sur le marché */}
          <div className="market-info">
            <p>Prix Actuel BTC : {marketData && marketData.lastPrice ? `$${parseFloat(marketData.lastPrice).toLocaleString()}` : 'N/A'}</p>
            <p>P&L Spot : ${pnlSpot.toLocaleString()}</p>
          </div>
          
          {/* Conteneur du graphique */}
          <div className="chart-container">
            {chartData.datasets.length > 0 ? (
              <Line 
                data={chartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Évolution du Prix du BTC',
                    },
                  },
                }}
              />
            ) : (
              <p>Chargement du graphique...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
