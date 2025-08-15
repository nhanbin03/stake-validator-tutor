validator staking_validator {
  withdraw(_redeemer, _account, _context) {
    True
  }

  else(_) {
    fail
  }
}
