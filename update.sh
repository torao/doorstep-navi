#!/bin/bash
cd /home/torao/git/doorstep-navi \
&& npm start \
&& convert png:output.png -colorspace lineargray -define png:color-type=0 -define png:bit-depth=8 output.png \
&& scp output.png kindle:/mnt/us/ \
&& ssh kindle '/usr/sbin/eips -g /mnt/us/output.png && rm /mnt/us/output.png' \
&& scp output.png root@hazm.at:/root/hazmat-contents/docroot/doorstep-navi/screen.png
