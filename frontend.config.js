export const network = {
  id: 'reef-testnet',
  name: 'Testnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: '&NODE_WS',
  backendWs: '&GQL_WS_URI',
  backendHttp: '&GQL_HTTP_URI',
  verificatorApi: '&VERIFICATOR_API',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
console.log('network config=', network)

export const paginationOptions = [10, 20, 50, 100]
