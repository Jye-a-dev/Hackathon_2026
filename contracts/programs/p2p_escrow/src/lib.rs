use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("YourProgramIDHere11111111111111111111111111111");

#[program]
pub mod p2p_escrow {
    use super::*;

    pub fn initialize_escrow(ctx: Context<instructions::InitializeEscrow>, amount: u64, timeout: i64) -> Result<()> {
        instructions::initialize(ctx, amount, timeout)
    }
}
