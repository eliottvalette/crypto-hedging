import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import { savedTrends } from '../utils/trends';
import { calculatePayoutFuture, calculatePayoutShort } from '../utils/hedging';
import { useState, useEffect } from 'react';
import { FaRedo } from 'react-icons/fa';
import 'apexcharts/dist/apexcharts.css';

const TrendsChart = ({ trend, quantity, hedgingRatio, type, marginRate, spotEntryPrice, futuresEntryPrice, generateNewTrend }) => {
  const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
  const [seriesData, setSeriesData] = useState(savedTrends[trend]);
  const [originalClosePrice, setOriginalClosePrice] = useState(null);
  const [hedgeClosePrice, setHedgeClosePrice] = useState(null);
  const [isClosingOriginal, setIsClosingOriginal] = useState(true);

  const spot_entry_price = parseFloat(spotEntryPrice) || 0;
  const futures_entry_price = parseFloat(futuresEntryPrice) || 0;

  const generateTrend = () => {
    const newTrends = generateNewTrend();
    savedTrends['upTrend'] = newTrends['upTrend'];
    savedTrends['downTrend'] = newTrends['downTrend'];
    savedTrends['sideTrend'] = newTrends['sideTrend'];
    setSeriesData(newTrends[trend]);
  };

  useEffect(() => {
    setSeriesData(savedTrends[trend]);
  }, [trend]);

  const startDate = new Date()

  // Adjust series data and calculate payouts
  const adjustedSeriesData = seriesData.map((dataPoint, index) => {
    const timestamp = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString()
    const [open, high, low, close] = dataPoint.y.map((value) =>
      (value * spot_entry_price / 100).toFixed(2)
    );

    let spotPayout = 0;
    let hedgedPayout = 0;
    const pricePercentageChange = (close - spot_entry_price) / spot_entry_price * 100;

    if (type === 'spot') {
      ({ spotPayout, hedgedPayout } = calculatePayoutShort(
        quantity,
        spot_entry_price,
        parseFloat(close),
        hedgingRatio,
        marginRate,
        twoWeeksVolume
      ));
    } else {
      ({ spotPayout, hedgedPayout } = calculatePayoutFuture(
        quantity,
        spot_entry_price,
        futures_entry_price,
        hedgingRatio,
        parseFloat(pricePercentageChange),
        twoWeeksVolume
      ));
    }

    return {
      ...dataPoint,
      x: timestamp,
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
      events: {
        click: (event, chartContext, config) => {
          const dataPointIndex = config.dataPointIndex;
          if (dataPointIndex !== -1) {
            const closePrice = parseFloat(adjustedSeriesData[dataPointIndex].y[3]);
            if (!originalClosePrice) {
              setOriginalClosePrice(closePrice);
            } else {
              setHedgeClosePrice(closePrice);
            }
          }
        }
      },
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
    plotOptions: {
      candlestick: {
        wick: {
          useFillColor: true,
        },
        colors: {
          upward: '#00B746',
          downward: '#EF403C'
        },
        fill: {
          opacity: 1
        }
      },
    },
    tooltip: {
      shared: true,
      custom: ({ dataPointIndex }) => {
        const { spotPayout, hedgedPayout } = adjustedSeriesData[dataPointIndex];

        const spotColor = parseFloat(spotPayout) >= 0 ? '#28a745' : '#dc3545'; // Green for positive, red for negative
        const hedgedColor = parseFloat(hedgedPayout) >= 0 ? '#17a2b8' : '#ffc107'; // Blue for positive, yellow for negative

        return `
          <div class="custom-tooltip" style="padding: 10px; border-radius: 5px; width: 11rem">
            <div style="margin-bottom: 3px; font-weight: bold; text-align: center; color: black;">Payouts</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: black">Without Hedge: </span>
              <span style="color: ${spotColor};">$${spotPayout}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: black">With Hedge: </span>
              <span style="color: ${hedgedColor};">$${hedgedPayout}</span>
            </div>
          </div>
        `;
      },
    },
  };

  return (
    <div id="chart">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <button onClick={generateTrend} className="reload-button">
          <FaRedo />
        </button>
      </div>
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
  marginRate: PropTypes.number,
  spotEntryPrice: PropTypes.number.isRequired,
  futuresEntryPrice: PropTypes.number,
  generateNewTrend: PropTypes.func.isRequired,
};

export default TrendsChart;
