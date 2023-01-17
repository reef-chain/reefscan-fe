// export const network = {
//   id: '&NETWORK_ID',
//   name: '&NETWORK_LABEL',
//   tokenSymbol: 'REEF',
//   tokenDecimals: 18,
//   ss58Format: 42,
//   coinGeckoDenom: 'reef',
//   nodeWs: '&NODE_WS',
//   backendWs: '&GQL_WS_URI',
//   backendHttp: '&GQL_HTTP_URI',
//   verificatorApi: '&VERIFICATOR_API',
//   googleAnalytics: '',
//   theme: '@/assets/scss/themes/reef.scss',
// }
export const network = {
  id: 'reef-mainnet',
  name: 'Mainnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: 'wss://rpc.reefscan.com/ws',
  backendWs: 'wss://squid.subsquid.io/reef-explorer/graphql',
  backendHttp: 'https://squid.subsquid.io/reef-explorer/graphql',
  // backendWs: 'ws://localhost:4350/graphql',
  // backendHttp: 'http://localhost:4350/graphql',
  verificatorApi: 'https://reefscan.com/api/verificator/submit-verification',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
console.log('network config=', network)

export const paginationOptions = [10, 20, 50, 100]
