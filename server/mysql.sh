#!/bin/sh
export LD_LIBRARY_PATH="$HOME/.local/mysql-root/usr/lib/x86_64-linux-gnu"
MYSQL="$HOME/.local/mysql-root/usr"
DATA="$(cd "$(dirname "$0")" && pwd)/data"
mkdir -p "$HOME/.local/mysql-root/files"
exec "$MYSQL/sbin/mysqld" \
  --datadir="$DATA" \
  --basedir="$MYSQL" \
  --lc-messages-dir="$MYSQL/share/mysql" \
  --plugin-dir="$MYSQL/lib/mysql/plugin" \
  --socket=/tmp/smart-estate.sock \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --mysqlx=0 \
  --pid-file=/tmp/smart-estate.pid \
  --secure-file-priv="$HOME/.local/mysql-root/files" \
  --log-error="$HOME/.local/mysql-root/server.err"
