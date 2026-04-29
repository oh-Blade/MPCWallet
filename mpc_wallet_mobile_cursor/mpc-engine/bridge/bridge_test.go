package bridge

import (
	"encoding/json"
	"testing"
)

func TestStartKeygenAndSignTransaction(t *testing.T) {
	const (
		totalParties = 3
		threshold    = 1
		sessionID    = "session_milestone_roundtrip"
	)

	keygenReq := StartKeygenRequest{
		SessionID:    sessionID,
		TotalParties: totalParties,
		Threshold:    threshold,
	}
	reqJSON, err := json.Marshal(keygenReq)
	if err != nil {
		t.Fatalf("marshal keygen request failed: %v", err)
	}

	keygenRespRaw, err := StartKeygen(string(reqJSON))
	if err != nil {
		t.Fatalf("start keygen failed: %v", err)
	}

	var keygenResp StartKeygenResponse
	if err := json.Unmarshal([]byte(keygenRespRaw), &keygenResp); err != nil {
		t.Fatalf("unmarshal keygen response failed: %v", err)
	}
	if keygenResp.Status != defaultSessionStateReady {
		t.Fatalf("unexpected keygen status: %s", keygenResp.Status)
	}
	if keygenResp.PublicKeyHex == "" {
		t.Fatal("empty public key hex")
	}

	signReq := SignRequest{
		SessionID:      sessionID,
		MessageHashHex: "f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8",
		SignerIndices:  []int{0, 1},
	}
	signJSON, err := json.Marshal(signReq)
	if err != nil {
		t.Fatalf("marshal sign request failed: %v", err)
	}

	signRespRaw, err := SignTransaction(string(signJSON))
	if err != nil {
		t.Fatalf("sign transaction failed: %v", err)
	}

	var signResp SignResponse
	if err := json.Unmarshal([]byte(signRespRaw), &signResp); err != nil {
		t.Fatalf("unmarshal sign response failed: %v", err)
	}
	if signResp.Status != defaultSessionStateSigned {
		t.Fatalf("unexpected sign status: %s", signResp.Status)
	}
	if signResp.SignatureHex == "" || signResp.RHex == "" || signResp.SHex == "" {
		t.Fatal("missing signature fields in response")
	}
}
