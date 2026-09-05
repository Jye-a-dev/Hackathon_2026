use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum EscrowStatus {
    Locked,      // Tiền đã nạp vào vault, chờ giao hàng
    Delivered,   // Đã giao hàng, kích hoạt đồng hồ đếm ngược 48h
    Completed,   // Đã giải ngân cho Seller
    Disputed,    // Đang có khiếu nại, đóng băng quỹ
    Refunded,    // Đã hoàn tiền về cho Buyer
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub order_id: u64,          // 8 bytes (ID đồng bộ từ Backend PostgreSQL)
    pub payer: Pubkey,          // 32 bytes (Ví trả phí thuê rent PDA: Relayer hoặc Buyer)
    pub buyer: Pubkey,          // 32 bytes (Ví người mua)
    pub seller: Pubkey,         // 32 bytes
    pub arbiter: Pubkey,        // 32 bytes (Admin/Arbiter xử lý tranh chấp)
    pub amount: u64,            // 8 bytes (Số lamports ký quỹ)
    pub status: EscrowStatus,   // 1 + padding byte
    pub created_at: i64,        // 8 bytes
    pub delivered_at: i64,      // 8 bytes (Unix timestamp khi hàng được giao)
    pub timeout_duration: i64,  // 8 bytes (Mặc định 48h tính bằng giây)
    pub bump: u8,               // 1 byte
    pub vault_bump: u8,         // 1 byte
}
