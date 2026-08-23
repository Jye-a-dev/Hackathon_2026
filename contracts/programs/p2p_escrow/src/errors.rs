use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Timeout has not been reached yet.")]
    TimeoutNotReached,
    #[msg("Unauthorized action.")]
    Unauthorized,
}
