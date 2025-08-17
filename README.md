# Pharos Network Automation Tools

A comprehensive web application for automating various operations on the Pharos Network ecosystem, including DeFi protocols, trading, and staking operations.

## Features

### 🏦 Autostaking Operations
- **Autostaking Deposit**: Automated deposit via AI advisor recommendations
- **Autostaking Faucet**: Automated faucet operations
- **Autostaking Withdraw**: Automated withdrawal from all vaults

### 🔄 Swap Operations
- **Faroswap**: USDC and WPHRS swaps
- **Zenith Finance**: USDC, USDT, and WPHRS swaps

### 💧 Liquidity Operations
- **Faroswap**: Add USDC and USDT liquidity
- **Zenith Finance**: Add USDC and WPHRS liquidity

### 📈 Trading
- **CFD Trading**: Automated CFD position opening

### 🌊 Other Protocols
- **Rwafi Aquaflux**: Aquaflux minting automation
- **PNS**: Pharos Name Service registration
- **Primus**: Primus protocol automation

## Prerequisites

- Node.js 18+ 
- pnpm package manager
- Private key for wallet operations

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pharos-network
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env-example .env
```

4. Edit `.env` file with your configuration:
```env
# Private Key (required)
PRIVATE_KEY=your_private_key_here

# RPC Configuration
RPC_URL=https://rpc.pharosnetwork.com

# Loop Configuration
LOOP_COUNT=1

# Timeout Configuration (in milliseconds)
TIMEOUT_MIN_MS=1000
TIMEOUT_MAX_MS=3000

# Amount Configuration (percentage)
AMOUNT_IN_PERCENT=100

# Optional: Proxy and Token Configuration
# PROXY_URL=
# AUTOSTAKING_TOKEN=
```

## Usage

### Development
```bash
pnpm run dev
```

### Production Build
```bash
pnpm run build
pnpm start
```

## API Endpoints

All automation operations are available via REST API endpoints:

### Autostaking
- `POST /api/autostaking-deposit` - Deposit via AI advisor
- `POST /api/autostaking-faucet` - Faucet operations
- `POST /api/autostaking-withdraw` - Withdraw from all vaults

### Faroswap
- `POST /api/faroswap-usdc-swap` - USDC swaps
- `POST /api/faroswap-wphrs-swap` - WPHRS swaps
- `POST /api/faroswap-usdc-liquidity` - Add USDC liquidity
- `POST /api/faroswap-usdt-liquidity` - Add USDT liquidity

### Zenith Finance
- `POST /api/zenith-usdc-swap` - USDC swaps
- `POST /api/zenith-usdt-swap` - USDT swaps
- `POST /api/zenith-wphrs-swap` - WPHRS swaps
- `POST /api/zenith-usdc-liquidity` - Add USDC liquidity
- `POST /api/zenith-wphrs-liquidity` - Add WPHRS liquidity

### Other Protocols
- `POST /api/cfd-trading` - CFD trading
- `POST /api/rwafi-aquaflux` - Aquaflux minting
- `POST /api/pns` - PNS registration
- `POST /api/primus` - Primus automation

## API Request Format

All endpoints accept JSON requests with the following parameters:

```json
{
  "rpcUrl": "https://rpc.pharosnetwork.com",
  "loopCount": 1,
  "timeoutMinMs": 1000,
  "timeoutMaxMs": 3000,
  "amountInPercent": 100
}
```

## Security

- Private keys are read from environment variables
- No private keys are stored in the application
- All sensitive data should be kept secure
- SSL certificate verification can be disabled for external API calls if needed

## Troubleshooting

### SSL/TLS Errors
If you encounter SSL certificate errors when making external API calls, you can disable SSL verification by setting:
```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```
**Warning**: This should only be used in development or trusted environments.

## Project Structure

```
pharos-network/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── main/                  # Original automation scripts
├── scripts/               # Utility functions and contracts
├── contracts/             # Smart contract definitions
└── ignition/              # Deployment modules
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This software is for educational and automation purposes. Use at your own risk. Always verify transactions before execution and ensure you understand the risks involved in DeFi operations.