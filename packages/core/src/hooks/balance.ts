export const ETH_ERC20 = '0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7'
export const ETH_DECIMALS = 18
export const ABI_BALANCE_FRAGMENT = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      {
        name: 'account',
        type: 'felt',
      },
    ],
    outputs: [
      {
        name: 'balance',
        type: 'Uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: 'symbol',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
