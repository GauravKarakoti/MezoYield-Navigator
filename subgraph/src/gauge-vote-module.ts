import {
  ExecutorSet as ExecutorSetEvent,
  IntentSet as IntentSetEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  VoteCast as VoteCastEvent,
} from "../generated/GaugeVoteModule/GaugeVoteModule"
import {
  ExecutorSet,
  IntentSet,
  OwnershipTransferred,
  VoteCast,
} from "../generated/schema"

export function handleExecutorSet(event: ExecutorSetEvent): void {
  let entity = new ExecutorSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.exec = event.params.exec
  entity.enabled = event.params.enabled

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleIntentSet(event: IntentSetEvent): void {
  let entity = new IntentSet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.gauge = event.params.gauge
  entity.weightBps = event.params.weightBps

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

export function handleVoteCast(event: VoteCastEvent): void {
  let entity = new VoteCast(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.gauge = event.params.gauge
  entity.weightBps = event.params.weightBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
