import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ExecutorSet } from "../generated/schema"
import { ExecutorSet as ExecutorSetEvent } from "../generated/GaugeVoteModule/GaugeVoteModule"
import { handleExecutorSet } from "../src/gauge-vote-module"
import { createExecutorSetEvent } from "./gauge-vote-module-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let exec = Address.fromString("0x0000000000000000000000000000000000000001")
    let enabled = "boolean Not implemented"
    let newExecutorSetEvent = createExecutorSetEvent(exec, enabled)
    handleExecutorSet(newExecutorSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ExecutorSet created and stored", () => {
    assert.entityCount("ExecutorSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ExecutorSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "exec",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ExecutorSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "enabled",
      "boolean Not implemented"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
