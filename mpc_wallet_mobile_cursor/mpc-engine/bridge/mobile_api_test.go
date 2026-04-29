package bridge

import (
	"encoding/json"
	"testing"
)

func TestStartKeygenMobileAndSessionInfo(t *testing.T) {
	req := StartKeygenRequest{
		SessionID:    "mobile_api_session",
		TotalParties: 3,
		Threshold:    1,
	}
	rawReq, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("marshal request failed: %v", err)
	}

	resultRaw := StartKeygenMobile(string(rawReq))
	var result MobileResult
	if err := json.Unmarshal([]byte(resultRaw), &result); err != nil {
		t.Fatalf("unmarshal mobile result failed: %v", err)
	}
	if !result.Success {
		t.Fatalf("unexpected mobile api error: %s", result.Error)
	}

	infoRaw := GetSessionInfoMobile(req.SessionID)
	var infoResult MobileResult
	if err := json.Unmarshal([]byte(infoRaw), &infoResult); err != nil {
		t.Fatalf("unmarshal session info result failed: %v", err)
	}
	if !infoResult.Success {
		t.Fatalf("unexpected session info error: %s", infoResult.Error)
	}
}
