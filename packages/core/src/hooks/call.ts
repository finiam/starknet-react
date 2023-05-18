import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Abi,
  ContractInterface,
  ProviderInterface,
  constants,
  number,
  shortString,
  uint256,
} from 'starknet'
import { BlockNumber } from 'starknet'

import { useStarknet } from '../providers'
import { useContract } from './contract'
import { useInvalidateOnBlock } from './invalidate'
import { ABI_BALANCE_FRAGMENT, ETH_DECIMALS, ETH_ERC20 } from './balance'
import { chainById, useNetwork } from '..'

/** Contract Read options. */
export interface UseContractReadOptions {
  /** Refresh data at every block. */
  watch?: boolean
  /** Block identifier used when performing call. */
  blockIdentifier?: BlockNumber
}

/** Arguments for `useContractRead`. */
export interface UseContractReadArgs<T extends unknown[]> {
  /** The target contract's ABI. */
  abi: Abi
  /** The target contract's address. */
  address: string
  /** The contract's function name. */
  functionName: string
  /** Read arguments. */
  args?: T
}

/** Value returned from `useContractRead`. */
export interface UseContractReadResult {
  /** Value returned from call. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Array<any>
  /** Error when performing call. */
  error?: unknown
  isIdle: boolean
  /** True when performing call. */
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  /** False when performing call. */
  isError: boolean
  isFetched: boolean
  isFetchedAfterMount: boolean
  /** True when performing call. */
  isRefetching: boolean
  /** Manually trigger refresh of data. */
  refetch: () => void
  status: 'idle' | 'error' | 'loading' | 'success'
}

/**
 * Hook to perform a read-only contract call.
 *
 * @remarks
 *
 * The hook only performs a call if the target `abi`, `address`,
 * `functionName`, and `args` are not undefined.
 *
 * @example
 * This example shows how to fetch the user ERC-20 balance.
 * ```tsx
 * function Component() {
 *   const { address } = useAccount()
 *   const { data, isLoading, error, refetch } = useStarknetCall({
 *     address: ethAddress,
 *     abi: compiledErc20.abi,
 *     functionName: 'balanceOf',
 *     args: [address],
 *     watch: false
 *   })
 *
 *   if (isLoading) return <span>Loading...</span>
 *   if (error) return <span>Error: {error}</span>
 *
 *   return (
 *     <div>
 *       <button onClick={refetch}>Refetch</button>
 *       <p>Balance: {JSON.stringify(data)}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useContractRead<T extends unknown[]>({
  abi,
  address,
  functionName,
  args,
  watch = false,
  blockIdentifier = 'pending',
}: UseContractReadArgs<T> & UseContractReadOptions): UseContractReadResult {
  const { library } = useStarknet()
  const { contract } = useContract({ abi, address })

  const queryKey_ = useMemo(
    () => queryKey({ library, args: { contract, functionName, args, blockIdentifier } }),
    [library, contract, functionName, args, blockIdentifier]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    data,
    error,
    isStale: isIdle,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    isFetched,
    isFetchedAfterMount,
    isRefetching,
    refetch,
    status,
  } = useQuery<any | undefined>(
    queryKey_,
    readContract({ args: { contract, functionName, args, blockIdentifier } })
  )

  useInvalidateOnBlock({ enabled: watch, queryKey: queryKey_ })

  return {
    data,
    error: error ?? undefined,
    isIdle,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    isFetched,
    isFetchedAfterMount,
    isRefetching,
    refetch,
    status,
  }
}

export interface QueryResult {
  /** Error when performing call. */
  error?: unknown
  isIdle: boolean
  /** True when performing call. */
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  /** False when performing call. */
  isError: boolean
  isFetched: boolean
  isFetchedAfterMount: boolean
  /** True when performing call. */
  isRefetching: boolean
  /** Manually trigger refresh of data. */
  refetch: () => void
  status: 'idle' | 'error' | 'loading' | 'success'
}

export interface UseBalanceArgs {
  address?: string
  token?: string
  decimals?: number
}

export interface UseBalanceResult extends QueryResult {
  data?: {
    decimals: number
    formatted: string
    symbol: string
    value: ReturnType<typeof uint256.uint256ToBN>
  }
}

