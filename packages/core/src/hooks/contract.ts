import { useMemo } from 'react'
import {
  Abi,
  AccountInterface,
  CompiledContract,
  Contract,
  ContractFactory,
  ProviderInterface,
} from 'starknet'
import { useStarknet } from '../providers'

/** Arguments for `useContract`. */
export interface UseContractProps {
  /** The contract abi. */
  abi?: Abi
  /** The contract address. */
  address?: string
}

/** Value returned from `useContract`. */
export interface UseContractResult {
  /** The contract. */
  contract?: Contract
}

/**
 * Hook to bind a `Contract` instance.
 *
 * @remarks
 *
 * The returned contract is a starknet.js `Contract` object.
 *
 * @example
 * This example creates a new contract from its address and abi.
 * ```tsx
 * function Component() {
 *   const { contract } = useContract({
 *     address: ethAddress,
 *     abi: compiledErc20.abi
 *   })
 *
 *   return <span>{contract.address}</span>
 * }
 * ```
 */
export function useContract({ abi, address }: UseContractProps): UseContractResult {
  const { library } = useStarknet()

  const contract = useMemo(() => {
    if (abi && address && library) {
      return new Contract(abi, address, library)
    }
  }, [abi, address, library])

  return { contract }
}

/** Arguments for `useContractFactory`. */
export interface UseContractFactoryProps {
  /** The compiled contract. */
  compiledContract?: CompiledContract
  /** The contract abi. */
  abi?: Abi
  /** The account or provider used for deploying. */
  providerOrAccount?: ProviderInterface | AccountInterface
}

/** Value returned from `useContractFactory`. */
export interface UseContractFactoryResult {
  /** The contract factory. */
  contractFactory?: ContractFactory
}

/**
 * Hook to create a `ContractFactory`.
 *
 * @remarks
 *
 * The returned contract factory is a starknet.js `ContractFactory` object.
 *
 * This hook works well with `useDeploy`.
 *
 * @example
 * This example shows how to create a contract factory.
 * ```tsx
 * function Component() {
 *   const { account } = useAccount()
 *   const { contractFactory } = useContractFactory({
 *     compiledContract: compiledErc20,
 *     abi: compiledErc20.abi,
 *     providerOrAccount: account
 *   })
 *
 *   return <p>Nothing to see here...</p>
 * }
 * ```
 */
export function useContractFactory({
  compiledContract,
  abi,
  providerOrAccount,
}: UseContractFactoryProps): UseContractFactoryResult {
  const contractFactory = useMemo(() => {
    if (compiledContract) {
      return new ContractFactory(compiledContract, providerOrAccount, abi)
    }
  }, [compiledContract, providerOrAccount, abi])

  return { contractFactory }
}
