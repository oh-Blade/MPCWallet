package bridge

import (
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"slices"
	"sync"
	"time"

	"github.com/bnb-chain/tss-lib/common"
	"github.com/bnb-chain/tss-lib/ecdsa/keygen"
	"github.com/bnb-chain/tss-lib/ecdsa/signing"
	"github.com/bnb-chain/tss-lib/tss"
)

const (
	minPartyCount             = 2
	minThreshold              = 1
	messageBufferPerParty     = 32
	preParamsTimeout          = 90 * time.Second
	defaultSigningMessageHex  = "4d50435f4554485f5349474e5f4d5347"
	defaultSessionStateReady  = "ready"
	defaultSessionStateSigned = "signed"
)

type StartKeygenRequest struct {
	SessionID    string `json:"sessionId"`
	TotalParties int    `json:"totalParties"`
	Threshold    int    `json:"threshold"`
}

type StartKeygenResponse struct {
	SessionID     string `json:"sessionId"`
	Status        string `json:"status"`
	TotalParties  int    `json:"totalParties"`
	Threshold     int    `json:"threshold"`
	PublicKeyHex  string `json:"publicKeyHex"`
	SignerIndices []int  `json:"signerIndices"`
}

type SignRequest struct {
	SessionID      string `json:"sessionId"`
	MessageHashHex string `json:"messageHashHex"`
	SignerIndices  []int  `json:"signerIndices"`
}

type SignResponse struct {
	SessionID            string `json:"sessionId"`
	Status               string `json:"status"`
	MessageHashHex       string `json:"messageHashHex"`
	SignatureHex         string `json:"signatureHex"`
	SignatureRecoveryHex string `json:"signatureRecoveryHex"`
	RHex                 string `json:"rHex"`
	SHex                 string `json:"sHex"`
}

type sessionState struct {
	sessionID    string
	totalParties int
	threshold    int
	partyIDs     tss.SortedPartyIDs
	keyShares    map[int]keygen.LocalPartySaveData
	publicKeyHex string
	createdAt    time.Time
}

type sessionStore struct {
	mu       sync.RWMutex
	sessions map[string]sessionState
}

var store = sessionStore{
	sessions: make(map[string]sessionState),
}

// StartKeygen WHY: Kotlin side uses this as a stable boundary while protocol internals evolve.
func StartKeygen(raw string) (string, error) {
	var req StartKeygenRequest
	if err := json.Unmarshal([]byte(raw), &req); err != nil {
		return "", fmt.Errorf("invalid request json: %w", err)
	}
	if err := validateKeygenRequest(req); err != nil {
		return "", err
	}

	slog.Info(
		"tss_keygen_start",
		"session_id", req.SessionID,
		"parties", req.TotalParties,
		"threshold", req.Threshold,
	)

	state, err := runKeygen(req)
	if err != nil {
		return "", err
	}
	storeSession(state)

	resp := StartKeygenResponse{
		SessionID:     req.SessionID,
		Status:        defaultSessionStateReady,
		TotalParties:  req.TotalParties,
		Threshold:     req.Threshold,
		PublicKeyHex:  state.publicKeyHex,
		SignerIndices: sortedIndices(state.keyShares),
	}
	return marshalJSON(resp)
}

// SignTransaction WHY: Mobile flow can call this stable endpoint after QR round exchange,
// while Go-side evolves from simulated transport to production network transport.
func SignTransaction(raw string) (string, error) {
	var req SignRequest
	if err := json.Unmarshal([]byte(raw), &req); err != nil {
		return "", fmt.Errorf("invalid request json: %w", err)
	}
	if req.SessionID == "" {
		return "", errors.New("sessionId must not be empty")
	}

	state, ok := loadSession(req.SessionID)
	if !ok {
		return "", fmt.Errorf("session not found: %s", req.SessionID)
	}
	messageHex := req.MessageHashHex
	if messageHex == "" {
		messageHex = defaultSigningMessageHex
	}
	messageBytes, err := hex.DecodeString(messageHex)
	if err != nil {
		return "", fmt.Errorf("messageHashHex must be valid hex: %w", err)
	}
	if len(messageBytes) == 0 {
		return "", errors.New("messageHashHex must not be empty")
	}

	signerIndices := req.SignerIndices
	if len(signerIndices) == 0 {
		signerIndices = sortedIndices(state.keyShares)[:state.threshold+1]
	}
	if len(signerIndices) < state.threshold+1 {
		return "", fmt.Errorf("need at least threshold+1 signers, got %d", len(signerIndices))
	}

	sig, err := runSigning(state, signerIndices, messageBytes)
	if err != nil {
		return "", err
	}

	slog.Info(
		"tss_sign_completed",
		"session_id", req.SessionID,
		"signer_count", len(signerIndices),
	)

	resp := SignResponse{
		SessionID:            req.SessionID,
		Status:               defaultSessionStateSigned,
		MessageHashHex:       hex.EncodeToString(messageBytes),
		SignatureHex:         hex.EncodeToString(sig.Signature),
		SignatureRecoveryHex: hex.EncodeToString(sig.SignatureRecovery),
		RHex:                 hex.EncodeToString(sig.R),
		SHex:                 hex.EncodeToString(sig.S),
	}
	return marshalJSON(resp)
}

