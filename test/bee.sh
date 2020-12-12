#!/bin/sh
if [ ! -d /tmp/bee ] ; then
   mkdir -p /tmp/bee/data && \
   chown $(id -u):999 -R /tmp/bee && \
   chmod 770 -R /tmp/bee && \
   echo "password" > /tmp/bee/password
fi
docker run $@ \
  -p 1635:1635 \
  -p 1634:1634 \
  -p 1633:1633 \
  --volume /tmp/bee:/bee \
  --interactive \
  --tty \
  "ethersphere/bee:0.4.0" \
    start \
    --data-dir /bee/data \
    --password-file /bee/password \
    --standalone=true \
    --swap-enable=false \
    --cors-allowed-origins="*"
