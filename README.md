# Pharos Network Automation Tools

A comprehensive Next.js web application for automating various operations on the Pharos Network ecosystem, including DeFi protocols, trading, staking, and NFT operations.

## 🙏 Credits & Acknowledgments

This project is based on the original **Pharos Network Swap and Liquidity Bot** by [@takachan0012](https://github.com/takachan0012/pharos-network).

- **Original Repository**: [https://github.com/takachan0012/pharos-network](https://github.com/takachan0012/pharos-network)
- **Original Author**: [@takachan0012](https://github.com/takachan0012)

### What's Different?

This Next.js version transforms the original Node.js/Hardhat scripts into a modern web application with:

- 🌐 **Web Interface**: User-friendly dashboard instead of command-line scripts
- 🔌 **REST API**: All automation tools available via API endpoints
- 📊 **Real-time Logging**: Live progress tracking and monitoring
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- 🔄 **Task Management**: Unique task IDs for tracking operations
- 📱 **Mobile Friendly**: Works seamlessly on all devices

The core automation logic and smart contract interactions remain the same as the original project, ensuring compatibility and reliability.

## 🚀 Features

### 🌊 Rwafi Aquaflux
- **NFT Minting**: Automated NFT minting with multiple selectors
- **Batch Processing**: Process multiple selectors in sequence
- **Real-time Logging**: Live progress tracking and error reporting

### 🏦 Autostaking Operations
- **Autostaking Faucet**: Automated faucet operations for token distribution
- **Autostaking Deposit**: Automated deposit via AI advisor recommendations with token authentication
- **Autostaking Withdraw**: Automated withdrawal from all vaults

### 🔄 Swap Operations
- **Faroswap**: 
  - USDC to WPHRS swaps
  - USDC to USDT swaps
  - WPHRS swaps
- **Zenith Finance**: 
  - USDC swaps
  - USDT swaps  
  - WPHRS swaps

### 💧 Liquidity Operations
- **Faroswap**: 
  - Add USDC liquidity
  - Add USDT liquidity
- **Zenith Finance**: 
  - Add USDC liquidity (USDC/USDT and USDC/WPHRS pairs)
  - Add WPHRS liquidity

### 📈 Trading
- **CFD Trading**: Automated CFD position opening on Brokex

### 🌐 Web3 Services
- **PNS (Pharos Name Service)**: Domain registration with configurable duration
- **Primus**: Primus protocol automation

## 🛠️ Tech Stack

- **Framework**: Next.js 14.0.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Ethers.js v6.14.4
- **Package Manager**: pnpm
- **Additional**: Puppeteer for web automation

## 📋 Prerequisites

- Node.js 18+
- pnpm package manager
- Private key for wallet operations
- Pharos Network RPC access

## 🚀 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd pharos-network
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```bash
cp .env-example .env
```

4. **Configure your environment:**
```env
# SSL Configuration (for development)
NODE_TLS_REJECT_UNAUTHORIZED=0

# Add your private key when using the application
# PRIVATE_KEY=your_private_key_here
```

## 🎯 Usage

### Development Mode
```bash
pnpm run dev
```

### Production Build
```bash
pnpm run build
pnpm start
```

## 🌐 Web Interface

The application provides a modern web interface with:

- **Dashboard**: Overview of all available automation tools
- **Real-time Logging**: Live progress tracking for each operation
- **Task Management**: Unique task IDs for tracking operations
- **Responsive Design**: Works on desktop and mobile devices

## 🔌 API Endpoints

All automation operations are available via REST API endpoints with real-time logging:

### Autostaking
- `POST /api/autostaking-deposit` - Deposit via AI advisor (requires autostaking token)
- `POST /api/autostaking-faucet` - Faucet operations
- `POST /api/autostaking-withdraw` - Withdraw from all vaults

### Faroswap
- `POST /api/faroswap-usdc-swap` - USDC swaps (USDC→WPHRS, USDC→USDT)
- `POST /api/faroswap-wphrs-swap` - WPHRS swaps
- `POST /api/faroswap-usdc-liquidity` - Add USDC liquidity
- `POST /api/faroswap-usdt-liquidity` - Add USDT liquidity

### Zenith Finance
- `POST /api/zenith-usdc-swap` - USDC swaps
- `POST /api/zenith-usdt-swap` - USDT swaps
- `POST /api/zenith-wphrs-swap` - WPHRS swaps
- `POST /api/zenith-usdc-liquidity` - Add USDC liquidity (multiple pairs)
- `POST /api/zenith-wphrs-liquidity` - Add WPHRS liquidity

### Other Protocols
- `POST /api/cfd-trading` - CFD trading on Brokex
- `POST /api/rwafi-aquaflux` - NFT minting with multiple selectors
- `POST /api/pns` - PNS domain registration
- `POST /api/primus` - Primus protocol automation

## 📡 API Request Format

All endpoints accept JSON requests with the following parameters:

```json
{
  "privateKey": "your_private_key_here",
  "rpcUrl": "https://rpc.pharosnetwork.com",
  "loopCount": 1,
  "timeoutMinMs": 10000,
  "timeoutMaxMs": 20000,
  "amountInPercent": 1,
  "slippage": 0.5,
  "taskId": "unique_task_id",
  "autostakingToken": "token_for_autostaking_deposit",
  "days": 30
}
```

### Required Parameters:
- `privateKey`: Your wallet private key
- `taskId`: Unique identifier for tracking the operation

### Optional Parameters:
- `rpcUrl`: RPC endpoint (default: https://rpc.pharosnetwork.com)
- `loopCount`: Number of times to repeat the operation (default: 1)
- `timeoutMinMs`: Minimum delay between operations (default: 10000ms)
- `timeoutMaxMs`: Maximum delay between operations (default: 20000ms)
- `amountInPercent`: Percentage of balance to use (default: 1%)
- `slippage`: Slippage tolerance for swaps (default: 0.5%)
- `autostakingToken`: Required for autostaking deposit operations
- `days`: Registration duration for PNS (default: 30 days)

## 🔒 Security Features

- **Private Key Management**: Private keys are passed via API requests and not stored
- **Real-time Logging**: Comprehensive logging for debugging and monitoring
- **Error Handling**: Robust error handling with detailed error messages
- **Rate Limiting**: Built-in delays to avoid rate limiting
- **SSL Configuration**: Configurable SSL verification for development

## 📁 Project Structure

```
pharos-network/
├── app/                    # Next.js app directory
│   ├── api/               # API routes for all automation tools
│   │   ├── autostaking-*/ # Autostaking operations
│   │   ├── faroswap-*/    # Faroswap operations
│   │   ├── zenith-*/      # Zenith Finance operations
│   │   ├── cfd-trading/   # CFD trading
│   │   ├── rwafi-aquaflux/ # NFT minting
│   │   ├── pns/           # PNS registration
│   │   ├── primus/        # Primus automation
│   │   └── logs/          # Real-time logging
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard with all tools
├── scripts/               # Core automation logic
│   ├── pharosNetwork/     # Protocol-specific implementations
│   │   ├── autostaking/   # Autostaking operations
│   │   ├── faroswap/      # Faroswap operations
│   │   ├── zenithFinance/ # Zenith Finance operations
│   │   ├── cfdtrading/    # CFD trading
│   │   ├── rwafiAquaflux/ # NFT minting
│   │   ├── pns/           # PNS operations
│   │   └── primus/        # Primus operations
│   ├── utils/             # Utility functions
│   └── lib/               # Shared libraries and data
├── contracts/             # Smart contract definitions
├── ignition/              # Deployment modules
└── components/            # React components
```

## 🐛 Troubleshooting

### SSL/TLS Errors
If you encounter SSL certificate errors, the application includes:
```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```
**Warning**: This should only be used in development or trusted environments.

### Common Issues
1. **Private Key Required**: Ensure you provide a valid private key
2. **Task ID Required**: All operations require a unique task ID
3. **Autostaking Token**: Required for autostaking deposit operations
4. **Network Issues**: Check RPC URL connectivity
5. **Rate Limiting**: Built-in delays help avoid rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This software is for educational and automation purposes. Use at your own risk. Always verify transactions before execution and ensure you understand the risks involved in DeFi operations. Never share your private keys and always test with small amounts first.

## 🌐 Community & Support

### Join Telegram Winsnip Community

Stay updated and connect with the community:

- **Channel**: [https://t.me/winsnip](https://t.me/winsnip)
- **Group Chat**: [https://t.me/winsnip_hub](https://t.me/winsnip_hub)

### Support the Original Author

If you find this project helpful, consider supporting the original author:
- **Coffee**: [https://trakteer.id/Winsnipsupport/tip](https://trakteer.id/Winsnipsupport/tip)

## 🔗 Useful Links

### Pharos Network Faucets
Make sure your wallet is funded with enough gas (PHRS):
- [https://testnet.pharosnetwork.xyz/](https://testnet.pharosnetwork.xyz/)
- [https://web3.okx.com/ru/faucet/pharos/100013](https://web3.okx.com/ru/faucet/pharos/100013)
- [https://newshare.bwb.global/en/earnCoinsTasks?uuid=6b728693-35b6-4892-9991-a45e63aaf2a1&_nocache=true&_nobar=true&_needChain=eth](https://newshare.bwb.global/en/earnCoinsTasks?uuid=6b728693-35b6-4892-9991-a45e63aaf2a1&_nocache=true&_nobar=true&_needChain=eth)
- [https://zan.top/faucet/pharos](https://zan.top/faucet/pharos)
- [https://www.gas.zip/](https://www.gas.zip/)