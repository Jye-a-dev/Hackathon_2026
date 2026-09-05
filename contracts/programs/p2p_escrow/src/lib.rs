use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Eh9UPtnvbD3SX7NkNMk9BUKX6marhVMHWhdQ8Gus557a");

#[program]
pub mod p2p_escrow {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        order_id: u64,
        amount: u64,
        timeout_duration: Option<i64>,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, order_id, amount, timeout_duration)
    }

    pub fn mark_delivered(ctx: Context<MarkDelivered>) -> Result<()> {
        instructions::mark_delivered::handler(ctx)
    }

    pub fn complete(ctx: Context<Complete>) -> Result<()> {
        instructions::complete::handler(ctx)
    }

    pub fn raise_dispute(ctx: Context<RaiseDispute>) -> Result<()> {
        instructions::raise_dispute::handler(ctx)
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, decision: DisputeDecision) -> Result<()> {
        instructions::resolve_dispute::handler(ctx, decision)
    }

    pub fn cancel_refund(ctx: Context<CancelRefund>) -> Result<()> {
        instructions::cancel_refund::handler(ctx)
    }
}
