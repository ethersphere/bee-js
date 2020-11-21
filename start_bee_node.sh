#!/bin/sh
mkdir -p /tmp/bee/data && \
chmod -R 777 /tmp/bee/data && \
echo "password" > /tmp/bee/password && \
docker run $@ \
  -p 6060:6060 \
  -p 7070:7070 \
  -p 8080:8080 \
  --volume /tmp/bee:/bee \
  --interactive \
  --tty \
  "ethersphere/bee:0.3.1" \
    start \
    --data-dir /bee/data \
    --password-file /bee/password \
    --standalone=true \
    --swap-enable=false \
    --verbosity=5
