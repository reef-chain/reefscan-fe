#!/bin/bash

declare -a replaceStrings=("GQL_WS_URI" "GQL_HTTP_URI" "NODE_WS" "VERIFICATOR_API" "UPLOAD_TOKEN_API" "NETWORK_ID" "NETWORK_LABEL" "SOLIDITY_SCAN_API")
directory=/usr/share/nginx/html/_nuxt

echo "replacing in $directory ===================================="
# Loop over all files in the directory
for file in "$directory"/*.js; do
  echo "replacing in file=$file"
  for toReplace in "${replaceStrings[@]}"
  do
      envVarValue=${!toReplace}
      echo "replacing=&$toReplace with=$envVarValue"
      sed -i "s~&$toReplace~$envVarValue~g" $file

  done
done

echo "END replacing in $directory ===================================="
