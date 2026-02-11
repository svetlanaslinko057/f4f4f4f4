#!/bin/bash
# Restore seeds from JSON files

DB_NAME="connections_db"
SEEDS_DIR="/app/scripts/seeds"

echo "[Restore] Starting seed restore for $DB_NAME..."

# Create seeds directory if not exists
mkdir -p "$SEEDS_DIR"

# Function to import collection
import_collection() {
    local collection=$1
    local file="$SEEDS_DIR/${collection}.json"
    
    if [ -f "$file" ]; then
        # Check if collection is empty
        count=$(mongosh --quiet "$DB_NAME" --eval "db.$collection.countDocuments()")
        if [ "$count" = "0" ]; then
            echo "[Restore] Importing $collection from $file..."
            mongoimport --db "$DB_NAME" --collection "$collection" --file "$file" --jsonArray 2>/dev/null || \
            mongoimport --db "$DB_NAME" --collection "$collection" --file "$file" 2>/dev/null
            echo "[Restore] $collection imported"
        else
            echo "[Restore] $collection already has $count documents, skipping"
        fi
    else
        echo "[Restore] No seed file for $collection"
    fi
}

# Import core collections
import_collection "connections_unified_accounts"
import_collection "connections_reality_ledger"
import_collection "connections_backers"
import_collection "twitter_sessions"
import_collection "twitter_egress_slots"
import_collection "proxy_slots"

echo "[Restore] Seed restore complete"
