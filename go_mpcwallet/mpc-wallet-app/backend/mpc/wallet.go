package mpc

import (
	b64 "encoding/base64"
	"encoding/hex"
	"fmt"
	"log"
	"sync"

	"github.com/coinbase/cb-mpc/cb-mpc-go/cblib"
	"github.com/coinbase/cb-mpc/cb-mpc-go/network"
	"github.com/coinbase/cb-mpc/demos/mocknet"
)

// WalletCreationData represents the data needed to join a wallet creation process
type WalletCreationData struct {
	WalletID     string `json:"wallet_id"`
	TotalParties int    `json:"total_parties"`
	CurveCode    int    `json:"curve_code"`
	KeyShare     []byte `json:"key_share"`
	PublicKey    []byte `json:"public_key"`
	Address      string `json:"address"`
}

// MPCWallet represents a multi-party computation wallet
type MPCWallet struct {
	PublicKey []byte
	KeyShare  cblib.MPC_ECDSAMPC_KEY_PTR
	Address   string
	Parties   int
	CurveCode int
}

type SignMPInput struct {
	Key cblib.MPC_ECDSAMPC_KEY_PTR
	Msg []byte
}

// walletCreationManager manages the wallet creation process
type walletCreationManager struct {
	sync.Mutex
	walletID     string
	totalParties int
	curveCode    int
	keyShares    []cblib.MPC_ECDSAMPC_KEY_PTR
	publicKey    []byte
	address      string
}

var (
	walletManagers = make(map[string]*walletCreationManager)
	managerMutex   sync.Mutex
)

func EcdsaMPSignWrapper(job network.JobSessionMP, input *mocknet.MPCIO) (*mocknet.MPCIO, error) {
	signInput := input.Opaque.(SignMPInput)
	msg := signInput.Msg
	defaultSigReceiver := 0
	sig, err := cblib.MPC_ecdsampc_sign(job, signInput.Key, msg, defaultSigReceiver)
	if err != nil {
		return nil, fmt.Errorf("calling ecdsa mp sign: %v", err)
	}
	return &mocknet.MPCIO{Opaque: sig}, nil
}

func EcdsaMPKeygenWrapper(job network.JobSessionMP, input *mocknet.MPCIO) (*mocknet.MPCIO, error) {
	curveCode := input.Opaque.(int)
	keyshare, err := cblib.MPC_ecdsampc_dkg(job, curveCode)
	if err != nil {
		return nil, fmt.Errorf("calling ecdsa mp keygen: %v", err)
	}
	return &mocknet.MPCIO{Opaque: keyshare}, nil
}

// InitiateWalletCreation starts a new wallet creation process
func InitiateWalletCreation(parties int) (*WalletCreationData, error) {
	if parties < 2 {
		return nil, fmt.Errorf("number of parties must be at least 2")
	}

	// Generate a unique wallet ID
	walletID := generateWalletID()

	// Create wallet creation manager
	manager := &walletCreationManager{
		walletID:     walletID,
		totalParties: parties,
		curveCode:    714, // NID_secp256k1
		keyShares:    make([]cblib.MPC_ECDSAMPC_KEY_PTR, 0, parties),
	}

	// Store manager
	managerMutex.Lock()
	walletManagers[walletID] = manager
	managerMutex.Unlock()

	// Return initial creation data
	return &WalletCreationData{
		WalletID:     walletID,
		TotalParties: parties,
		CurveCode:    manager.curveCode,
	}, nil
}

