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

func TestQRMobileApis(t *testing.T) {
	buildReq := BuildQRFrameRequest{
		SessionID: "qr_mobile_session",
		FrameID:   "qr_mobile_frame_1",
		Payload:   "payload",
		Sequence:  1,
	}
	buildReqRaw, err := json.Marshal(buildReq)
	if err != nil {
		t.Fatalf("marshal build request failed: %v", err)
	}
	buildResultRaw := BuildQRPayloadFrameMobile(string(buildReqRaw))
	var buildResult MobileResult
	if err := json.Unmarshal([]byte(buildResultRaw), &buildResult); err != nil {
		t.Fatalf("unmarshal build result failed: %v", err)
	}
	if !buildResult.Success || buildResult.Data == "" {
		t.Fatalf("unexpected build result: %+v", buildResult)
	}

	handleReqRaw, err := json.Marshal(HandleQRFrameRequest{RawFrame: buildResult.Data})
	if err != nil {
		t.Fatalf("marshal handle request failed: %v", err)
	}
	handleResultRaw := HandleInboundQRFrameMobile(string(handleReqRaw))
	var handleResult MobileResult
	if err := json.Unmarshal([]byte(handleResultRaw), &handleResult); err != nil {
		t.Fatalf("unmarshal handle result failed: %v", err)
	}
	if !handleResult.Success || handleResult.Data == "" {
		t.Fatalf("unexpected handle result: %+v", handleResult)
	}

	retryReqRaw, err := json.Marshal(NextRetryRequest{FrameID: buildReq.FrameID})
	if err != nil {
		t.Fatalf("marshal retry request failed: %v", err)
	}
	retryResultRaw := NextQRRetryMobile(string(retryReqRaw))
	var retryResult MobileResult
	if err := json.Unmarshal([]byte(retryResultRaw), &retryResult); err != nil {
		t.Fatalf("unmarshal retry result failed: %v", err)
	}
	if !retryResult.Success {
		t.Fatalf("unexpected retry result: %+v", retryResult)
	}
}
