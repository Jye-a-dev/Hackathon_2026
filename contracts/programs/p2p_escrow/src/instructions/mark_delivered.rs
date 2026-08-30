use anchor_lang::prelude::*;
use crate::constants::ESCROW_SEED;
use crate::errors::EscrowError;
use crate::events::DeliveredMarked;
use crate::state::{Escrow, EscrowStatus};

#[derive(Accounts)]
pub struct MarkDelivered<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.order_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn handler(ctx: Context<MarkDelivered>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    // Chỉ Arbiter (Server/Oracle) hoặc Seller được đánh dấu giao vận
    require!(
        ctx.accounts.authority.key() == escrow.arbiter || ctx.accounts.authority.key() == escrow.seller,
        EscrowError::Unauthorized
    );
    require!(escrow.status == EscrowStatus::Locked, EscrowError::InvalidEscrowStatus);

    let clock = Clock::get()?;
    escrow.status = EscrowStatus::Delivered;
    escrow.delivered_at = clock.unix_timestamp;

    emit!(DeliveredMarked {
        order_id: escrow.order_id,
        delivered_at: escrow.delivered_at,
        timeout_at: escrow.delivered_at + escrow.timeout_duration,
    });

    Ok(())
}
