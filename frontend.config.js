export const network = {
  id: 'reef-testnet',
  name: 'Testnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: 'wss://rpc.reefscan.com/ws',
  backendWs: 'ws://localhost:4350/graphql',
  backendHttp: 'http://localhost:4350/graphql',
  verificatorApi: 'http://localhost:8000/api/verificator/submit-verification',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
export const paginationOptions = [10, 20, 50, 100]
