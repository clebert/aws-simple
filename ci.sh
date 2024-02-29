#!/bin/bash
set -e           # Terminates script at the first error
set -o pipefail  # Sets the exit status for pipes
set -u           # Triggers an error when an unset variable is called
set -o noclobber # Prevents from overwriting existing files
npm run ci
