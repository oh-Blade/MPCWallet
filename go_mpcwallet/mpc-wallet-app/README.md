# MPC Wallet Application

A secure multi-party computation (MPC) wallet application built with React and Go.

## Features

- Create MPC wallets with enhanced security
- Send transactions using MPC signatures
- Real-time wallet balance and transaction status
- Multi-party interaction through data exchange

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Axios for API calls
- React Router for navigation

### Backend
- Go with Gin framework
- Coinbase MPC library
- Ethereum integration with Infura

## Getting Started

### Prerequisites
- Node.js 16+
- Go 1.18+
- Infura API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mpc-wallet-app
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
go mod download
```

4. Set up environment variables:
Create a `.env` file in the backend directory:
```
INFURA_API_KEY=your_infura_api_key
```

### Running the Application

1. Start the backend server:
```bash
cd backend
go run main.go
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at http://localhost:3000

## Usage

1. Create a new MPC wallet
2. View your wallet address and balance
3. Send transactions using MPC signatures
4. Follow the MPC interaction process through the UI

## Security

- Private keys are never stored in a single location
- All cryptographic operations are performed using MPC
- Multi-party interaction ensures no single party has complete control

## License

MIT 