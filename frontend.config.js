export const network = {
  id: '&NETWORK_ID',
  name: '&NETWORK_LABEL',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: '&NODE_WS',
  backendWs: '&GQL_WS_URI',
  backendHttp: '&GQL_HTTP_URI',
  verificatorApi: '&VERIFICATOR_API',
  uploadTokenApi: '&UPLOAD_TOKEN_API',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
  solidityScanApi: '&SOLIDITY_SCAN_API',
}
// console.log('network config=', network)
console.log('v2.0.2');

export const paginationOptions = [10, 20, 50, 100]
