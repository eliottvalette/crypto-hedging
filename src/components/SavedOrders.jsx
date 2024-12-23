import { useState, useEffect, useContext } from 'react';
import { getSpotPrice } from '../utils/data';
import { calculatePayoutShortDelay, calculatePayoutFutureDelay } from '../utils/hedging';
import { getPositions } from '../utils/firestore';
import { UserContext } from './UserContext';

const SavedOrders = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  
  // Example of stored hedge positions
  const [hedgePositions, setHedgePositions] = useState([
    {
      id: 1,
      symbol: 'BTCUSDT',
      longPosition: {
        quantity: 0.5,
        entryPrice: 50000,
        value: 25000
      },
      hedgePosition: {
        type: 'short',
        quantity: 0.1,
        entryPrice: 5000,
        leverage: 10,
        margin: 2500
      },
      hedgingRatio: 0.1,
      status: 'active',
      closePrice: null,
      pnl: null
    },
    {
      id: 2,
      symbol: 'ETHUSDT',
      longPosition: {
        quantity: 2,
        entryPrice: 3000,
        value: 6000
      },
      hedgePosition: {
        type: 'futures',
        quantity: 1,
        entryPrice: 600,
        leverage: 5,
        margin: 600
      },
      hedgingRatio: 0.5,
      status: 'closed',
      LongclosePrice: 220,
      HedgeclosePrice: 220,
      pnl: null
    },
    {
      id: 3,
      symbol: 'SOLUSDT',
      longPosition: {
        quantity: 15,
        entryPrice: 100,
        value: 1500
      },
      hedgePosition: {
        type: 'short',
        quantity: 10,
        entryPrice: 33,
        leverage: 3,
        margin: 333
      },
      hedgingRatio: 0.66,
      status: 'active',
      LongclosePrice: null,
      HedgeclosePrice: null,
      pnl: null
    },
    {
      id: 4,
      symbol: 'BNBUSDT',
      longPosition: {
        quantity: 5,
        entryPrice: 250,
        value: 1250
      },
      hedgePosition: {
        type: 'futures',
        quantity: 5,
        entryPrice: 50,
        leverage: 2,
        margin: 625
      },
      hedgingRatio: 1,
      status: 'closed',
      LongclosePrice: 20,
      HedgeclosePrice: 22,
      pnl: null
    },
    {
      id: 5,
      symbol: 'ADAUSDT',
      longPosition: {
        quantity: 1000,
        entryPrice: 0.5,
        value: 500
      },
      hedgePosition: {
        type: 'short',
        quantity: 500,
        entryPrice: 0.5,
        leverage: 4,
        margin: 62.5
      },
      hedgingRatio: 0.5,
      status: 'active',
      LongclosePrice: null,
      HedgeclosePrice: null,
      pnl: null
    }
  ]);

  // Fetch saved positions from Firebase
  useEffect(() => {
    const fetchSavedPositions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const savedPositions = await getPositions(user.uid);
        // Combine example positions with saved positions
        setHedgePositions(prevPositions => {
          // Filter out any duplicates based on id
          const existingIds = new Set(prevPositions.map(p => p.id));
          const newSavedPositions = savedPositions.filter(p => !existingIds.has(p.id));
          return [...prevPositions, ...newSavedPositions];
        });
      } catch (error) {
        console.error('Error fetching saved positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPositions();
  }, [user]);

  // Add useEffect for P&L calculation
  useEffect(() => {
    const calculatePnL = async () => {
      const updatedPositions = await Promise.all(
        hedgePositions.map(async (position) => {
          if (position.status === 'closed') {
            const pnl = position.hedgePosition.type === 'short'
              ? calculatePayoutShortDelay(
                  position.longPosition.quantity,
                  position.longPosition.entryPrice,
                  position.LongclosePrice,
                  position.HedgeclosePrice,
                  position.hedgingRatio,
                  0
                ).hedgedPayout
              : calculatePayoutFutureDelay(
                  position.longPosition.quantity,
                  position.longPosition.entryPrice,
                  position.hedgePosition.entryPrice,
                  position.LongclosePrice,
                  position.HedgeclosePrice,
                  position.hedgingRatio,
                  0
                ).hedgedPayout;
            return { ...position, pnl };
          }

          try {
            const currentPrice = await getSpotPrice(position.symbol);
            if (!currentPrice) return position;

            const pnl = position.hedgePosition.type === 'short'
              ? calculatePayoutShortDelay(
                  position.longPosition.quantity,
                  position.longPosition.entryPrice,
                  currentPrice,
                  currentPrice,
                  position.hedgingRatio,
                  0
                ).hedgedPayout
              : calculatePayoutFutureDelay(
                  position.longPosition.quantity,
                  position.longPosition.entryPrice,
                  position.hedgePosition.entryPrice,
                  currentPrice,
                  currentPrice,
                  position.hedgingRatio,
                  0
                ).hedgedPayout;
            return { ...position, pnl };
          } catch (error) {
            console.error(`Error calculating P&L for position ${position.id}:`, error);
            return position;
          }
        })
      );

      setHedgePositions(updatedPositions);
    };

    calculatePnL();
    const interval = setInterval(calculatePnL, 60000);
    return () => clearInterval(interval);
  }, [hedgePositions]);

  // Implement missing handler functions
  const handleClosePosition = async (positionId) => {
    try {
      const currentPrice = await getSpotPrice(
        hedgePositions.find(p => p.id === positionId)?.symbol
      );
      
      setHedgePositions(positions => 
        positions.map(position => 
          position.id === positionId
            ? {
                ...position,
                status: 'closed',
                LongclosePrice: currentPrice,
                HedgeclosePrice: currentPrice
              }
            : position
        )
      );
    } catch (error) {
      console.error('Error closing position:', error);
    }
  };

  const handleEditPosition = (positionId) => {
    // For now, just log that this functionality needs to be implemented
    console.log('Edit position functionality to be implemented for position:', positionId);
  };

  const formatNumber = (number) => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const filteredPositions = hedgePositions.filter(position => 
    statusFilter === 'all' || position.status === statusFilter
  );

  return (
    <div className="saved-orders">
      <h2>Saved Hedge Positions</h2>
      
      <div className="filter-buttons">
        <button 
          className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Positions
        </button>
        <button 
          className={`filter-button ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Active
        </button>
        <button 
          className={`filter-button ${statusFilter === 'closed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('closed')}
        >
          Closed
        </button>
      </div>

      {isLoading ? (
        <div className="loading-message">Loading positions...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Long Position</th>
              <th>Hedge Details</th>
              <th>Coverage</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>P&L</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPositions.map((position) => {
              const totalValue = position.longPosition.value + position.hedgePosition.margin;
              
              return (
                <tr key={position.id}>
                  <td>{position.symbol}</td>
                  <td>
                    <div>{position.longPosition.quantity} {position.symbol.replace('USDT', '')}</div>
                    <div className="entry-price">@ ${formatNumber(position.longPosition.entryPrice)}</div>
                  </td>
                  <td>
                    <div>
                      {position.hedgePosition.type.charAt(0).toUpperCase() + position.hedgePosition.type.slice(1)}
                      {' '}{position.hedgePosition.quantity} {position.symbol.replace('USDT', '')}
                    </div>
                    <div className="entry-price">
                      @ ${formatNumber(position.hedgePosition.entryPrice)} ({position.hedgePosition.leverage}x)
                    </div>
                  </td>
                  <td>{position.hedgingRatio * 100}%</td>
                  <td>${formatNumber(totalValue)}</td>
                  <td>
                    <span className={`status-${position.status}`}>
                      {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {position.pnl !== null ? (
                      <span className={position.pnl >= 0 ? 'profit' : 'loss'}>
                        {position.pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs(position.pnl))}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-button close-button"
                        onClick={() => handleClosePosition(position.id)}
                        disabled={position.status === 'closed'}
                      >
                        Close
                      </button>
                      <button 
                        className="action-button edit-button"
                        onClick={() => handleEditPosition(position.id)}
                        disabled={position.status === 'closed'}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SavedOrders;
