import axios from 'axios'

// Fetches the REEF/USDT ticker data directly from Gate.io API.
const fetchGateReefMarket = async () => {
  try {
    const { data } = await axios.get('/api/reef-price')
    return data || null
  } catch (error) {
    return null
  }
}

export const state = () => ({
  price: null,
  timestamp: null,
  trendType: 'up',
})

export const mutations = {
  update(state, { price, trendType }) {
    state.price = price
    state.trendType = trendType
  },
}

export const getters = {
  usd: (state) => () => {
    return state.price?.usd ?? 0
  },
  usd24hChange: (state) => () => {
    return state.price?.usd_24h_change ?? 0
  },
  trendType: (state) => () => {
    return state.trendType
  },
}

export const actions = {
  async getReefCoinPrice({ commit, state }) {
    const marketData = await fetchGateReefMarket()
    if (!marketData) {
      return
    }

    const currentUsd = parseFloat(marketData.last)
    const usd24hChange = marketData.change_percentage || '0'

    const trendType =
      typeof marketData.change_percentage === 'string' &&
      marketData.change_percentage.startsWith('-')
        ? 'down'
        : 'up'

    const price = {
      usd: currentUsd,
      usd_24h_change: usd24hChange,
    }

    commit('update', { price, trendType })
  },
}
