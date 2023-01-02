#!/bin/bash
# Parse the command line options
#while getopts ":d:s:r:" opt; do
#  case $opt in
#    d)
#      directory=$OPTARG
#      ;;
#    s)
#      search=$OPTARG
#      ;;
#    r)
#      replace=$OPTARG
#      ;;
#    \?)
#      echo "Invalid option: -$OPTARG" >&2
#      exit 1
#      ;;
#    :)
#      echo "Option -$OPTARG requires an argument." >&2
#      exit 1
#      ;;
#  esac
#done
# Shift the options to get the remaining arguments
#shift $((OPTIND - 1))
#echo "replacing $search with $replace in $directory"

declare -a arr=("GQL_WS_URI" "GQL_HTTP_URI")
#declare -a arr=("GQL_WS_URI" "GQL_HTTP_URI" "NODE_WS" "VERIFICATOR_API")
directory=/usr/share/nginx/html/_nuxt

echo "replacing ===================================="


# Loop over all files in the directory
for file in $directory/*; do
  # Replace the search term with the replace term in the file
#  sed -i "s~$search~$replace~g" $file
  for i in "${arr[@]}"
  do
      newValue=${!i}
      echo "newVal=$newValue"

  done
done
