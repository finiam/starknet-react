import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Abi, ContractInterface, ProviderInterface, uint256 } from 'starknet'
import { BlockNumber } from 'starknet'

import { useStarknet } from '../providers'
import { useContract } from './contract'
import { useInvalidateOnBlock } from './invalidate'
import { ABI_BALANCE_FRAGMENT, ETH_DECIMALS, ETH_ERC20 } from './balance'

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

export interface UseBalanceArgs {
  address?: string
  token?: string
  decimals?: number
}

export function useBalance({
  address,
  token,
  decimals = ETH_DECIMALS,
  watch = false,
  blockIdentifier = 'pending',
}: UseBalanceArgs & UseContractReadOptions) {
  const contractAddress = token || ETH_ERC20
  const functionName = 'balanceOf'
  const args = [address]

  const { library } = useStarknet()
  const { contract } = useContract({ abi: ABI_BALANCE_FRAGMENT, address: contractAddress })

  const queryKey_ = useMemo(
    () =>
      queryKey({
        library,
        args: { contract, functionName, args, blockIdentifier },
      }),
    [library, contract, address, blockIdentifier]
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

  const parsedBalance = useMemo<string>(() => {
    if (!data) return ''

    if (!uint256.isUint256(data)) return ''

    const asBN = uint256.uint256ToBN(data.balance)
    const parsed = asBN.toString() / 10 ** decimals

    console.log(data.balance)
    console.log(asBN)
    console.log(asBN.toString())

    return parsed.toString()
  }, [data])

  return {
    data,
    balance: parsedBalance,
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

interface ReadContractArgs {
  contract?: ContractInterface
  functionName?: string
  args?: unknown[]
  blockIdentifier: BlockNumber
}

function readContract({ args }: { args: ReadContractArgs }) {
  return async () => {
    if (!args.args || !args.contract || !args.functionName) return null
    const call = args.contract && args.functionName && args.contract[args.functionName]
    if (!call) return null

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
