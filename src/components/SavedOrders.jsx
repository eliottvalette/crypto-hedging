import { useState } from 'react';

const SavedOrders = () => {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', or 'closed'
  
  // Example of stored hedge positions
  const [hedgePositions] = useState([
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
      hedgingRatio: 100,
      status: 'active',
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
      hedgingRatio: 50,
      status: 'closed',
      pnl: 450
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
      hedgingRatio: 66.7,
      status: 'active',
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
      hedgingRatio: 100,
      status: 'closed',
      pnl: -120
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
      hedgingRatio: 50,
      status: 'active',
      pnl: null
    }
  ]);

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
                <td>{position.hedgingRatio}%</td>
                <td>${formatNumber(totalValue)}</td>
                <td>
                  <span className={`status-${position.status}`}>
                    {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                  </span>
                </td>
                <td>
                  {position.pnl !== null ? (
                    <span className={position.pnl >= 0 ? 'profit' : 'loss'}>
                      ${formatNumber(Math.abs(position.pnl))}
                      {position.pnl >= 0 ? ' ▲' : ' ▼'}
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
    </div>
  );
};

export default SavedOrders;
