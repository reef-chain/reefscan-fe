export const network = {
  id: 'reef-mainnet',
  name: 'Mainnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: 'wss://rpc.reefscan.info/ws',
  backendWs: 'ws://squid.subsquid.io/reef-explorer/graphql',
  backendHttp: 'https://squid.subsquid.io/reef-explorer/graphql',
  verificatorApi: 'https://reefscan.com/api/verificator/submit-verification',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
export const paginationOptions = [10, 20, 50, 100]
