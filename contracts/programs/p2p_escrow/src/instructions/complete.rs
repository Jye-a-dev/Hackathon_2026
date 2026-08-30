use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::constants::{ESCROW_SEED, VAULT_SEED};
use crate::errors::EscrowError;
use crate::events::EscrowCompleted;
use crate::state::{Escrow, EscrowStatus};

#[derive(Accounts)]
pub struct Complete<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    /// CHECK: Seller nhận tiền giải ngân
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.order_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Vault PDA chuyển tiền đi thông qua System Program CPI signed seeds
    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.key().as_ref()],
        bump = escrow.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Complete>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    require!(escrow.status == EscrowStatus::Delivered, EscrowError::InvalidEscrowStatus);

    // Người mua có thể confirm sớm, hoặc bất kỳ ai (Cranker/Seller) gọi hàm khi đã qua 48h
    let is_buyer = ctx.accounts.caller.key() == escrow.buyer;
    let is_timeout_passed = clock.unix_timestamp >= (escrow.delivered_at + escrow.timeout_duration);

    require!(is_buyer || is_timeout_passed, EscrowError::TimeoutNotReached);

    escrow.status = EscrowStatus::Completed;

    // Rút lamports từ Vault PDA chuyển sang Seller an toàn qua System Program CPI có signer seeds
    let escrow_key = escrow.key();
    let seeds = &[
        VAULT_SEED,
        escrow_key.as_ref(),
        &[escrow.vault_bump],
    ];
    let signer = &[&seeds[..]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer,
        ),
        escrow.amount,
    )?;

    emit!(EscrowCompleted {
        order_id: escrow.order_id,
        seller: escrow.seller,
        amount: escrow.amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
