#!/bin/bash
# 更新 GitHub 贡献数据（运行在本地终端）
# 运行方式：bash scripts/update-contrib-data.sh
set -e

echo "Fetching GitHub contributions data..."
curl -s "https://likeyou.it.eu.org/https://github.com/users/IWanalq/contributions" | \
  grep -oP 'data-date="[^"]*".*?data-level="\d"' | \
  sed -E 's/.*data-date="([^"]+)".*data-level="([0-9]+)"/"\1":\2/' | \
  paste -sd, - > /tmp/ghc_fresh.txt

echo "var GHC_DATA = {" > static/contrib-data.js
cat /tmp/ghc_fresh.txt >> static/contrib-data.js
echo "};" >> static/contrib-data.js

echo "Done. $(wc -c < static/contrib-data.js) bytes written to static/contrib-data.js"
