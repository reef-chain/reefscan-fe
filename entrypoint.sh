#!/bin/sh
set -e

CONFIG_FILE="/usr/src/app/frontend.config.js"

echo "Replacing placeholders in $CONFIG_FILE using runtime ENV vars..."

sed -i "s|&NETWORK_ID|${NETWORK_ID}|g" $CONFIG_FILE
sed -i "s|&NETWORK_LABEL|${NETWORK_LABEL}|g" $CONFIG_FILE
sed -i "s|&NODE_WS|${NODE_WS}|g" $CONFIG_FILE
sed -i "s|&GQL_WS_URI|${GQL_WS_URI}|g" $CONFIG_FILE
sed -i "s|&GQL_HTTP_URI|${GQL_HTTP_URI}|g" $CONFIG_FILE
sed -i "s|&VERIFICATOR_API|${VERIFICATOR_API}|g" $CONFIG_FILE
sed -i "s|&UPLOAD_TOKEN_API|${UPLOAD_TOKEN_API}|g" $CONFIG_FILE
sed -i "s|&SOLIDITY_SCAN_API|${SOLIDITY_SCAN_API}|g" $CONFIG_FILE

echo "Config replaced successfully."

# echo "Building Nuxt at runtime..."
# yarn build

echo "Starting Nuxt..."
exec yarn dev
