# mpc-engine (Go bridge for Android)

This module hosts the production MPC protocol runtime based on `github.com/bnb-chain/tss-lib`.

## Integration Goal

- Implement keygen/sign/reshare orchestration in Go.
- Export a stable API for Android by `gomobile bind` or JNI-compatible wrapper.
- Keep all protocol session and round validation in this module.
- Provide QR offline transport protocol handling (ACK/replay/retry) shared with mobile side.

## Security Notes

- Pin protocol/session IDs and enforce anti-replay checks for every inbound message.
- Validate party set and threshold invariants before every run.
- Emit structured logs on every round transition and error path.

## Next Steps

1. Implement local party manager and message router.
2. Add deterministic JSON schema for message exchange with Android.
3. Add integration tests for DKG and signing with simulated multi-party sessions.
4. Wire gomobile build artifacts into Android Gradle pipeline.
5. Replace in-memory session store with encrypted persistent session vault.

## Milestone Verification

Run the first acceptance milestone (real DKG + signing rounds):

```bash
GOPATH="$(pwd)/.gopath" GOMODCACHE="$(pwd)/.gomodcache" GOCACHE="$(pwd)/.gocache" go test ./...
```

Expected result: `ok   mpc-wallet-mobile/mpc-engine/bridge ...`
