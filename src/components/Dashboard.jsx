import { useState, useEffect, useRef, memo } from 'react';
import axios from 'axios';


function Dashboard() {
  const [marketData, setMarketData] = useState(null);

  // Market data from Binance API
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
          params: { symbol: 'BTCUSDT' }
        });
        console.log('Market Data:', response.data); // Debugging
        setMarketData(response.data);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
  }, []);

  // Curve Chart
  const container = useRef();
  useEffect(() => {
    if (container.current && !container.current.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "BITSTAMP:BTCUSD",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "allow_symbol_change": true,
          "calendar": false,
          "hide_side_toolbar": true,
          "hide_top_toolbar": true,
          "toolbar_bg": "#004A37",
          "support_host": "https://www.tradingview.com"
        }`;

      container.current.appendChild(script);
    }
  
    return () => {
      if (container.current) {
        container.current.innerHTML = ''; // Clear the container
      }
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="market-info">
              <p>Current BTC Price: {marketData && marketData.lastPrice ? `$${parseFloat(marketData.lastPrice).toLocaleString()}` : 'N/A'}</p>
      </div>
      <div className="chart-container" ref={container}>
        <div className="chart-container__widget"></div>
      </div>
    </div>
  );
}

export default memo(Dashboard);
