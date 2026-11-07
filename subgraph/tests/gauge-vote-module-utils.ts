import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ExecutorSet,
  IntentSet,
  OwnershipTransferred,
  VoteCast
} from "../generated/GaugeVoteModule/GaugeVoteModule"

export function createExecutorSetEvent(
  exec: Address,
  enabled: boolean
): ExecutorSet {
  let executorSetEvent = changetype<ExecutorSet>(newMockEvent())

  executorSetEvent.parameters = new Array()

  executorSetEvent.parameters.push(
    new ethereum.EventParam("exec", ethereum.Value.fromAddress(exec))
  )
  executorSetEvent.parameters.push(
    new ethereum.EventParam("enabled", ethereum.Value.fromBoolean(enabled))
  )

  return executorSetEvent
}

export function createIntentSetEvent(
  user: Address,
  gauge: Address,
  weightBps: BigInt
): IntentSet {
  let intentSetEvent = changetype<IntentSet>(newMockEvent())

  intentSetEvent.parameters = new Array()

  intentSetEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  intentSetEvent.parameters.push(
    new ethereum.EventParam("gauge", ethereum.Value.fromAddress(gauge))
  )
  intentSetEvent.parameters.push(
    new ethereum.EventParam(
      "weightBps",
      ethereum.Value.fromUnsignedBigInt(weightBps)
    )
  )

  return intentSetEvent
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

export function createVoteCastEvent(
  user: Address,
  gauge: Address,
  weightBps: BigInt
): VoteCast {
  let voteCastEvent = changetype<VoteCast>(newMockEvent())

  voteCastEvent.parameters = new Array()

  voteCastEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam("gauge", ethereum.Value.fromAddress(gauge))
  )
  voteCastEvent.parameters.push(
    new ethereum.EventParam(
      "weightBps",
      ethereum.Value.fromUnsignedBigInt(weightBps)
    )
  )

  return voteCastEvent
}
