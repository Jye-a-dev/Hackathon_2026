use anchor_lang::prelude::*;
use crate::state::EscrowStatus;

#[event]
pub struct EscrowInitialized {
    pub order_id: u64,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct DeliveredMarked {
    pub order_id: u64,
    pub delivered_at: i64,
    pub timeout_at: i64,
}

#[event]
pub struct EscrowCompleted {
    pub order_id: u64,
    pub seller: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct DisputeRaised {
    pub order_id: u64,
    pub buyer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub order_id: u64,
    pub recipient: Pubkey,
    pub amount: u64,
    pub status: EscrowStatus,
}

#[event]
pub struct EscrowCancelled {
    pub order_id: u64,
    pub buyer: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

