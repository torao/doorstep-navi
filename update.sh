#!/bin/bash

eips_option=
if [ $(date +"%M") == "00" ]
then
  eips_option=-f
fi

cd /home/torao/git/doorstep-navi \
&& npm start \
&& convert png:output.png -colorspace lineargray -define png:color-type=0 -define png:bit-depth=8 output.png \
&& scp output.png root@hazm.at:/root/hazmat-contents/docroot/doorstep-navi/screen.png \
&& cp output.png output01.png \
&& convert png:output.png -resize 768x1024 output02.png \
&& for i in 1 2; \
  do scp output0$i.png kindle0$i:/mnt/us/ \
  && ssh kindle0$i "for c in powerd framework; do if [ \`initctl status \$c | grep start/running | wc -l\` -eq 1 ]; then initctl stop \$c; fi done; /usr/sbin/eips -g /mnt/us/output0$i.png $eips_option && rm /mnt/us/output0$i.png" \
  && rm output0$i.png; \
  done
