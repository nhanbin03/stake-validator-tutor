use aiken/collection/list
use cardano/address.{Credential}
use cardano/script_context.{ScriptContext}
use cardano/transaction.{Transaction}

validator spending_validator(staking_validator_hash: Credential) {
  spend(_datum, _redeemer, _utxo, context: ScriptContext) {
    let ScriptContext { transaction, .. } = context
    list.length(transaction.withdrawals) > 0
    // let is_staking_validator_present =
    //   list.any(
    //     transaction.withdrawals,
    //     fn(withdrawal) {
    //       trace @"Withdrawal": withdrawal.1st
    //       trace @"Staking validator hash": staking_validator_hash
    //       // withdrawal.1st == staking_validator_hash
    //       True
    //     },
    //   )

    // expect is_staking_validator_present

    // // Code ...
    // True
  }

  else(_) {
    fail
  }
}
