#!/bin/bash

docker build \                           
  --build-arg NETWORK_ID="reef-mainnet" \
  --build-arg NETWORK_LABEL="Mainnet" \
  --build-arg NODE_WS="ws://rpc.reefscan.info/ws" \
  --build-arg GQL_WS_URI="ws://rpc.reefscan.info/ws" \
  --build-arg GQL_HTTP_URI="https://squid.subsquid.io/reef-explorer/graphql" \
  --build-arg VERIFICATOR_API="https://reefscan.com/api/verificator/submit-verification" \
  --build-arg UPLOAD_TOKEN_API="https://api.reefscan.com/api/updateTokenIcon" \
  --build-arg SOLIDITY_SCAN_API="https://api.reefscan.com/api/solidity_scan/" \
  -t reef-frontend .


# the above command will make the frontend.config.js ->
# export const network = {
#   id: 'reef-mainnet',
#   name: 'Mainnet',
#   tokenSymbol: 'REEF',
#   tokenDecimals: 18,
#   ss58Format: 42,
#   coinGeckoDenom: 'reef',
#   nodeWs: 'ws://rpc.reefscan.info/ws',
#   backendWs: 'ws://rpc.reefscan.info/ws',
#   backendHttp: 'https://squid.subsquid.io/reef-explorer/graphql',
#   verificatorApi: 'https://reefscan.com/api/verificator/submit-verification',
#   uploadTokenApi: 'https://api.reefscan.com/api/updateTokenIcon',
#   solidityScanData: 'https://api.reefscan.com/api/solidity_scan/',
#   googleAnalytics: '',
#   theme: '@/assets/scss/themes/reef.scss',
# }

# export const paginationOptions = [10, 20, 50, 100]