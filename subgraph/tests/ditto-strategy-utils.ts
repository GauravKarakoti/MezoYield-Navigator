import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  RedeemClaimed,
  RedeemRequested
} from "../generated/DittoStrategy/DittoStrategy"

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

export function createRedeemClaimedEvent(
  requestId: BigInt,
  assetsOut: BigInt
): RedeemClaimed {
  let redeemClaimedEvent = changetype<RedeemClaimed>(newMockEvent())

  redeemClaimedEvent.parameters = new Array()

  redeemClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId)
    )
  )
  redeemClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "assetsOut",
      ethereum.Value.fromUnsignedBigInt(assetsOut)
    )
  )

  return redeemClaimedEvent
}

export function createRedeemRequestedEvent(
  requestId: BigInt,
  shares: BigInt,
  amount: BigInt
): RedeemRequested {
  let redeemRequestedEvent = changetype<RedeemRequested>(newMockEvent())

  redeemRequestedEvent.parameters = new Array()

  redeemRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId)
    )
  )
  redeemRequestedEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )
  redeemRequestedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return redeemRequestedEvent
}
