use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::constants::{ESCROW_SEED, VAULT_SEED};
use crate::errors::EscrowError;
use crate::events::EscrowCancelled;
use crate::state::{Escrow, EscrowStatus};

#[derive(Accounts)]
pub struct CancelRefund<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    /// CHECK: Nhận lại rent-exempt lamports từ việc đóng Escrow PDA
    #[account(mut, address = escrow.payer)]
    pub payer: UncheckedAccount<'info>,

    /// CHECK: Buyer nhận hoàn lại tiền ký quỹ
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.order_id.to_le_bytes().as_ref()],
        bump = escrow.bump,
        close = payer
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Vault PDA chuyển tiền hoàn trả qua System Program CPI
    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.key().as_ref()],
        bump = escrow.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelRefund>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    // Chỉ cho phép hủy khi đơn còn ở trạng thái Locked (chưa giao hàng)
    require!(
        escrow.status == EscrowStatus::Locked,
        EscrowError::CancelNotAllowed
    );

    // Người gọi phải là Buyer hoặc Arbiter/Admin
    let caller_key = ctx.accounts.caller.key();
    require!(
        caller_key == escrow.buyer || caller_key == escrow.arbiter,
        EscrowError::Unauthorized
    );

    escrow.status = EscrowStatus::Refunded;

    let escrow_key = escrow.key();
    let seeds = &[
        VAULT_SEED,
        escrow_key.as_ref(),
        &[escrow.vault_bump],
    ];
    let signer = &[&seeds[..]];

    // Hoàn trả toàn bộ lamports ký quỹ từ Vault về ví Buyer
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.buyer.to_account_info(),
            },
            signer,
        ),
        escrow.amount,
    )?;

    emit!(EscrowCancelled {
        order_id: escrow.order_id,
        buyer: escrow.buyer,
        amount: escrow.amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

