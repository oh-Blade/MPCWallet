# MPC Wallet Mobile (Android, Production MVP)

This repository contains an Android-first ETH MPC wallet implementation plan and bootstrap code for a production-targeted MVP.

## Agreed Product Scope

- Threshold model: custom `n/t` configuration (initial rollout recommends 2/3 baseline profile).
- Custody mode: self-custody multi-device (no centralized signer share in v1).
- Network: Ethereum Mainnet.
- Assets: ETH + major ERC-20 (USDT/USDC/WETH).
- Approval/risk: amount-threshold controls in MVP, extensible policy engine.
- Compliance: no external compliance provider in MVP, extension interfaces reserved.
- MPC data exchange: offline-first QR message transport.
- Hardware security: software fallback supported for broad Android compatibility.
- Delivery goal: production MVP (security and operability first).

## Architecture (MVP)

1. Android Client
   - Account/session lifecycle, local secure storage, policy enforcement, transaction UX.
   - QR encode/decode transport for MPC round messages.
2. MPC Engine Adapter Layer
   - Stable Kotlin interface for DKG/sign/reshare.
   - Initial bridge placeholder for `tss-lib` runtime integration (gomobile/JNI sidecar).
3. Ethereum Integration Layer
   - EIP-1559 transaction build/validate pipeline.
   - Nonce manager and deterministic signing intent.
4. Security & Auditability
   - Encrypted local key material blobs.
   - Structured security logs for critical flows.

## Why `tss-lib` Is Introduced This Way

`tss-lib` is a Go library. On Android production deployments, teams usually integrate it via:

- gomobile-generated binding package, or
- local daemon/native bridge (JNI/FFI) with strict message contracts.

This repo starts with a hardened interface boundary so protocol logic can be migrated to the real `tss-lib` bridge without breaking app modules.

## Immediate Next Implementation Milestones

1. Replace placeholder `TssLibBridgeEngine` with actual binding implementation and protocol state machine.
2. Build QR fragmented transport with ACK/timeout/retry semantics.
3. Add transaction policy DSL (amount thresholds) and replay-protection checks.
4. Add persistent encrypted session vault and backup/restore for device share.
5. Add integration tests (MPC roundtrip simulation + signed tx broadcast dry-run).
