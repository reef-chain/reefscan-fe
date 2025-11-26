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