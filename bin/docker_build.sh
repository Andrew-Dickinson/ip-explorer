#!/bin/bash

set -xe

export GIT_COMMIT_HASH=$(git rev-parse HEAD)
echo "Building commit hash: $GIT_COMMIT_HASH into container image"

docker build --tag ip-explorer --build-arg GIT_COMMIT_HASH .