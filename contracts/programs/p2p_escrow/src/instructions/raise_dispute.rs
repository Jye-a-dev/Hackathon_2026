use anchor_lang::prelude::*;
use crate::constants::ESCROW_SEED;
use crate::errors::EscrowError;
use crate::events::DisputeRaised;
use crate::state::{Escrow, EscrowStatus};

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut, address = escrow.buyer)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.order_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn handler(ctx: Context<RaiseDispute>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    require!(escrow.status == EscrowStatus::Delivered, EscrowError::InvalidEscrowStatus);

    // Chỉ được khiếu nại trong cửa sổ 48h kể từ lúc Delivered
    require!(
        clock.unix_timestamp < (escrow.delivered_at + escrow.timeout_duration),
        EscrowError::DisputeWindowExpired
    );

    escrow.status = EscrowStatus::Disputed;

    emit!(DisputeRaised {
        order_id: escrow.order_id,
        buyer: escrow.buyer,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
