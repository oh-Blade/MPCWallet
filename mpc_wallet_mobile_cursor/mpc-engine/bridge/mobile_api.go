package bridge

import (
	"encoding/json"
	"fmt"
)

type MobileResult struct {
	Success bool   `json:"success"`
	Data    string `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

type SessionInfoResponse struct {
	SessionID    string `json:"sessionId"`
	Status       string `json:"status"`
	TotalParties int    `json:"totalParties"`
	Threshold    int    `json:"threshold"`
	PublicKeyHex string `json:"publicKeyHex"`
}

// StartKeygenMobile WHY: gomobile/JNI bindings consume string-only interfaces reliably across
// Kotlin and Java call-sites, while preserving structured result payloads.
func StartKeygenMobile(raw string) string {
	return wrapMobileResult(StartKeygen(raw))
}

// SignTransactionMobile WHY: Android signing flow needs deterministic JSON response framing
// so transport and UI modules can handle success/error in one parsing branch.
func SignTransactionMobile(raw string) string {
	return wrapMobileResult(SignTransaction(raw))
}

func GetSessionInfoMobile(sessionID string) string {
	session, ok := loadSession(sessionID)
	if !ok {
		return encodeMobileResult(MobileResult{Success: false, Error: fmt.Sprintf("session not found: %s", sessionID)})
	}

	resp := SessionInfoResponse{
		SessionID:    session.sessionID,
		Status:       defaultSessionStateReady,
		TotalParties: session.totalParties,
		Threshold:    session.threshold,
		PublicKeyHex: session.publicKeyHex,
	}
	data, err := marshalJSON(resp)
	if err != nil {
		return encodeMobileResult(MobileResult{Success: false, Error: err.Error()})
	}
	return encodeMobileResult(MobileResult{Success: true, Data: data})
}

func wrapMobileResult(data string, err error) string {
	if err != nil {
		return encodeMobileResult(MobileResult{
			Success: false,
			Error:   err.Error(),
		})
	}
	return encodeMobileResult(MobileResult{
		Success: true,
		Data:    data,
	})
}

func encodeMobileResult(result MobileResult) string {
	out, err := json.Marshal(result)
	if err != nil {
		return `{"success":false,"error":"mobile_result_encoding_failed"}`
	}
	return string(out)
}
