#!/bin/bash
set -e

echo "Updating system dependencies..."
apt-get update -y
apt-get install -y build-essential libsqlite3-dev pkg-config curl

echo "Installing Rust..."
if ! command -v cargo &> /dev/null
then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi
source $HOME/.cargo/env

echo "Installing Miden CLI..."
if ! command -v miden-client &> /dev/null
then
    cargo install miden-client-cli --locked
fi

echo "Initializing Miden Testnet Client..."
# Just in case there is a previous init
rm -rf ~/.miden || true
miden-client init --network testnet

echo "Generating Wallet..."
OUTPUT=$(miden-client new-wallet)
echo "$OUTPUT"

ACCOUNT_ID=$(echo "$OUTPUT" | grep -oE "0x[a-fA-F0-9]+")
echo "ACCOUNT_ID=$ACCOUNT_ID"

echo "Exporting Wallet..."
miden-client export --account-id $ACCOUNT_ID --filename /mnt/c/Users/HomePC/Documents/SEALED/wallet.mac

echo "Finished WSL deployment! Your wallet file is saved as wallet.mac in Windows."
