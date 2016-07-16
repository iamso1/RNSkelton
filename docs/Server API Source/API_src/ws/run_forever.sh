#!/bin/bash
### BEGIN INIT INFO
# Provides:  xiyoulib
# Required-Start: $all
# Required-Stop: $all
# Default-Start: 2 3 4 5
# Default-Stop:  0 1 6
# Short-Description: Start daemon at boot time
# Description:  Enable service provided by daemon.
### END INIT INFO
# chkconfig: 345 88 08
# description: Forever for Node.js
#
# forever start -l /data/ws/logs/log --pidFile /data/ws/logs/pid -a /data/ws/app.js


DEAMON=/data/ws/app.js
LOG=/data/ws/logs/log
PID=/data/ws/logs/pid

export PATH=$PATH:/root/.nvm/versions/node/v4.4.4/bin
export NODE_PATH=$NODE_PATH:/data/ws/node_modules

node=node
forever=forever

case "$1" in
 start)
  $forever start -l $LOG --pidFile $PID -a $DEAMON
  ;;
 stop)
  $forever stop --pidFile $PID $DEAMON
  ;;
 stopall)
  $forever stopall --pidFile $PID
  ;;
 restartall)
  $forever restartall --pidFile $PID
  ;;
 reload|restart)
  $forever restart -l $LOG --pidFile $PID -a $DEAMON
  ;;
 list)
  $forever list
  ;;
 *)
  echo "Usage: /etc.init.d/node {start|stop|restart|reload|stopall|restartall|list}"
  exit 1
  ;;
esac