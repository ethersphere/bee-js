#!/bin/sh
# --ephemeral -> create ephemeral container for bee-client. Data won't be persisted
BEE_CONTAINER=$(docker container ls -qaf name=bee-test)
if [ -z "$BEE_CONTAINER" ] || [ "$1" = "--ephemeral" ] ; then
  BEE_IMAGE="ethersphere/bee:0.4.1"
  BEE_PASSWORD="password"
  CONTAINER_NAME="bee-test"
  EXTRA_PARAMS=" --name $CONTAINER_NAME"
  if [ "$1" = "--ephemeral" ] ; then
    EXTRA_PARAMS=" --rm"
  fi
  docker run \
    -p 127.0.0.1:1635:1635 \
    -p 127.0.0.1:1634:1634 \
    -p 127.0.0.1:1633:1633 \
    --interactive \
    --tty \
    $EXTRA_PARAMS \
    $BEE_IMAGE \
      start \
      --password $BEE_PASSWORD \
      --standalone=true \
      --swap-enable=false \
      --debug-api-enable \
      --cors-allowed-origins="*"
else
  docker start -ai "$BEE_CONTAINER"
fi