const ETH_ADDRESS = {
  [constants.StarknetChainId.MAINNET]: '',
  [constants.StarknetChainId.TESTNET]: '',
  [constants.StarknetChainId.TESTNET2]: '',
} as const

export function useBalance({
  address,
  token,
  decimals = ETH_DECIMALS,
  watch = false,
  blockIdentifier = 'pending',
}: UseBalanceArgs & UseContractReadOptions): UseBalanceResult {
  const { library } = useStarknet()
  const { chain } = useNetwork()

  const defaultToken = ETH_ADDRESS[chain?.id || constants.StarknetChainId.TESTNET]

  const readContractArgs = {
    balanceOf: [address],
    symbol: [],
  }

  const { contract } = useContract({ abi: ABI_BALANCE_FRAGMENT, address: token || defaultToken })

  const balanceQueryKey_ = useMemo(
    () =>
      queryKey({
        library,
        args: {
          contract,
          functionName: 'balanceOf',
          args: readContractArgs.balanceOf,
          blockIdentifier,
        },
      }),
    [library, contract, address, blockIdentifier]
  )

  const symbolQueryKey_ = useMemo(
    () =>
      queryKey({
        library,
        args: { contract, functionName: 'symbol', args: readContractArgs.symbol, blockIdentifier },
      }),
    [library, contract, address, blockIdentifier]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balanceQuery = useQuery<any | undefined>(
    balanceQueryKey_,
    readContract({
      args: {
        contract,
        functionName: 'balanceOf',
        args: readContractArgs.balanceOf,
        blockIdentifier,
      },
    })
  )

  const symbolQuery = useQuery<any | undefined>(
    symbolQueryKey_,
    readContract({
      args: { contract, functionName: 'symbol', args: readContractArgs.symbol, blockIdentifier },
    })
  )

  useInvalidateOnBlock({ enabled: watch, queryKey: balanceQueryKey_ })

  const data = useMemo<UseBalanceResult['data'] | undefined>(() => {
    if (!symbolQuery.data || !balanceQuery.data) {
      return undefined
    }

    const asBN = uint256.uint256ToBN(balanceQuery.data.balance)
    const formatted = (Number(asBN.toString()) / 10 ** decimals).toString()
    const formattedSymbol = shortString.decodeShortString(symbolQuery.data.symbol)

    return {
      decimals,
      formatted,
      symbol: formattedSymbol,
      value: asBN,
    }
  }, [balanceQuery, symbolQuery])

  function combineQueryStates(key: keyof typeof symbolQuery | keyof typeof balanceQuery) {
    return symbolQuery[key] || balanceQuery[key]
  }

  return {
    data,
    error: combineQueryStates('error') ?? undefined,
    isIdle: combineQueryStates('isStale'),
    isLoading: combineQueryStates('isLoading'),
    isFetching: combineQueryStates('isFetching'),
    isSuccess: combineQueryStates('isSuccess'),
    isError: combineQueryStates('isError'),
    isFetched: combineQueryStates('isFetched'),
    isFetchedAfterMount: combineQueryStates('isFetchedAfterMount'),
    isRefetching: combineQueryStates('isRefetching'),
    refetch: () => {
      symbolQuery.refetch()
      balanceQuery.refetch()
    },
    status: combineQueryStates('status'),
  }
}

interface ReadContractArgs {
  contract?: ContractInterface
  functionName?: string
  args?: unknown[]
  blockIdentifier: BlockNumber
}

function readContract({ args }: { args: ReadContractArgs }) {
  //console.log(`make read for ${args.functionName} on ${args.contract}, has args: ${!!args.args}`)
  return async () => {
    if (!args.args || !args.contract || !args.functionName) {
      console.log(`no call, args wrong`)
      return null
    }
    const call = args.contract && args.functionName && args.contract[args.functionName]
    if (!call) {
      console.log(`no call, no fn`)
      console.log(args.contract)
      return null
    }

    console.log(`call ${args.functionName}`)

    return await call(...args.args, {
      blockIdentifier: args.blockIdentifier,
    })
  }
}

function queryKey({ library, args }: { library: ProviderInterface; args: ReadContractArgs }) {
  const { contract, functionName, args: callArgs, blockIdentifier } = args
  return [
    {
      entity: 'readContract',
      chainId: library.chainId,
      contract: contract?.address,
      functionName,
      args: callArgs,
      blockIdentifier,
    },
  ] as const
}
