import { get, groupBy, sortBy, sumBy } from 'lodash'

export let getFeeEstimator = function (options) {
  // in most cases (P2PKH):
  // 10 = version: 4, locktime: 4, inputs and outputs count: 1
  // 148 = txId: 32, vout: 4, count: 1, script: 107, sequence: 4
  // 34 = value: 8, count: 1, scriptPubKey: 25
  if (typeof get(options, 'fee') === 'number') return () => get(options, 'fee')
  let feePerByte = get(options, 'feePerKB', 20000) / 1000
  let extraBytes = get(options, 'extraBytes', 0)
  let outputsFee = get(options, 'outputs', 1) * 34
  return (utxos) => Math.ceil((10 + utxos.length * 148 + outputsFee + extraBytes) * feePerByte)
}

export let select = function (utxos, feeEstimator, target) {
  // simple, but not optimized selection
  let result = { utxos: [], value: 0 }
  for (let utxo of sortBy(utxos, 'value')) {
    result.utxos.push(utxo)
    result.value += utxo.value
    if (result.value - feeEstimator(result.utxo) >= target) return result
  }

  return null
}

export default function utxoSelection (utxos, target, options) {
  let minChange = get(options, 'minChange', 546)
  let feeEstimator = getFeeEstimator(options)

  // check that total sum is enough
  let total = sumBy(utxos, 'value') - feeEstimator(utxos)
  if (total < target) return null
  if (total < target + minChange) return utxos

  // select only one utxo (tx without change)
  let solution1 = utxos.reduce((solution, utxo) => {
    let value = utxo.value
    let fee = feeEstimator([utxo])
    if (value >= target + fee && value < target + fee + minChange && value < solution[0].value) return [utxo]
    return solution
  }, [{ value: Infinity }])
  if (isFinite(solution1[0].value)) return solution1

  // select group of utxos related with one address
  let grouped = groupBy(utxos, 'address')
  let solution2 = Object.keys(grouped).reduce((solution, address) => {
    let selected = select(grouped[address], feeEstimator, target)
    if (selected === null) return solution

    let {utxos, value} = selected
    let fee = feeEstimator(utxos)
    let solutionValue = sumBy(solution, 'value')
    if (value < target + fee + minChange) return value < solutionValue ? utxos : solution // tx without change?
    return (isFinite(solution[0].value) && solutionValue < value) ? solution : utxos
  }, [{ value: Infinity }])
  if (isFinite(solution2[0].value)) return solution2

  // select group
  return select(utxos, feeEstimator, target).utxos
}
