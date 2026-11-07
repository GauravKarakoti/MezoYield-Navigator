import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  AutoBoostSet,
  LockedToVeMezo,
  MezoClaimed,
  MezoCredited,
  OperatorSet,
  OwnershipTransferred
} from "../generated/BoostManager/BoostManager"

export function createAutoBoostSetEvent(
  user: Address,
  enabled: boolean
): AutoBoostSet {
  let autoBoostSetEvent = changetype<AutoBoostSet>(newMockEvent())

  autoBoostSetEvent.parameters = new Array()

  autoBoostSetEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  autoBoostSetEvent.parameters.push(
    new ethereum.EventParam("enabled", ethereum.Value.fromBoolean(enabled))
  )

  return autoBoostSetEvent
}

export function createLockedToVeMezoEvent(
  amount: BigInt,
  unlockTime: BigInt
): LockedToVeMezo {
  let lockedToVeMezoEvent = changetype<LockedToVeMezo>(newMockEvent())

  lockedToVeMezoEvent.parameters = new Array()

  lockedToVeMezoEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  lockedToVeMezoEvent.parameters.push(
    new ethereum.EventParam(
      "unlockTime",
      ethereum.Value.fromUnsignedBigInt(unlockTime)
    )
  )

  return lockedToVeMezoEvent
}

export function createMezoClaimedEvent(
  user: Address,
  amount: BigInt
): MezoClaimed {
  let mezoClaimedEvent = changetype<MezoClaimed>(newMockEvent())

  mezoClaimedEvent.parameters = new Array()

  mezoClaimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  mezoClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return mezoClaimedEvent
}

export function createMezoCreditedEvent(
  user: Address,
  amount: BigInt
): MezoCredited {
  let mezoCreditedEvent = changetype<MezoCredited>(newMockEvent())

  mezoCreditedEvent.parameters = new Array()

  mezoCreditedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  mezoCreditedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return mezoCreditedEvent
}

export function createOperatorSetEvent(
  op: Address,
  enabled: boolean
): OperatorSet {
  let operatorSetEvent = changetype<OperatorSet>(newMockEvent())

  operatorSetEvent.parameters = new Array()

  operatorSetEvent.parameters.push(
    new ethereum.EventParam("op", ethereum.Value.fromAddress(op))
  )
  operatorSetEvent.parameters.push(
    new ethereum.EventParam("enabled", ethereum.Value.fromBoolean(enabled))
  )

  return operatorSetEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}
