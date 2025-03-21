#! /bin/bash

# This script bumps the version of the project by incrementing the patch version.
# It also updates the version in the package.json file.

# Either read the current version from the package.json file or get it as an argument
if [ $# -eq 0 ]; then
    old_version=$(grep -oP '"version": "\K(.*)(?=")' package.json)
    version=$(echo $old_version | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
    echo "Bumping version from $old_version to $version"
else
    version=$1
fi

# Update the version in the package.json file
sed -i "s/\"version\": \".*\"/\"version\": \"$version\"/" package.json

# Add new heading to the CHANGELOG.md file

# Get the current date
date=$(date +"%Y-%m-%d")

# Create the new heading
new_heading="## $version ($date)"

# Insert the new heading on line 3 of the CHANGELOG.md file
sed -i "3i$new_heading\n\n- Summarize your changes ...\n" CHANGELOG.md
