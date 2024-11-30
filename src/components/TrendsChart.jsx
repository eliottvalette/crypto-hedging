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
  const adjustedSeriesData = trends[trend].map((dataPoint, index, array) => {
    const [open, high, low, close] = dataPoint.y.map((value) =>
      (value * spotEntryPrice / 100).toFixed(2)
    );

    let spotPayout = 0;
    let hedgedPayout = 0;

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
        parseFloat(close) // Use the adjusted closing price for this data point
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

        return `
          <div>
            <div>Spot Payout: ${spotPayout}</div>
            <div>Hedged Payout: ${hedgedPayout}</div>
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
