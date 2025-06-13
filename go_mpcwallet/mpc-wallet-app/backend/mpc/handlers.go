package mpc

import (
	"math/big"
	"net/http"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/gin-gonic/gin"
)

var GlobalSessionStore = NewSessionStore()
var GlobalMPCService = NewMPCService()

// CreateSessionHandler creates a new MPC session
func CreateSessionHandler(c *gin.Context) {
	type Req struct {
		Creator string `json:"creator"`
	}
	var req Req
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	share, sessionID, err := GlobalMPCService.CreateWallet(c.Request.Context(), req.Creator)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
		"share":      share,
	})
}

// JoinSessionHandler joins an existing MPC session
func JoinSessionHandler(c *gin.Context) {
	type Req struct {
		SessionID string `json:"session_id"`
		Member    string `json:"member"`
	}
	var req Req
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	share, err := GlobalMPCService.JoinWallet(c.Request.Context(), req.SessionID, req.Member)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"share": share,
	})
}

// GetSessionStatusHandler returns the current status of an MPC session
func GetSessionStatusHandler(c *gin.Context) {
	sessionID := c.Query("session_id")
	sess, ok := GlobalSessionStore.GetSession(sessionID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	c.JSON(http.StatusOK, sess)
}

// SignTransactionHandler handles transaction signing requests
func SignTransactionHandler(c *gin.Context) {
	type Req struct {
		To        string `json:"to"`
		Value     string `json:"value"`
		SessionID string `json:"session_id"`
	}
	var req Req
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 创建交易
	value := new(big.Int)
	value.SetString(req.Value, 10)
	tx := types.NewTransaction(
		0, // nonce
		common.HexToAddress(req.To),
		value,
		21000,                   // gas limit
		big.NewInt(20000000000), // gas price
		nil,                     // data
	)

	// 签名交易
	signedTx, err := GlobalMPCService.SignTransaction(c.Request.Context(), req.SessionID, tx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 广播交易
	if err := GlobalMPCService.BroadcastTransaction(c.Request.Context(), signedTx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tx_hash": signedTx.Hash().Hex(),
	})
}
