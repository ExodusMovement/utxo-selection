# utxo-selection

[![NPM Package](https://img.shields.io/npm/v/utxo-selection.svg?style=flat-square)](https://www.npmjs.org/package/utxo-selection)
[![Build Status](https://img.shields.io/travis/exodusmovement/utxo-selection.svg?branch=master&style=flat-square)](https://travis-ci.org/exodusmovement/utxo-selection)
[![Dependency status](https://img.shields.io/david/exodusmovement/utxo-selection.svg?style=flat-square)](https://david-dm.org/exodusmovement/utxo-selection#info=dependencies)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Based on ideas from [challenges-optimizing-unspent-output-selection (BitGo)](https://blog.bitgo.com/challenges-optimizing-unspent-output-selection/)

## API

##### `function utxoSelection (utxos, target, options)`

- `utxos`: *Array* of *Objects*:
  - `address`: *String*
  - `value`: *Number*
- `target`: *Number* (in satoshis)
- `options`: *Object*
  - `minChange`: *?Number* (by default 546 satoshi)
  - `fee`: *?Number* (fee as constant)
  - `feePerKB`: *?Number* (by default 20000 satoshis)
  - `extraBytes`: *?Number* (count of extra bytes for fee calculation, by default: 0)
  - `outputs`: *?Number* (number of outputs, by default 1)

Fee calculated on next formula:
```
(10 + inputs * 148 + outputs * 34 + extra_bytes) * feePerKB / 1000
```
where:

```
10 = 4 (version) + 4 (locktime) + 1 (inputs count) + 1 (outputs count)
148 = 32 (txId) + 4 (vout) + 1 (P2PKH scriptSig length) + 107 (P2PKH scriptSig) + 4 (sequence)
34 = 8 (value) + 4 (P2PKH scriptPubKey length) + 25 (P2PKH scriptPubKey)
```
