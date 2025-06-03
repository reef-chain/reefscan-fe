const axios = require('axios')

/**
 * This function acts as a proxy to fetch the latest REEF price from Gate.io.
 * It retrieves the REEF/USDT ticker data and returns it in JSON format.
 */
module.exports = async function (req, res) {
  try {
    const { data } = await axios.get(
      'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=REEF_USDT'
    )
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data[0]))
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Failed to fetch data from Gate.io' }))
  }
}
