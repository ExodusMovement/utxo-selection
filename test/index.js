import t from 'tap'
import { constant, sortBy } from 'lodash'
import * as utxoSelection from '../src'

t.test('getFeeEstimator', (t) => {
  t.test('return function with static fee', (t) => {
    let feeEstimator = utxoSelection.getFeeEstimator({fee: 10000})
    t.type(feeEstimator, 'function')
    t.same(feeEstimator(0), 10000)
    t.same(feeEstimator(10), 10000)
    t.end()
  })

  t.test('return function with dynamic fee', (t) => {
    let feeEstimator = utxoSelection.getFeeEstimator({ feePerKB: 1000, extraBytes: 100, outputs: 2 })
    t.type(feeEstimator, 'function')
    t.same(feeEstimator(new Array(1)), 326)
    t.same(feeEstimator(new Array(10)), 1658)
    t.end()
  })

  t.end()
})

t.test('select', (t) => {
  t.test('return null', (t) => {
    t.same(utxoSelection.select([]), null)
    t.end()
  })

  t.test('select 2 from 3', (t) => {
    let utxos = [{ value: 4 }, { value: 2 }, { value: 3 }]
    let result = utxoSelection.select(utxos, constant(0), 4)
    let expected = { utxos: sortBy(utxos, 'value').slice(0, 2), value: 5 }
    t.same(result, expected)
    t.end()
  })

  t.end()
})

t.test('default', (t) => {
  let options = { minChange: 100, fee: 100 }

  t.test('value not enough', (t) => {
    t.same(utxoSelection.default([{ value: 199 }], 100, options), null)
    t.end()
  })

  t.test('exact match', (t) => {
    let utxos = [{ value: 1000 }, { value: 110 }]
    t.same(utxoSelection.default(utxos, 1000, options), utxos)
    t.end()
  })

  t.test('exact match with 1 utxo', (t) => {
    let utxos = [
      { value: 1099 }, // less than target + fee
      { value: 1200 }, // more than target + fee + minChange
      { value: 1150 }, // ok
      { value: 1151 }, // worst than best
      { value: 1149 } // better than previous best
    ]
    t.same(utxoSelection.default(utxos, 1000, options), [{ value: 1149 }])
    t.end()
  })

  t.test('grouped by address', (t) => {
    let utxos = [
      { address: 'addr1', value: 1000 },
      { address: 'addr1', value: 99 }, // not enough for this address
      { address: 'addr2', value: 1000 },
      { address: 'addr2', value: 250 }, // ok
      { address: 'addr3', value: 1000 },
      { address: 'addr3', value: 251 }, // worst then best
      { address: 'addr4', value: 1000 },
      { address: 'addr4', value: 249 }, // better than best
      { address: 'addr5', value: 1000 },
      { address: 'addr5', value: 150 }, // yet better
      { address: 'addr6', value: 1000 },
      { address: 'addr6', value: 151 }, // worst than best
      { address: 'addr7', value: 1000 },
      { address: 'addr7', value: 149 } // yet better
    ]
    let expected = [{ address: 'addr7', value: 149 }, { address: 'addr7', value: 1000 }]
    t.same(utxoSelection.default(utxos, 1000, options), expected)
    t.end()
  })

  t.test('select with multiple addresses', (t) => {
    let utxos = [
      { address: 'addr1', value: 550 },
      { address: 'addr1', value: 549 },
      { address: 'addr2', value: 551 }
    ]
    t.same(utxoSelection.default(utxos, 1000, options), sortBy(utxos, 'value'))
    t.end()
  })

  t.end()
})
