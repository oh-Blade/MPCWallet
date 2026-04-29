package bridge

import (
	"encoding/json"
	"fmt"
	"time"
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

type BuildQRFrameRequest struct {
	SessionID string `json:"sessionId"`
	FrameID   string `json:"frameId"`
	Payload   string `json:"payload"`
	Sequence  int    `json:"sequence"`
}

type HandleQRFrameRequest struct {
	RawFrame string `json:"rawFrame"`
}

type NextRetryRequest struct {
	FrameID string `json:"frameId"`
}

var qrProtocol = NewQRProtocol()

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

func BuildQRPayloadFrameMobile(raw string) string {
	var req BuildQRFrameRequest
	if err := json.Unmarshal([]byte(raw), &req); err != nil {
		return encodeMobileResult(MobileResult{Success: false, Error: fmt.Sprintf("invalid request json: %v", err)})
	}
	data, err := qrProtocol.BuildPayloadFrame(req.SessionID, req.FrameID, req.Payload, req.Sequence)
	return wrapMobileResult(data, err)
}

func HandleInboundQRFrameMobile(raw string) string {
	var req HandleQRFrameRequest
	if err := json.Unmarshal([]byte(raw), &req); err != nil {
		return encodeMobileResult(MobileResult{Success: false, Error: fmt.Sprintf("invalid request json: %v", err)})
	}
	result, err := qrProtocol.HandleInboundFrame(req.RawFrame, time.Now().UTC())
	if err != nil {
		return encodeMobileResult(MobileResult{Success: false, Error: err.Error()})
	}
	data, marshalErr := marshalJSON(result)
	return wrapMobileResult(data, marshalErr)
}

func NextQRRetryMobile(raw string) string {
	var req NextRetryRequest
	if err := json.Unmarshal([]byte(raw), &req); err != nil {
		return encodeMobileResult(MobileResult{Success: false, Error: fmt.Sprintf("invalid request json: %v", err)})
	}
	data, marshalErr := marshalJSON(map[string]bool{"shouldRetry": qrProtocol.NextRetry(req.FrameID)})
	return wrapMobileResult(data, marshalErr)
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
