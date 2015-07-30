#!/bin/bash

ORIGIN=$(git rev-parse origin/master)
BRANCH=$(git rev-parse HEAD)

if [ "$BRANCH" != "$ORIGIN" ]; then
    exit 0
fi

git config --global user.name "Sanghyuck Lee"
git config --global user.email shlee322@elab.kr

git fetch origin gh-pages
git checkout FETCH_HEAD
git checkout -b gh-pages
git merge -m "Merge branch 'master' into gh-pages" master
