#!/bin/bash
scp output.png root@100.64.1.114:/mnt/us/
ssh root@100.64.1.114 '/usr/sbin/eips -g /mnt/us/output.png -f && rm /mnt/us/output.png'
