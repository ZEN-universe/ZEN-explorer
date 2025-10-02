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

# Update the version in the package.json and package-lock.json file
sed -i "s/\"version\": \".*\"/\"version\": \"$version\"/" package.json
npm install

# Add new heading to the CHANGELOG.md file

# Get the current date
date=$(date +"%Y-%m-%d")

# Create the new heading
new_heading="## $version ($date)"

# Get all commit messages since the last commit that updated the changelog
last_changelog_commit=$(git log -n 1 --pretty=format:%H -- CHANGELOG.md)
if [ -z "$last_changelog_commit" ]; then
    commit_messages=$(git log --pretty=format:"- %s")
else
    commit_messages=$(git log $last_changelog_commit..HEAD --pretty=format:"- %s")
fi

# Insert the new heading on line 3 of the CHANGELOG.md file
awk -v heading="$new_heading" -v commits="$commit_messages" 'NR==3{print heading "\n\n" commits "\n"} {print}' CHANGELOG.md > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
