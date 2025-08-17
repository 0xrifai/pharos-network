'use client'

import Link from 'next/link'

const tools = [
  { name: 'Rwafi Aquaflux', href: '/rwafi-aquaflux', description: 'Aquaflux minting automation' },
  { name: 'Autostaking Faucet', href: '/autostaking-faucet', description: 'Autostaking faucet automation' },
  { name: 'Autostaking Deposit', href: '/autostaking-deposit', description: 'Autostaking deposit via advisor' },
  { name: 'Autostaking Withdraw', href: '/autostaking-withdraw', description: 'Withdraw all vaults' },
  { name: 'CFD Trading', href: '/cfd-trading', description: 'Open CFD trades' },
  { name: 'Faroswap USDC Liquidity', href: '/faroswap-usdc-liquidity', description: 'Add USDC liquidity to Faroswap' },
  { name: 'Faroswap USDT Liquidity', href: '/faroswap-usdt-liquidity', description: 'Add USDT liquidity to Faroswap' },
  { name: 'Faroswap USDC Swap', href: '/faroswap-usdc-swap', description: 'Swap USDC on Faroswap' },
  { name: 'Faroswap WPHRS Swap', href: '/faroswap-wphrs-swap', description: 'Swap WPHRS on Faroswap' },
  { name: 'PNS', href: '/pns', description: 'Pharos Name Service' },
  { name: 'Primus', href: '/primus', description: 'Primus automation' },
  { name: 'Zenith USDC Liquidity', href: '/zenith-usdc-liquidity', description: 'Add USDC liquidity to Zenith' },
  { name: 'Zenith WPHRS Liquidity', href: '/zenith-wphrs-liquidity', description: 'Add WPHRS liquidity to Zenith' },
  { name: 'Zenith USDC Swap', href: '/zenith-usdc-swap', description: 'Swap USDC on Zenith' },
  { name: 'Zenith USDT Swap', href: '/zenith-usdt-swap', description: 'Swap USDT on Zenith' },
  { name: 'Zenith WPHRS Swap', href: '/zenith-wphrs-swap', description: 'Swap WPHRS on Zenith' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pharos Network Tools
          </h1>
          <p className="text-xl text-gray-600">
            Automation tools for Pharos Network ecosystem
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 hover:border-blue-300"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {tool.name}
              </h2>
              <p className="text-gray-600">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 