// JoinWalletCreation allows a party to join the wallet creation process
func JoinWalletCreation(creationData *WalletCreationData) (*WalletCreationData, error) {
	managerMutex.Lock()
	manager, exists := walletManagers[creationData.WalletID]
	managerMutex.Unlock()

	if !exists {
		return nil, fmt.Errorf("wallet creation process not found")
	}

	manager.Lock()
	defer manager.Unlock()

	// Check if we've reached the maximum number of parties
	if len(manager.keyShares) >= manager.totalParties {
		return nil, fmt.Errorf("wallet creation process is already complete")
	}

	// Create MPC runner for this party
	runner := mocknet.NewMPCRunner(manager.totalParties)

	// Generate key share for this party
	outputs, err := runner.MPCRunMP(EcdsaMPKeygenWrapper, []*mocknet.MPCIO{{Opaque: manager.curveCode}})
	if err != nil {
		return nil, fmt.Errorf("failed to generate key share: %v", err)
	}

	// Store the key share
	keyShare := outputs[0].Opaque.(cblib.MPC_ECDSAMPC_KEY_PTR)
	manager.keyShares = append(manager.keyShares, keyShare)

	// If this is the last party, finalize the wallet
	if len(manager.keyShares) == manager.totalParties {
		// Get public key from the first key share
		x, y, err := cblib.MPC_ecdsa_mpc_public_key_to_string(manager.keyShares[0])
		if err != nil {
			return nil, fmt.Errorf("failed to get public key: %v", err)
		}

		manager.publicKey = append(x, y...)
		manager.address = generateAddress(manager.publicKey)
	}

	// Return updated creation data
	return &WalletCreationData{
		WalletID:     manager.walletID,
		TotalParties: manager.totalParties,
		CurveCode:    manager.curveCode,
		KeyShare:     []byte{}, // In a real implementation, you would serialize the key share
		PublicKey:    manager.publicKey,
		Address:      manager.address,
	}, nil
}

// FinalizeWalletCreation completes the wallet creation process and returns the final wallet
func FinalizeWalletCreation(walletID string) (*MPCWallet, error) {
	managerMutex.Lock()
	manager, exists := walletManagers[walletID]
	managerMutex.Unlock()

	if !exists {
		return nil, fmt.Errorf("wallet creation process not found")
	}

	manager.Lock()
	defer manager.Unlock()

	// Check if we have all required parties
	if len(manager.keyShares) != manager.totalParties {
		return nil, fmt.Errorf("not all parties have joined yet")
	}

	// Create the final wallet
	wallet := &MPCWallet{
		PublicKey: manager.publicKey,
		KeyShare:  manager.keyShares[0], // In a real implementation, you would need to handle all key shares
		Address:   manager.address,
		Parties:   manager.totalParties,
		CurveCode: manager.curveCode,
	}

	// Clean up the manager
	managerMutex.Lock()
	delete(walletManagers, walletID)
	managerMutex.Unlock()

	return wallet, nil
}

// generateWalletID generates a unique wallet ID
func generateWalletID() string {
	// In a real implementation, you would generate a proper unique ID
	return fmt.Sprintf("wallet_%d", len(walletManagers))
}

// SignMessage signs a message using MPC
func (w *MPCWallet) SignMessage(message []byte) (string, error) {
	runner := mocknet.NewMPCRunner(w.Parties)

	// Create inputs for each party
	inputs := make([]*mocknet.MPCIO, w.Parties)
	for i := 0; i < w.Parties; i++ {
		inputs[i] = &mocknet.MPCIO{
			Opaque: SignMPInput{
				Msg: message,
				Key: w.KeyShare,
			},
		}
	}

	// Run MPC signing
	outputs, err := runner.MPCRunMP(EcdsaMPSignWrapper, inputs)
	if err != nil {
		return "", fmt.Errorf("failed to sign message: %v", err)
	}

	// Return base64 encoded signature
	return b64.StdEncoding.EncodeToString(outputs[0].Opaque.([]byte)), nil
}

// generateAddress generates a wallet address from the public key
func generateAddress(publicKey []byte) string {
	// This is a simplified address generation
	// In a real implementation, you would use proper address generation for the specific blockchain
	return "0x" + hex.EncodeToString(publicKey[:20])
}

// GetAddress returns the wallet address
func (w *MPCWallet) GetAddress() string {
	return w.Address
}

// GetPublicKey returns the wallet's public key
func (w *MPCWallet) GetPublicKey() []byte {
	return w.PublicKey
}

// Example usage
func ExampleMPCWallet() {
	// Initiate wallet creation
	creationData, err := InitiateWalletCreation(4)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Wallet Creation Initiated: %+v\n", creationData)

	// Simulate parties joining
	for i := 0; i < 4; i++ {
		updatedData, err := JoinWalletCreation(creationData)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Party %d joined: %+v\n", i+1, updatedData)
	}

	// Finalize wallet creation
	wallet, err := FinalizeWalletCreation(creationData.WalletID)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Wallet Created:\n")
	fmt.Printf("Address: %s\n", wallet.GetAddress())
	fmt.Printf("Public Key: %x\n", wallet.GetPublicKey())

	// Sign a message
	message := []byte("Hello, MPC Wallet!")
	signature, err := wallet.SignMessage(message)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Signature: %s\n", signature)
}
