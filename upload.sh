#!/bin/bash
npm start
bash -c "convert png:output.png -colorspace lineargray -define png:color-type=0 -define png:bit-depth=8 output.png"
scp output.png root@100.64.1.114:/mnt/us/
ssh root@100.64.1.114 '/usr/sbin/eips -g /mnt/us/output.png -f && rm /mnt/us/output.png'
