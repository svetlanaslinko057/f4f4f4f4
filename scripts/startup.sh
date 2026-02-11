#!/bin/bash
# Startup script for FOMO Backend

echo "[Startup] Checking MongoDB connection..."

# Wait for MongoDB
for i in {1..30}; do
    if mongosh --quiet --eval "db.runCommand({ping:1})" > /dev/null 2>&1; then
        echo "[Startup] MongoDB is ready"
        break
    fi
    echo "[Startup] Waiting for MongoDB... ($i/30)"
    sleep 1
done

# Restore seeds if they exist
if [ -f "/app/scripts/restore-seeds.sh" ]; then
    echo "[Startup] Running restore-seeds.sh..."
    bash /app/scripts/restore-seeds.sh
fi

echo "[Startup] Complete"
