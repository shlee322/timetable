#!/bin/bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" != "master" ]; then
    exit 0
fi

git checkout gh-pages
git merge master
