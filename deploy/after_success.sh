#!/bin/bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" != "gh-pages" ]; then
    exit 0
fi

git add -A data/
git add -A static/
git add index.html

git status

openssl aes-256-cbc -K $encrypted_ec37b4905d5e_key -iv $encrypted_ec37b4905d5e_iv -in deploy/deploy_key.pem.enc -out deploy/deploy_key.pem -d
chmod 600 deploy/deploy_key.pem
eval $(ssh-agent)
ssh-add deploy/deploy_key.pem

git commit -m "Deploy"
git push origin gh-pages
