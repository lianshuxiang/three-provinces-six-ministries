#!/bin/bash
cd /home/admin/.openclaw
export GLM_API_KEY='46bb097a7ba84682ba2265e6145f003e.7bms2oMiEgHeJRwq'
node test1-fengbo-iteration.js 2>&1 | tee /home/admin/.openclaw/workspace/test1-fengbo-iteration.log
