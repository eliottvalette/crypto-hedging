import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { calculatePnlSpot } from '../utils/hedging';
import fetchHistoricalData from '../utils/data';

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

// Register Chart.js components
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
  // States for market data, chart data, errors, and loading
  const [marketData, setMarketData] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch market data from Binance API
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
          params: { symbol: 'BTCUSDT' }
        });
        console.log('Market Data:', response.data); // Debugging
        setMarketData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setError('Unable to fetch market data.');
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Fetch historical BTC price data
  useEffect(() => {
    const fetchHistoricalBTC = async () => {
      try {
        const data = await fetchHistoricalData('BTC/USD', '2023-01-01', '2023-12-31', '1Day');
        if (data) {
          const labels = data.map(bar => new Date(bar.t).toLocaleDateString());
          const prices = data.map(bar => bar.c);
  
          setChartData({
            labels,
            datasets: [
              {
                label: 'BTC Price',
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4,
              },
            ],
          });
        } else {
          setError('No historical data available.');
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
        setError('Unable to fetch historical data.');
      }
    };
  
    fetchHistoricalBTC();
  }, []);
  

  // Calculate P&L Spot
  const Q = 1; // Quantity
  const P_spot_achat = 95_000; // Spot buy price
  const P_spot_vente = marketData && marketData.lastPrice ? parseFloat(marketData.lastPrice) : P_spot_achat; // Spot sell price (or buy price if not available)
  const pnlSpot = calculatePnlSpot(Q, P_spot_achat, P_spot_vente); // Calculate P&L Spot

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      {/* Loading and error states */}
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Market information */}
          <div className="market-info">
            <p>Current BTC Price: {marketData && marketData.lastPrice ? `$${parseFloat(marketData.lastPrice).toLocaleString()}` : 'N/A'}</p>
            <p>P&L Spot: ${pnlSpot.toLocaleString()}</p>
          </div>
          
          {/* Chart container */}
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
                      text: 'BTC Price Evolution',
                    },
                  },
                }}
              />
            ) : (
              <p>Loading chart...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
