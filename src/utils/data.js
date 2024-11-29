import axios from 'axios';

const apiKey = 'PK2S0D4VH3CU12CHZQ66';
const apiSecret = 'WWpcF15UaNdDKO3v7tBSzjj4DEciWJmw4mNft7Bd';
const baseUrl = 'https://data.alpaca.markets/v1beta2/crypto';

const headers = {
  'APCA-API-KEY-ID': apiKey,
  'APCA-API-SECRET-KEY': apiSecret,
};

export default async function fetchHistoricalData(symbol, startDate, endDate, timeframe) {
  try {
    const url = `${baseUrl}/bars?symbols=${symbol}&timeframe=${timeframe}&start=${startDate}&end=${endDate}`;
    console.log('Request URL:', url); // Debugging
    
    const response = await axios.get(url, { headers });
    if (response.data && response.data.bars) {
      console.log('Fetched Historical Data:', response.data.bars[symbol]);
      return response.data.bars[symbol]; // Bars for the requested symbol
    } else {
      console.error('No bars returned in the response.');
      return null;
    }
  } catch (error) {
    console.error(`Error fetching historical data: ${error.message}`);
    return null;
  }
}

const fetchSupportedCryptoSymbols = async () => {
    try {
      const response = await axios.get('https://api.alpaca.markets/v2/assets', {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
        },
        params: { asset_class: 'crypto' },
      });
      console.log('Supported Symbols:', response.data);
    } catch (error) {
      console.error('Error fetching supported symbols:', error.message);
    }
  };

  