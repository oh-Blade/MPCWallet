package bridge

import (
	"testing"
	"time"
)

func TestQRProtocolPayloadAckAndReplay(t *testing.T) {
	protocol := NewQRProtocol()
	frameRaw, err := protocol.BuildPayloadFrame("session_qr", "frame_1", "hello_payload", 1)
	if err != nil {
		t.Fatalf("build payload frame failed: %v", err)
	}

	now := time.Now()
	inbound, err := protocol.HandleInboundFrame(frameRaw, now)
	if err != nil {
		t.Fatalf("handle inbound payload failed: %v", err)
	}
	if inbound.Type != "payload" || !inbound.ShouldProcess || inbound.AckFrameRaw == "" {
		t.Fatalf("unexpected inbound payload result: %+v", inbound)
	}

	replay, err := protocol.HandleInboundFrame(frameRaw, now.Add(2*time.Second))
	if err != nil {
		t.Fatalf("handle replay failed: %v", err)
	}
	if replay.Type != "replay" || replay.ShouldProcess {
		t.Fatalf("unexpected replay result: %+v", replay)
	}

	ack, err := protocol.HandleInboundFrame(inbound.AckFrameRaw, now.Add(3*time.Second))
	if err != nil {
		t.Fatalf("handle ack failed: %v", err)
	}
	if ack.Type != "ack" || ack.Acknowledged != "frame_1" {
		t.Fatalf("unexpected ack result: %+v", ack)
	}
}

func TestQRProtocolRetryBudget(t *testing.T) {
	protocol := NewQRProtocol()
	_, err := protocol.BuildPayloadFrame("session_retry", "frame_retry", "payload", 1)
	if err != nil {
		t.Fatalf("build frame failed: %v", err)
	}

	if !protocol.NextRetry("frame_retry") {
		t.Fatal("retry 1 should be available")
	}
	if !protocol.NextRetry("frame_retry") {
		t.Fatal("retry 2 should be available")
	}
	if !protocol.NextRetry("frame_retry") {
		t.Fatal("retry 3 should be available")
	}
	if protocol.NextRetry("frame_retry") {
		t.Fatal("retry budget should be exhausted")
	}
}
