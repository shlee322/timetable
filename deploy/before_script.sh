#!/bin/bash

ORIGIN=$(git rev-parse origin/master)
BRANCH=$(git rev-parse HEAD)

if [ "$BRANCH" != "$ORIGIN" ]; then
    exit 0
fi

git checkout gh-pages
git merge master
