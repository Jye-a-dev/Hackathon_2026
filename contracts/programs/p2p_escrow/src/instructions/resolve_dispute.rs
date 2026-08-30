use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::constants::{ESCROW_SEED, VAULT_SEED};
use crate::errors::EscrowError;
use crate::events::DisputeResolved;
use crate::state::{Escrow, EscrowStatus};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DisputeDecision {
    ReleaseToSeller, // Phán quyết chuyển tiền cho Seller
    RefundToBuyer,   // Phán quyết hoàn tiền lại cho Buyer
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut, address = escrow.arbiter)]
    pub arbiter: Signer<'info>,

    /// CHECK: Buyer nhận hoàn tiền
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,

    /// CHECK: Seller nhận giải ngân
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.order_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Vault PDA chuyển tiền
    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.key().as_ref()],
        bump = escrow.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ResolveDispute>, decision: DisputeDecision) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.status == EscrowStatus::Disputed, EscrowError::InvalidEscrowStatus);

    let amount = escrow.amount;

    let (recipient_info, final_status) = match decision {
        DisputeDecision::ReleaseToSeller => {
            escrow.status = EscrowStatus::Completed;
            (ctx.accounts.seller.to_account_info(), EscrowStatus::Completed)
        }
        DisputeDecision::RefundToBuyer => {
            escrow.status = EscrowStatus::Refunded;
            (ctx.accounts.buyer.to_account_info(), EscrowStatus::Refunded)
        }
    };

    let escrow_key = escrow.key();
    let seeds = &[
        VAULT_SEED,
        escrow_key.as_ref(),
        &[escrow.vault_bump],
    ];
    let signer = &[&seeds[..]];

    // Chuyển tiền an toàn từ Vault sang người thụ hưởng qua System Program CPI
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: recipient_info.clone(),
            },
            signer,
        ),
        amount,
    )?;

    emit!(DisputeResolved {
        order_id: escrow.order_id,
        recipient: recipient_info.key(),
        amount,
        status: final_status,
    });

    Ok(())
}
