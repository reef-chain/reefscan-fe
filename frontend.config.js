export const network = {
  id: 'reef-testnet',
  name: 'Testnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: 'wss://rpc-testnet.reefscan.com/ws',
  backendWs: 'wss://squid.subsquid.io/reef-explorer-testnet/graphql',
  backendHttp: 'https://squid.subsquid.io/reef-explorer-testnet/graphql',
  verificatorApi:
    'https://testnet.reefscan.com/api/verificator/submit-verification',
  uploadTokenApi:
    'https://testnet.reefscan.com/api/verificator/submit-verification',
  solidityScanApi: 'https://testnet.reefscan.com/api/solidity_scan/',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
export const paginationOptions = [10, 20, 50, 100]
