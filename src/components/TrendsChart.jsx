import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import { savedTrends } from '../utils/trends';
import { calculatePayoutFuture, calculatePayoutShort, calculateBestPayout } from '../utils/hedging';
import { useState, useEffect } from 'react';
import { FaRedo } from 'react-icons/fa';
import 'apexcharts/dist/apexcharts.css';

const TrendsChart = ({ trend, quantity, hedgingRatio, type, marginRate, spotEntryPrice, futuresEntryPrice, generateNewTrend, setAdjustedPayout, setOriginalClosePrice, setHedgeClosePrice, setBestPayout }) => {
  const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
  const [seriesData, setSeriesData] = useState(savedTrends[trend]);
  const [isClosingHedge, setIsClosingHedge] = useState(false);
  const spot_entry_price = parseFloat(spotEntryPrice) || 0;
  const futures_entry_price = parseFloat(futuresEntryPrice) || 0;
  const [originalClosePriceTemp, setOriginalClosePriceTemp] = useState(null);
  const [hedgeClosePriceTemp, setHedgeClosePriceTemp] = useState(null);
  const [activePosition, setActivePosition] = useState('long'); // New state for active position

  const formatNumber = (number) => {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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

  const startDate = new Date();

  // Adjust series data and calculate payouts
  const adjustedSeriesData = seriesData.map((dataPoint, index) => {
    const timestamp = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString();
    const [open, high, low, close] = dataPoint.y.map((value) =>
      (value * spot_entry_price / 100).toFixed(2)
    );

    let spotPayout = 0;
    let hedgedPayout = 0;

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
        parseFloat(close),
        parseFloat(close),
        hedgingRatio,
        twoWeeksVolume
      ));
    }

    return {
      ...dataPoint,
      x: timestamp,
      y: [open, high, low, close],
      spotPayout: formatNumber(spotPayout),
      hedgedPayout: formatNumber(hedgedPayout),
    };
  });

  useEffect(() => {
    console.log("Adjusted series data:", adjustedSeriesData);
    const { bestSpotPayout, bestHedgedPayout } = calculateBestPayout(
        adjustedSeriesData,
        type,
        quantity,
        spot_entry_price,
        futures_entry_price,
        hedgingRatio,
        marginRate,
        twoWeeksVolume
    );
    console.log("Best payouts calculated:", { bestSpotPayout, bestHedgedPayout });
    setBestPayout({bestSpotPayout, bestHedgedPayout});
  }, [isClosingHedge, type, seriesData]);

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
            if (!isClosingHedge) {
              setOriginalClosePriceTemp(closePrice);
            } else {
              setHedgeClosePriceTemp(closePrice);
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

  useEffect(() => {
    if (originalClosePriceTemp !== null && hedgeClosePriceTemp !== null) {
      const payout = type === 'spot' 
        ? calculatePayoutShort(quantity, spot_entry_price, originalClosePriceTemp, hedgingRatio, marginRate, twoWeeksVolume).hedgedPayout 
        : calculatePayoutFuture(quantity, spot_entry_price, futures_entry_price, originalClosePriceTemp, hedgeClosePriceTemp, hedgingRatio, twoWeeksVolume).hedgedPayout;

      const parsedPayout = parseFloat(payout.replace(/,/g, ''));
      if (!isNaN(parsedPayout)) {
        setAdjustedPayout(parsedPayout);
      } else {
        console.error('Payout is not a valid number:', payout);
      }

      setOriginalClosePrice(originalClosePriceTemp);
      setHedgeClosePrice(hedgeClosePriceTemp);
    }
  }, [type, setAdjustedPayout, originalClosePriceTemp, hedgeClosePriceTemp]);

  const handlePositionToggle = (position) => {
    setActivePosition(position);
  };

  return (
    <div id="chart">
      <div className="chart-tools">
        <div className="position-buttons">
          <button 
            onClick={() => {setIsClosingHedge(false), handlePositionToggle('long')}} 
            className={activePosition === 'long' ? 'active' : ''}
          >
            Long Position
          </button>
          <button 
            onClick={() => {setIsClosingHedge(true), handlePositionToggle('hedge')}} 
            className={activePosition === 'hedge' ? 'active' : ''}
          >
            Hedge Position
          </button>
        </div>
        <div className="reload-button-container">
          <button onClick={generateTrend} className="reload-button">
            <FaRedo /> Generate New Trend
          </button>
        </div>
          
        
      </div>
      <p className="instructions">
        Select a position type (Long or Hedge) and click on the chart to set or modify the close price for the selected position.
      </p>
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
  setAdjustedPayout: PropTypes.func.isRequired,
  setOriginalClosePrice: PropTypes.func.isRequired,
  setHedgeClosePrice: PropTypes.func.isRequired,
  setBestPayout: PropTypes.func.isRequired,
};

export default TrendsChart;
