package mpc

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/coinbase/cb-mpc/protocols/ecdsa"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

type MPCService struct {
	sessions *SessionStore
}

func NewMPCService() *MPCService {
	return &MPCService{
		sessions: NewSessionStore(),
	}
}

// CreateWallet creates a new MPC wallet
func (s *MPCService) CreateWallet(ctx context.Context, creator string) (*ecdsa.KeyShare, string, error) {
	// 生成随机私钥
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate private key: %v", err)
	}

	// 创建MPC协议实例
	protocol := ecdsa.NewProtocol()

	// 生成密钥分片
	shares, err := protocol.GenerateShares(privateKey.D, 2) // 2-of-2 MPC
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate shares: %v", err)
	}

	// 创建会话
	inviteData, err := json.Marshal(map[string]interface{}{
		"protocol": "ecdsa",
		"shares":   shares,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to marshal invite data: %v", err)
	}

	session := s.sessions.CreateSession(creator, string(inviteData))
	return shares[0], session.ID, nil
}

// JoinWallet joins an existing MPC wallet
func (s *MPCService) JoinWallet(ctx context.Context, sessionID, member string) (*ecdsa.KeyShare, error) {
	session, ok := s.sessions.GetSession(sessionID)
	if !ok {
		return nil, fmt.Errorf("session not found")
	}

	var inviteData map[string]interface{}
	if err := json.Unmarshal([]byte(session.InviteData), &inviteData); err != nil {
		return nil, fmt.Errorf("invalid invite data: %v", err)
	}

	shares, ok := inviteData["shares"].([]*ecdsa.KeyShare)
	if !ok {
		return nil, fmt.Errorf("invalid shares data")
	}

	// 加入会话
	_, ok = s.sessions.JoinSession(sessionID, member)
	if !ok {
		return nil, fmt.Errorf("failed to join session")
	}

	return shares[1], nil
}

// SignTransaction signs a transaction using MPC
func (s *MPCService) SignTransaction(ctx context.Context, sessionID string, tx *types.Transaction) (*types.Transaction, error) {
	session, ok := s.sessions.GetSession(sessionID)
	if !ok {
		return nil, fmt.Errorf("session not found")
	}

	if session.Status != SessionActive {
		return nil, fmt.Errorf("session not active")
	}

	// 获取交易哈希
	txHash := tx.Hash().Bytes()

	// 创建MPC协议实例
	protocol := ecdsa.NewProtocol()

	// 获取所有参与方的签名分片
	var signatures []*ecdsa.Signature
	for _, member := range session.Members {
		// 这里应该从安全存储中获取每个成员的分片
		// 简化示例中，我们假设分片已经可用
		signature, err := protocol.Sign(txHash, nil) // 实际应用中需要传入正确的分片
		if err != nil {
			return nil, fmt.Errorf("failed to generate signature for %s: %v", member, err)
		}
		signatures = append(signatures, signature)
	}

	// 合并签名
	finalSignature, err := protocol.CombineSignatures(signatures)
	if err != nil {
		return nil, fmt.Errorf("failed to combine signatures: %v", err)
	}

	// 使用签名更新交易
	signedTx, err := tx.WithSignature(types.NewEIP155Signer(tx.ChainId()), finalSignature)
	if err != nil {
		return nil, fmt.Errorf("failed to sign transaction: %v", err)
	}

	return signedTx, nil
}

// BroadcastTransaction broadcasts a signed transaction to the Ethereum network
func (s *MPCService) BroadcastTransaction(ctx context.Context, tx *types.Transaction) error {
	// TODO: 实现交易广播到以太坊网络
	// 这里需要集成以太坊客户端（如Infura）
	return nil
}
