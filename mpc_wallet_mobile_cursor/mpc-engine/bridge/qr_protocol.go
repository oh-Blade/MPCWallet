package bridge

import (
	"encoding/json"
	"fmt"
	"slices"
	"sync"
	"time"
)

const (
	defaultReplayWindow = 2 * time.Minute
	defaultMaxRetries   = 3
)

type QRProtocol struct {
	mu            sync.Mutex
	replayWindow  time.Duration
	maxRetries    int
	seenFrameAt   map[string]time.Time
	outboundRetry map[string]int
}

type QRWireFrame struct {
	SessionID  string `json:"sessionId"`
	FrameID    string `json:"frameId"`
	Sequence   int    `json:"sequence"`
	Payload    string `json:"payload"`
	AckFor     string `json:"ackFor,omitempty"`
	CreatedAt  int64  `json:"createdAtMs"`
	ProtocolV1 int    `json:"protocolVersion"`
}

type QRInboundResult struct {
	Type          string `json:"type"`
	FrameID       string `json:"frameId"`
	AckFrameRaw   string `json:"ackFrameRaw,omitempty"`
	Acknowledged  string `json:"acknowledged,omitempty"`
	ShouldProcess bool   `json:"shouldProcess"`
}

func NewQRProtocol() *QRProtocol {
	return &QRProtocol{
		replayWindow:  defaultReplayWindow,
		maxRetries:    defaultMaxRetries,
		seenFrameAt:   make(map[string]time.Time),
		outboundRetry: make(map[string]int),
	}
}

// BuildPayloadFrame WHY: A deterministic wire schema keeps offline QR interoperability stable
// across Android UI and Go MPC engine versions.
func (p *QRProtocol) BuildPayloadFrame(sessionID, frameID, payload string, sequence int) (string, error) {
	frame := QRWireFrame{
		SessionID:  sessionID,
		FrameID:    frameID,
		Sequence:   sequence,
		Payload:    payload,
		CreatedAt:  time.Now().UnixMilli(),
		ProtocolV1: 1,
	}
	p.mu.Lock()
	p.outboundRetry[frameID] = 0
	p.mu.Unlock()
	return marshalJSON(frame)
}

func (p *QRProtocol) NextRetry(frameID string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	current, exists := p.outboundRetry[frameID]
	if !exists {
		return false
	}
	if current >= p.maxRetries {
		return false
	}
	p.outboundRetry[frameID] = current + 1
	return true
}

// HandleInboundFrame WHY: Replay and ACK handling must happen before MPC message parsing
// to prevent round desync and duplicated state transitions.
func (p *QRProtocol) HandleInboundFrame(raw string, now time.Time) (QRInboundResult, error) {
	var frame QRWireFrame
	if err := json.Unmarshal([]byte(raw), &frame); err != nil {
		return QRInboundResult{}, fmt.Errorf("invalid qr frame json: %w", err)
	}
	if frame.ProtocolV1 != 1 {
		return QRInboundResult{}, fmt.Errorf("unsupported protocol version: %d", frame.ProtocolV1)
	}
	if frame.SessionID == "" || frame.FrameID == "" {
		return QRInboundResult{}, fmt.Errorf("sessionId and frameId must not be empty")
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	p.cleanupExpiredLocked(now)

	if frame.AckFor != "" {
		delete(p.outboundRetry, frame.AckFor)
		return QRInboundResult{
			Type:          "ack",
			FrameID:       frame.FrameID,
			Acknowledged:  frame.AckFor,
			ShouldProcess: false,
		}, nil
	}
	if _, seen := p.seenFrameAt[frame.FrameID]; seen {
		return QRInboundResult{
			Type:          "replay",
			FrameID:       frame.FrameID,
			ShouldProcess: false,
		}, nil
	}
	p.seenFrameAt[frame.FrameID] = now

	ack := QRWireFrame{
		SessionID:  frame.SessionID,
		FrameID:    fmt.Sprintf("%s_ack", frame.FrameID),
		Sequence:   frame.Sequence,
		Payload:    "",
		AckFor:     frame.FrameID,
		CreatedAt:  now.UnixMilli(),
		ProtocolV1: 1,
	}
	ackRaw, err := marshalJSON(ack)
	if err != nil {
		return QRInboundResult{}, err
	}

	return QRInboundResult{
		Type:          "payload",
		FrameID:       frame.FrameID,
		AckFrameRaw:   ackRaw,
		ShouldProcess: true,
	}, nil
}

func (p *QRProtocol) cleanupExpiredLocked(now time.Time) {
	expired := make([]string, 0)
	for frameID, seenAt := range p.seenFrameAt {
		if now.Sub(seenAt) > p.replayWindow {
			expired = append(expired, frameID)
		}
	}
	for _, frameID := range expired {
		delete(p.seenFrameAt, frameID)
	}
	slices.Sort(expired)
}
