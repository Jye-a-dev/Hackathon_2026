use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::constants::{ESCROW_SEED, VAULT_SEED, DEFAULT_TIMEOUT_DURATION};
use crate::errors::EscrowError;
use crate::events::EscrowInitialized;
use crate::state::{Escrow, EscrowStatus};

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Buyer nhận quyền sở hữu đơn hàng (ví cá nhân hoặc ví trừu tượng)
    pub buyer: UncheckedAccount<'info>,

    /// CHECK: Seller chỉ nhận tiền sau khi đơn hoàn tất
    pub seller: UncheckedAccount<'info>,

    /// CHECK: Arbiter (Admin) dùng để phân xử tranh chấp
    pub arbiter: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [ESCROW_SEED, order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA System Account đóng vai trò két sắt (Vault) giữ tiền
    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    order_id: u64,
    amount: u64,
    timeout_duration: Option<i64>,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    escrow.order_id = order_id;
    escrow.payer = ctx.accounts.payer.key();
    escrow.buyer = ctx.accounts.buyer.key();
    escrow.seller = ctx.accounts.seller.key();
    escrow.arbiter = ctx.accounts.arbiter.key();
    escrow.amount = amount;
    escrow.status = EscrowStatus::Locked;
    escrow.created_at = clock.unix_timestamp;
    escrow.delivered_at = 0;
    escrow.timeout_duration = timeout_duration.unwrap_or(DEFAULT_TIMEOUT_DURATION);
    escrow.bump = ctx.bumps.escrow;
    escrow.vault_bump = ctx.bumps.vault;

    // Chuyển SOL từ Payer (Relayer hoặc Buyer) vào Vault PDA
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        },
    );
    transfer(cpi_context, amount)?;

    emit!(EscrowInitialized {
        order_id,
        buyer: escrow.buyer,
        seller: escrow.seller,
        amount,
        timestamp: escrow.created_at,
    });

    Ok(())
}
