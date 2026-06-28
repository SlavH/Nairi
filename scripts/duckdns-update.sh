#!/bin/bash
# Update DuckDNS with current public IP
# Runs every 5 minutes via cron
curl -s "https://www.duckdns.org/update?domains=nairi-api&token=31d3152b-493c-9538-7826-42c8dbd93068&ip=" > /dev/null
