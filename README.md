# Miden Workspace

A multi-project workspace for building smart contracts, SDKs, and tooling on the [Miden blockchain](https://polygon.technology/polygon-miden).

## Workspace Structure

```
miden-workspace/
├── projects/
│   └── sealed/                  ← Sealed credential system
│       ├── contracts/           ← MASM smart contract (sealed-account)
│       ├── sdk/                 ← Rust SDK wrapper (sealed-sdk)
│       ├── tests/               ← Integration tests
│       ├── frontend/            ← Web frontend
│       ├── assembly/            ← Raw MASM assembly sources
│       ├── scripts/             ← Deployment scripts (deployer)
│       └── deployments/         ← Project-specific deployment records
├── tools/                       ← Shared tooling (all projects)
│   ├── activity-generator/      ← On-chain transaction generator
│   ├── compiler/                ← MASM compiler utility
│   ├── miden-protocol/          ← Miden protocol library
│   └── miden-standards/         ← Miden standards library
├── miden-client/                ← Shared dependency (submodule)
├── miden-vm/                    ← Shared dependency (submodule)
├── deployments/                 ← Cross-project deployment records
│   └── testnet.json
├── .github/workflows/           ← CI/CD workflows
├── wallet.mac                   ← Signer wallet
├── Cargo.toml                   ← Workspace root
└── .gitignore
```

## Projects

### Sealed (`projects/sealed/`)

Sealed is a smart contract account component built for the Miden blockchain. It manages a private credential system where users hold a private Merkle tree of credentials locally. The Miden operator only ever sees a commitment hash of the credentials.

**Architecture:**

1. **Account Storage**: The root of the private Merkle tree containing the user's credentials is stored in the account's private storage at slot 0.
2. **Credentials**: Each credential contains the issuer address, credential type hash, score, timestamp, and the issuer's signature. It is hashed using Miden's native Rescue Prime Optimized (RPO) hash function before being inserted into the Merkle tree.
3. **Zero-Knowledge Threshold Proof**: Users can prove that their aggregated reputation score meets a certain threshold without revealing the actual score or the underlying credentials.

**MASM Component** (`projects/sealed/contracts/sealed-account`):
- `issue_credential`: Validates the issuer's signature, hashes the credential data via RPO, inserts it into the private Merkle tree, and updates the Merkle root in slot 0.
- `compute_reputation_score`: Iterates over the user's credential branches (provided via advice provider in ZK), accumulates the score using scaled weights, and returns the aggregated score.
- `prove_threshold`: Calls `compute_reputation_score`, asserts the score is greater than or equal to the threshold, and halts otherwise.

**SDK Wrapper** (`projects/sealed/sdk/sealed-sdk`): A Rust wrapper using `miden-sdk` to interact with the Sealed MASM component. Exposes `issue_credential`, `compute_reputation_score`, and `prove_threshold`.

**Score Weights** (integer fixed-point, multiplier of 2):
- Governance Contributions = 4
- Completed Contracts = 3
- Ratings = 2

## Shared Tools (`tools/`)

| Tool | Description |
|------|-------------|
| `activity-generator` | Generates on-chain transactions for the Miden testnet |
| `compiler` | MASM compiler utility for building `.masp` artifacts |
| `miden-protocol` | Core Miden protocol library |
| `miden-standards` | Miden standards library |

## Building

```bash
# Build all workspace members
cargo build --workspace

# Build a specific project
cargo build -p sealed-account
cargo build -p sealed-sdk
```
