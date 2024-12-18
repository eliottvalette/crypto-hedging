import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import { savedTrends } from '../utils/trends';
import { calculatePayoutFuture, calculatePayoutShort, calculateBestPayout } from '../utils/hedging';
import { useState, useEffect } from 'react';
import { FaRedo } from 'react-icons/fa';
import 'apexcharts/dist/apexcharts.css';

const TrendsChart = ({
  trend,
  quantity,
  hedgingRatio,
  type,
  marginRate,
  spotEntryPrice,
  futuresEntryPrice,
  generateNewTrend,
  setAdjustedPayout,
  setOriginalClosePrice,
  setHedgeClosePrice,
  setBestPayout,
}) => {
  const [twoWeeksVolume, setTwoWeeksVolume] = useState(0);
  const [seriesData, setSeriesData] = useState(savedTrends[trend]);
  const [isClosingHedge, setIsClosingHedge] = useState(false);
  const spot_entry_price = parseFloat(spotEntryPrice) || 0;
  const futures_entry_price = parseFloat(futuresEntryPrice) || 0;
  const [originalClosePriceTemp, setOriginalClosePriceTemp] = useState(null);
  const [hedgeClosePriceTemp, setHedgeClosePriceTemp] = useState(null);
  const [activePosition, setActivePosition] = useState('long');
  const [annotations, setAnnotations] = useState({
    xaxis: [],
  });

  const formatNumber = (number) => {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateAmplitude = (data) => {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
  
    data.forEach(dataPoint => {
      const [open, high, low, close] = dataPoint.y.map(value => value * spot_entry_price / 100);
      if (high > max) max = high;
      if (low < min) min = low;
    });
  
    return {max, min};
  };

  const generateTrend = () => {
    setAnnotations({ xaxis: [] });

    const newTrends = generateNewTrend();
    savedTrends['upTrend'] = newTrends['upTrend'];
    savedTrends['downTrend'] = newTrends['downTrend'];
    savedTrends['sideTrend'] = newTrends['sideTrend'];
    setSeriesData(newTrends[trend]);
    setIsClosingHedge(false); // Reset hedge closing state
  };

  useEffect(() => {
    setSeriesData(savedTrends[trend]);
  }, [trend]);

  const startDate = new Date();

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
    setBestPayout({ bestSpotPayout, bestHedgedPayout });
  }, [isClosingHedge, type, seriesData, trend, hedgingRatio]);

  const {max, min} = calculateAmplitude(seriesData);
  const midPoint = (max + min) / 2;

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
            const closeTime = new Date(adjustedSeriesData[dataPointIndex].x).getTime();
            const labelPosition = closePrice > midPoint ? 'bottom' : 'top';
      
            if (!isClosingHedge) {
              setOriginalClosePriceTemp(closePrice);
      
              setAnnotations((prev) => ({
                xaxis: [
                  ...prev.xaxis.filter((ann) => ann.id !== 'original'),
                  {
                    id: 'original',
                    x: closeTime,
                    borderColor: 'var(--color-light-green)',
                    label: {
                      borderColor: 'var(--color-light-green)',
                      position: labelPosition, // Dynamic position
                      style: {
                        color: 'var(--color-dark-teal)',
                        background: 'var(--color-light-green)',
                      },
                      text: `Original Close: $${closePrice}`,
                    },
                  },
                ],
              }));
            } else {
              setHedgeClosePriceTemp(closePrice);
      
              setAnnotations((prev) => ({
                xaxis: [
                  ...prev.xaxis.filter((ann) => ann.id !== 'hedge'),
                  {
                    id: 'hedge',
                    x: closeTime,
                    borderColor: 'var(--color-red)',
                    label: {
                      borderColor: 'var(--color-red)',
                      position: labelPosition, // Dynamic position
                      style: {
                        color: 'var(--color-dark-teal)',
                        background: 'var(--color-red)',
                      },
                      text: `Hedge Close: $${closePrice}`,
                    },
                  },
                ],
              }));
            }
          }
        },
      },
    },
    annotations: annotations,
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
          downward: '#EF403C',
        },
        fill: {
          opacity: 1,
        },
      },
    },
    tooltip: {
      shared: true,
      custom: ({ dataPointIndex }) => {
        const { spotPayout, hedgedPayout } = adjustedSeriesData[dataPointIndex];

        const spotColor = parseFloat(spotPayout) >= 0 ? '#28a745' : '#dc3545';
        const hedgedColor = parseFloat(hedgedPayout) >= 0 ? '#17a2b8' : '#ffc107';

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
      console.log('Calculating payouts...', originalClosePriceTemp, hedgeClosePriceTemp);
      const payout = type === 'spot'
        ? calculatePayoutShort(quantity, spot_entry_price, originalClosePriceTemp, hedgingRatio, twoWeeksVolume).hedgedPayout
        : calculatePayoutFuture(quantity, spot_entry_price, futures_entry_price, originalClosePriceTemp, hedgeClosePriceTemp, hedgingRatio, twoWeeksVolume).hedgedPayout;
      console.log('Payout:', payout);
      const parsedPayout = parseFloat(payout.replace(/,/g, ''));
      if (!isNaN(parsedPayout)) {
        setAdjustedPayout(parsedPayout);
        console.log('Adjusted Payout:', parsedPayout);
      }

      setOriginalClosePrice(originalClosePriceTemp);
      setHedgeClosePrice(hedgeClosePriceTemp);
    }
  }, [originalClosePriceTemp, hedgeClosePriceTemp]);

  return (
    <div id="chart">
      <div className="chart-tools">
        <div className="position-buttons">
          <button
            onClick={() => { setIsClosingHedge(false); setActivePosition('long'); }}
            className={activePosition === 'long' ? 'long-button active' : 'long-button'}
          >
            Long Position
          </button>
          <button
            onClick={() => { setIsClosingHedge(true); setActivePosition('hedge'); }}
            className={activePosition === 'hedge' ? 'hedge-button active' : 'hedge-button'}
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
      <Chart
        options={options}
        series={[{ data: adjustedSeriesData }]}
        type="candlestick"
        height={350}
      />
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
