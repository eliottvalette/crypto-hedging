import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import trends from '../utils/trends';
import { calculatePayoutFuture, calculatePayoutShort } from '../utils/hedging';
import { getSpotPrice, getFuturesPrice } from '../utils/data';

const TrendsChart = ({ trend, quantity, hedgingRatio, type, symbol, initialMargin }) => {
  const [spotEntryPrice, setSpotEntryPrice] = useState(0);
  const [futuresEntryPrice, setFuturesEntryPrice] = useState(0);

  useEffect(() => {
    async function fetchPrices() {
      const spotPrice = await getSpotPrice(symbol);
      const futuresPrice = await getFuturesPrice(symbol);
      setSpotEntryPrice(spotPrice);
      setFuturesEntryPrice(futuresPrice);
    }
    fetchPrices();
  }, [symbol]);

  // Adjust series data and calculate payouts
  const adjustedSeriesData = trends[trend].map((dataPoint) => {
    const [open, high, low, close] = dataPoint.y.map((value) =>
      (value * spotEntryPrice / 100).toFixed(2)
    );

    let spotPayout = 0;
    let hedgedPayout = 0;
    const pricePercentageChange = (close - spotEntryPrice)/ spotEntryPrice * 100;

    if (type === 'spot') {
      ({ spotPayout, hedgedPayout } = calculatePayoutShort(
        quantity,
        spotEntryPrice,
        parseFloat(close), // Use the adjusted closing price for this data point
        hedgingRatio,
        initialMargin
      ));
    } else {
      ({ spotPayout, hedgedPayout } = calculatePayoutFuture(
        quantity,
        spotEntryPrice,
        futuresEntryPrice,
        hedgingRatio,
        parseFloat(pricePercentageChange) // Use the adjusted closing price for this data point
      ));
    }

    return {
      ...dataPoint,
      y: [open, high, low, close],
      spotPayout: spotPayout.toFixed(2),
      hedgedPayout: hedgedPayout.toFixed(2),
    };
  });

  // Chart options
  const options = {
    chart: {
      type: 'candlestick',
      height: 350,
    },
    title: {
      text: 'Price Movement',
      align: 'left',
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
    tooltip: {
      shared: true,
      custom: ({ dataPointIndex }) => {
        const { spotPayout, hedgedPayout } = adjustedSeriesData[dataPointIndex];

        // Determine payout colors based on positive or negative values
        const spotColor = parseFloat(spotPayout) >= 0 ? '#28a745' : '#dc3545'; // Green for positive, red for negative
        const hedgedColor = parseFloat(hedgedPayout) >= 0 ? '#17a2b8' : '#ffc107'; // Blue for positive, yellow for negative

        return `
          <div class="custom-tooltip">
            <div style="margin-bottom: 8px; font-weight: bold; text-align: center;">Payouts</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Spot Payout:</span>
              <span style="color: ${spotColor};">$${spotPayout}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Hedged Payout:</span>
              <span style="color: ${hedgedColor};">$${hedgedPayout}</span>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <div id="chart">
      <Chart options={options} series={[{ data: adjustedSeriesData }]} type="candlestick" height={350} />
    </div>
  );
};

TrendsChart.propTypes = {
  trend: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  hedgingRatio: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  symbol: PropTypes.string.isRequired,
  initialMargin: PropTypes.number,
};

export default TrendsChart;
