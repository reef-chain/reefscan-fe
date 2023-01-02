# Parse the command line options
while getopts ":d:s:r:" opt; do
  case $opt in
    d)
      directory=$OPTARG
      ;;
    s)
      search=$OPTARG
      ;;
    r)
      replace=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# Shift the options to get the remaining arguments
shift $((OPTIND - 1))
echo "replacing $search with $replace in $directory"

# Loop over all files in the directory
for file in $directory/*; do
  # Replace the search term with the replace term in the file
  sed -i "s~$search~$replace~g" $file
done
