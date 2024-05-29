#!/bin/bash

# We need to rebuild the front-end if configuration differs from default

hash_file=dist/.hash
hash="$(tar cf - "config/$CONFIG" | sha1sum) $BASE"

if [[ -e $hash_file && "$hash" == "$(cat $hash_file)" ]]; then
  echo "Front-end rebuild skipped."
else
  echo "Rebuilding front-end because configuration changed..."
  # Build the site
  npm run build
  # Remember the current $BASE
  echo "$hash" > $hash_file
fi
