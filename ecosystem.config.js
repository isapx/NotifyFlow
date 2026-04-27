{
  "name": "notifyapp",
  "script": "npm",
  "args": "start",
  "env": {
    "NODE_ENV": "production",
    "PORT": 3000
  },
  "env_production": {
    "NODE_ENV": "production",
    "PORT": 3000
  },
  "env_development": {
    "NODE_ENV": "development",
    "PORT": 3000
  },
  "instances": 1,
  "autorestart": true,
  "watch": false,
  "max_memory_restart": "1G",
  "error_log": "/var/log/notifyapp/error.log",
  "out_log": "/var/log/notifyapp/out.log",
  "log_log": "/var/log/notifyapp/combined.log",
  "time": true,
  "merge_logs": true,
  "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
}