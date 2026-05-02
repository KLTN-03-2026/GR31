#!/bin/bash
chmod +x /home/site/wwwroot/startup.sh # Thêm dòng này
pip install -r /home/site/wwwroot/requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000