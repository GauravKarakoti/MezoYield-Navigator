import {
  OwnershipTransferred as OwnershipTransferredEvent,
  RedeemClaimed as RedeemClaimedEvent,
  RedeemRequested as RedeemRequestedEvent,
} from "../generated/DittoStrategy/DittoStrategy"
import {
  OwnershipTransferred,
  RedeemClaimed,
  RedeemRequested,
} from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedeemClaimed(event: RedeemClaimedEvent): void {
  let entity = new RedeemClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.requestId = event.params.requestId
  entity.assetsOut = event.params.assetsOut

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedeemRequested(event: RedeemRequestedEvent): void {
  let entity = new RedeemRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.requestId = event.params.requestId
  entity.shares = event.params.shares
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
