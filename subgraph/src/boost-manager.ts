import {
  AutoBoostSet as AutoBoostSetEvent,
  LockedToVeMezo as LockedToVeMezoEvent,
  MezoClaimed as MezoClaimedEvent,
  MezoCredited as MezoCreditedEvent,
  OperatorSet as OperatorSetEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
} from "../generated/BoostManager/BoostManager"
import {
  AutoBoostSet,
  LockedToVeMezo,
  MezoClaimed,
  MezoCredited,
  OperatorSet,
  OwnershipTransferred,
} from "../generated/schema"

export function handleAutoBoostSet(event: AutoBoostSetEvent): void {
  let entity = new AutoBoostSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.enabled = event.params.enabled

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLockedToVeMezo(event: LockedToVeMezoEvent): void {
  let entity = new LockedToVeMezo(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.amount = event.params.amount
  entity.unlockTime = event.params.unlockTime

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMezoClaimed(event: MezoClaimedEvent): void {
  let entity = new MezoClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMezoCredited(event: MezoCreditedEvent): void {
  let entity = new MezoCredited(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorSet(event: OperatorSetEvent): void {
  let entity = new OperatorSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.op = event.params.op
  entity.enabled = event.params.enabled

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

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