func validateKeygenRequest(req StartKeygenRequest) error {
	if req.SessionID == "" {
		return errors.New("sessionId must not be empty")
	}
	if req.TotalParties < minPartyCount {
		return fmt.Errorf("totalParties must be >= %d", minPartyCount)
	}
	if req.Threshold < minThreshold || req.Threshold >= req.TotalParties {
		return errors.New("threshold must be in [1, totalParties-1]")
	}
	return nil
}

func runKeygen(req StartKeygenRequest) (sessionState, error) {
	partyIDs := tss.GenerateTestPartyIDs(req.TotalParties)
	peerContext := tss.NewPeerContext(partyIDs)
	preParams := make([]keygen.LocalPreParams, req.TotalParties)
	for idx := range req.TotalParties {
		pp, err := keygen.GeneratePreParams(preParamsTimeout)
		if err != nil {
			return sessionState{}, fmt.Errorf("pre-params generation failed for party %d: %w", idx, err)
		}
		preParams[idx] = *pp
	}

	parties := make([]tss.Party, req.TotalParties)
	outCh := make(chan tss.Message, req.TotalParties*messageBufferPerParty)
	endCh := make(chan keygen.LocalPartySaveData, req.TotalParties)
	errCh := make(chan error, req.TotalParties*messageBufferPerParty)

	for idx := range req.TotalParties {
		params := tss.NewParameters(tss.S256(), peerContext, partyIDs[idx], req.TotalParties, req.Threshold)
		parties[idx] = keygen.NewLocalParty(params, outCh, endCh, preParams[idx])
		go func(p tss.Party) {
			if err := p.Start(); err != nil {
				errCh <- err
			}
		}(parties[idx])
	}

	keyShares := make(map[int]keygen.LocalPartySaveData, req.TotalParties)
	ended := 0
	for ended < req.TotalParties {
		select {
		case err := <-errCh:
			return sessionState{}, fmt.Errorf("keygen round failed: %w", err)
		case msg := <-outCh:
			if err := routeMessage(parties, msg); err != nil {
				return sessionState{}, err
			}
		case saveData := <-endCh:
			index, err := saveData.OriginalIndex()
			if err != nil {
				return sessionState{}, fmt.Errorf("unable to recover party index from key share: %w", err)
			}
			keyShares[index] = saveData
			ended++
		}
	}

	firstShare := keyShares[0]
	pubKeyHex, err := encodePublicKeyHex(firstShare.ECDSAPub.ToECDSAPubKey())
	if err != nil {
		return sessionState{}, err
	}

	return sessionState{
		sessionID:    req.SessionID,
		totalParties: req.TotalParties,
		threshold:    req.Threshold,
		partyIDs:     partyIDs,
		keyShares:    keyShares,
		publicKeyHex: pubKeyHex,
		createdAt:    time.Now().UTC(),
	}, nil
}

