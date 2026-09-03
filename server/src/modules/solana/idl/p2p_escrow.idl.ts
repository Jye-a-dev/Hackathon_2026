import { Idl } from '@coral-xyz/anchor';

export const P2P_ESCROW_IDL: any = {
  address: 'Eh9UPtnvbD3SX7NkNMk9BUKX6marhVMHWhdQ8Gus557a',
  metadata: {
    name: 'p2p_escrow',
    version: '0.1.0',
    spec: '0.1.0',
    description:
      'P2P Escrow Program with 48h timeout and arbiter dispute resolution',
  },
  instructions: [
    {
      name: 'initialize',
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        { name: 'buyer', writable: true, signer: true },
        { name: 'seller', writable: false, signer: false },
        { name: 'arbiter', writable: false, signer: false },
        {
          name: 'escrow',
          writable: true,
          signer: false,
          pda: {
            seeds: [
              { kind: 'const', value: [101, 115, 99, 114, 111, 119] },
              { kind: 'arg', path: 'orderId' },
            ],
          },
        },
        {
          name: 'vault',
          writable: true,
          signer: false,
          pda: {
            seeds: [
              { kind: 'const', value: [118, 97, 117, 108, 116] },
              { kind: 'account', path: 'escrow' },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'orderId', type: 'u64' },
        { name: 'amount', type: 'u64' },
        { name: 'timeoutDuration', type: { option: 'i64' } },
      ],
    },
    {
      name: 'markDelivered',
      discriminator: [217, 246, 178, 12, 194, 238, 252, 103],
      accounts: [
        { name: 'authority', writable: true, signer: true },
        { name: 'escrow', writable: true, signer: false },
      ],
      args: [],
    },
    {
      name: 'complete',
      discriminator: [0, 77, 224, 147, 136, 25, 208, 62],
      accounts: [
        { name: 'caller', writable: true, signer: true },
        { name: 'seller', writable: true, signer: false },
        { name: 'escrow', writable: true, signer: false },
        { name: 'vault', writable: true, signer: false },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },
    {
      name: 'raiseDispute',
      discriminator: [219, 198, 143, 140, 194, 151, 142, 230],
      accounts: [
        { name: 'buyer', writable: true, signer: true },
        { name: 'escrow', writable: true, signer: false },
      ],
      args: [],
    },
    {
      name: 'resolveDispute',
      discriminator: [238, 79, 78, 77, 228, 125, 121, 223],
      accounts: [
        { name: 'arbiter', writable: true, signer: true },
        { name: 'buyer', writable: true, signer: false },
        { name: 'seller', writable: true, signer: false },
        { name: 'escrow', writable: true, signer: false },
        { name: 'vault', writable: true, signer: false },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'decision', type: { defined: { name: 'disputeDecision' } } },
      ],
    },
  ],
  accounts: [
    {
      name: 'escrow',
      discriminator: [31, 213, 123, 187, 186, 251, 214, 218],
    },
  ],
  events: [
    {
      name: 'escrowInitialized',
      discriminator: [111, 49, 137, 237, 24, 239, 19, 13],
    },
    {
      name: 'deliveredMarked',
      discriminator: [219, 114, 254, 86, 128, 129, 78, 16],
    },
    {
      name: 'escrowCompleted',
      discriminator: [197, 185, 23, 201, 102, 230, 221, 140],
    },
    {
      name: 'disputeRaised',
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
    },
    {
      name: 'disputeResolved',
      discriminator: [84, 180, 140, 93, 230, 103, 117, 72],
    },
  ],
  types: [
    {
      name: 'escrow',
      type: {
        kind: 'struct',
        fields: [
          { name: 'orderId', type: 'u64' },
          { name: 'buyer', type: 'pubkey' },
          { name: 'seller', type: 'pubkey' },
          { name: 'arbiter', type: 'pubkey' },
          { name: 'amount', type: 'u64' },
          { name: 'status', type: { defined: { name: 'escrowStatus' } } },
          { name: 'createdAt', type: 'i64' },
          { name: 'deliveredAt', type: 'i64' },
          { name: 'timeoutDuration', type: 'i64' },
          { name: 'bump', type: 'u8' },
          { name: 'vaultBump', type: 'u8' },
        ],
      },
    },
    {
      name: 'escrowInitialized',
      type: {
        kind: 'struct',
        fields: [
          { name: 'orderId', type: 'u64' },
          { name: 'buyer', type: 'pubkey' },
          { name: 'seller', type: 'pubkey' },
          { name: 'amount', type: 'u64' },
          { name: 'timestamp', type: 'i64' },
        ],
      },
    },
    {
      name: 'deliveredMarked',
      type: {
        kind: 'struct',
        fields: [
          { name: 'orderId', type: 'u64' },
          { name: 'deliveredAt', type: 'i64' },
          { name: 'timeoutAt', type: 'i64' },
        ],
      },
    },
    {
      name: 'escrowCompleted',
      type: {
        kind: 'struct',
        fields: [
          { name: 'orderId', type: 'u64' },
          { name: 'seller', type: 'pubkey' },
          { name: 'amount', type: 'u64' },
          { name: 'timestamp', type: 'i64' },
        ],
      },
    },
    {
      name: 'disputeRaised',
      type: {
        kind: 'struct',
        fields: [
          { name: 'orderId', type: 'u64' },
          { name: 'buyer', type: 'pubkey' },
          { name: 'timestamp', type: 'i64' },
        ],
      },
    },
    {
      name: 'disputeResolved',
      type: {
        kind: 'struct',
        fields: [
          { name: 'orderId', type: 'u64' },
          { name: 'recipient', type: 'pubkey' },
          { name: 'amount', type: 'u64' },
          { name: 'status', type: { defined: { name: 'escrowStatus' } } },
        ],
      },
    },
    {
      name: 'escrowStatus',
      type: {
        kind: 'enum',
        variants: [
          { name: 'locked' },
          { name: 'delivered' },
          { name: 'completed' },
          { name: 'disputed' },
          { name: 'refunded' },
        ],
      },
    },
    {
      name: 'disputeDecision',
      type: {
        kind: 'enum',
        variants: [{ name: 'releaseToSeller' }, { name: 'refundToBuyer' }],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'invalidEscrowStatus',
      msg: 'Trạng thái Escrow không hợp lệ cho hành động này.',
    },
    {
      code: 6001,
      name: 'timeoutNotReached',
      msg: 'Chưa hết thời hạn chờ 48 giờ để tự động giải ngân.',
    },
    {
      code: 6002,
      name: 'disputeWindowExpired',
      msg: 'Đã quá thời hạn 48 giờ để gửi khiếu nại.',
    },
    {
      code: 6003,
      name: 'unauthorized',
      msg: 'Bạn không có quyền thực hiện hành động này.',
    },
    {
      code: 6004,
      name: 'escrowInDispute',
      msg: 'Giao dịch đang có khiếu nại, không thể hoàn tất.',
    },
    { code: 6005, name: 'invalidAmount', msg: 'Số tiền ký quỹ không hợp lệ.' },
  ],
};
