import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Deposited,
  Paused,
  Rebalanced,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  StrategyAdded,
  StrategyCapUpdated,
  TargetUpdated,
  TotalCapUpdated,
  Unpaused,
  Withdrawn
} from "../generated/YieldRouter/YieldRouter"

export function createDepositedEvent(
  user: Address,
  musdIn: BigInt,
  sharesOut: BigInt
): Deposited {
  let depositedEvent = changetype<Deposited>(newMockEvent())

  depositedEvent.parameters = new Array()

  depositedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  depositedEvent.parameters.push(
    new ethereum.EventParam("musdIn", ethereum.Value.fromUnsignedBigInt(musdIn))
  )
  depositedEvent.parameters.push(
    new ethereum.EventParam(
      "sharesOut",
      ethereum.Value.fromUnsignedBigInt(sharesOut)
    )
  )

  return depositedEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createRebalancedEvent(
  from: Address,
  to: Address,
  amount: BigInt
): Rebalanced {
  let rebalancedEvent = changetype<Rebalanced>(newMockEvent())

  rebalancedEvent.parameters = new Array()

  rebalancedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  rebalancedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  rebalancedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rebalancedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createStrategyAddedEvent(
  strategy: Address,
  cap: BigInt
): StrategyAdded {
  let strategyAddedEvent = changetype<StrategyAdded>(newMockEvent())

  strategyAddedEvent.parameters = new Array()

  strategyAddedEvent.parameters.push(
    new ethereum.EventParam("strategy", ethereum.Value.fromAddress(strategy))
  )
  strategyAddedEvent.parameters.push(
    new ethereum.EventParam("cap", ethereum.Value.fromUnsignedBigInt(cap))
  )

  return strategyAddedEvent
}

export function createStrategyCapUpdatedEvent(
  strategy: Address,
  cap: BigInt
): StrategyCapUpdated {
  let strategyCapUpdatedEvent = changetype<StrategyCapUpdated>(newMockEvent())

  strategyCapUpdatedEvent.parameters = new Array()

  strategyCapUpdatedEvent.parameters.push(
    new ethereum.EventParam("strategy", ethereum.Value.fromAddress(strategy))
  )
  strategyCapUpdatedEvent.parameters.push(
    new ethereum.EventParam("cap", ethereum.Value.fromUnsignedBigInt(cap))
  )

  return strategyCapUpdatedEvent
}

export function createTargetUpdatedEvent(
  strategy: Address,
  bps: BigInt
): TargetUpdated {
  let targetUpdatedEvent = changetype<TargetUpdated>(newMockEvent())

  targetUpdatedEvent.parameters = new Array()

  targetUpdatedEvent.parameters.push(
    new ethereum.EventParam("strategy", ethereum.Value.fromAddress(strategy))
  )
  targetUpdatedEvent.parameters.push(
    new ethereum.EventParam("bps", ethereum.Value.fromUnsignedBigInt(bps))
  )

  return targetUpdatedEvent
}

export function createTotalCapUpdatedEvent(cap: BigInt): TotalCapUpdated {
  let totalCapUpdatedEvent = changetype<TotalCapUpdated>(newMockEvent())

  totalCapUpdatedEvent.parameters = new Array()

  totalCapUpdatedEvent.parameters.push(
    new ethereum.EventParam("cap", ethereum.Value.fromUnsignedBigInt(cap))
  )

  return totalCapUpdatedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}

export function createWithdrawnEvent(
  user: Address,
  sharesIn: BigInt,
  musdOut: BigInt
): Withdrawn {
  let withdrawnEvent = changetype<Withdrawn>(newMockEvent())

  withdrawnEvent.parameters = new Array()

  withdrawnEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  withdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "sharesIn",
      ethereum.Value.fromUnsignedBigInt(sharesIn)
    )
  )
  withdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "musdOut",
      ethereum.Value.fromUnsignedBigInt(musdOut)
    )
  )

  return withdrawnEvent
}