func runSigning(state sessionState, signerIndices []int, msg []byte) (common.SignatureData, error) {
	sortedSignerIndices := slices.Clone(signerIndices)
	slices.Sort(sortedSignerIndices)

	signPartyIDs := make(tss.UnSortedPartyIDs, 0, len(sortedSignerIndices))
	shareSubset := make([]keygen.LocalPartySaveData, 0, len(sortedSignerIndices))
	for _, idx := range sortedSignerIndices {
		partyID, foundParty := findPartyIDByIndex(state.partyIDs, idx)
		share, foundShare := state.keyShares[idx]
		if !foundParty || !foundShare {
			return common.SignatureData{}, fmt.Errorf("signer index %d not found in session", idx)
		}
		signPartyIDs = append(signPartyIDs, partyID)
		shareSubset = append(shareSubset, share)
	}

	sortedIDs := tss.SortPartyIDs(signPartyIDs)
	peerContext := tss.NewPeerContext(sortedIDs)
	totalSigners := len(sortedIDs)
	outCh := make(chan tss.Message, totalSigners*messageBufferPerParty)
	endCh := make(chan common.SignatureData, totalSigners)
	errCh := make(chan error, totalSigners*messageBufferPerParty)

	parties := make([]tss.Party, 0, totalSigners)
	for idx := 0; idx < totalSigners; idx++ {
		params := tss.NewParameters(tss.S256(), peerContext, sortedIDs[idx], totalSigners, state.threshold)
		signParty := signing.NewLocalParty(new(big.Int).SetBytes(msg), params, shareSubset[idx], outCh, endCh)
		parties = append(parties, signParty)
		go func(p tss.Party) {
			if err := p.Start(); err != nil {
				errCh <- err
			}
		}(signParty)
	}

	ended := 0
	var finalSig common.SignatureData
	for ended < totalSigners {
		select {
		case err := <-errCh:
			return common.SignatureData{}, fmt.Errorf("signing round failed: %w", err)
		case msgOut := <-outCh:
			if err := routeMessage(parties, msgOut); err != nil {
				return common.SignatureData{}, err
			}
		case sig := <-endCh:
			finalSig = sig
			ended++
		}
	}

	if err := verifySignature(state.keyShares[sortedSignerIndices[0]].ECDSAPub.ToECDSAPubKey(), msg, finalSig); err != nil {
		return common.SignatureData{}, err
	}
	return finalSig, nil
}

func routeMessage(parties []tss.Party, msg tss.Message) error {
	destinations := msg.GetTo()
	if destinations == nil {
		for idx := range parties {
			if parties[idx].PartyID().Index == msg.GetFrom().Index {
				continue
			}
			if err := updatePartyFromWire(parties[idx], msg); err != nil {
				return err
			}
		}
		return nil
	}

	for _, destination := range destinations {
		if destination.Index == msg.GetFrom().Index {
			return fmt.Errorf("invalid routing: self-send from %d", destination.Index)
		}
		if destination.Index < 0 || destination.Index >= len(parties) {
			return fmt.Errorf("invalid routing: destination index %d out of range", destination.Index)
		}
		if err := updatePartyFromWire(parties[destination.Index], msg); err != nil {
			return err
		}
	}
	return nil
}

func updatePartyFromWire(target tss.Party, msg tss.Message) error {
	wireBytes, _, err := msg.WireBytes()
	if err != nil {
		return fmt.Errorf("wire encoding failed: %w", err)
	}
	parsed, err := tss.ParseWireMessage(wireBytes, msg.GetFrom(), msg.IsBroadcast())
	if err != nil {
		return fmt.Errorf("wire parsing failed: %w", err)
	}
	if _, err := target.Update(parsed); err != nil {
		return fmt.Errorf("party update failed: %w", err)
	}
	return nil
}

func verifySignature(publicKey *ecdsa.PublicKey, msg []byte, sig common.SignatureData) error {
	if len(sig.R) == 0 || len(sig.S) == 0 {
		return errors.New("empty signature component")
	}
	r := new(big.Int).SetBytes(sig.R)
	s := new(big.Int).SetBytes(sig.S)
	if !ecdsa.Verify(publicKey, msg, r, s) {
		return errors.New("signature verification failed")
	}
	return nil
}

func encodePublicKeyHex(publicKey *ecdsa.PublicKey) (string, error) {
	if publicKey == nil {
		return "", errors.New("public key is nil")
	}
	return hex.EncodeToString(append(publicKey.X.FillBytes(make([]byte, 32)), publicKey.Y.FillBytes(make([]byte, 32))...)), nil
}

func storeSession(state sessionState) {
	store.mu.Lock()
	defer store.mu.Unlock()
	store.sessions[state.sessionID] = state
}

func loadSession(sessionID string) (sessionState, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()
	session, ok := store.sessions[sessionID]
	return session, ok
}

func findPartyIDByIndex(ids tss.SortedPartyIDs, index int) (*tss.PartyID, bool) {
	for _, id := range ids {
		if id.Index == index {
			return id, true
		}
	}
	return nil, false
}

func sortedIndices(shares map[int]keygen.LocalPartySaveData) []int {
	indices := make([]int, 0, len(shares))
	for idx := range shares {
		indices = append(indices, idx)
	}
	slices.Sort(indices)
	return indices
}

func marshalJSON(v any) (string, error) {
	out, err := json.Marshal(v)
	if err != nil {
		return "", fmt.Errorf("marshal response failed: %w", err)
	}
	return string(out), nil
}
