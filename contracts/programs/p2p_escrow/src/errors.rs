use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Trạng thái Escrow không hợp lệ cho hành động này.")]
    InvalidEscrowStatus,
    #[msg("Chưa hết thời hạn chờ 48 giờ để tự động giải ngân.")]
    TimeoutNotReached,
    #[msg("Đã quá thời hạn 48 giờ để gửi khiếu nại.")]
    DisputeWindowExpired,
    #[msg("Bạn không có quyền thực hiện hành động này.")]
    Unauthorized,
    #[msg("Giao dịch đang có khiếu nại, không thể hoàn tất.")]
    EscrowInDispute,
    #[msg("Số tiền ký quỹ không hợp lệ.")]
    InvalidAmount,
}
