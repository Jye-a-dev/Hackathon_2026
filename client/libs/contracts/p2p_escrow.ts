/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 * _This file is generated._
 */
export type P2pEscrow = {
  address: "HxRDoZFg52q9R5y1VGTSPEMqJjyW3WNgnxsz5bN8ooXk";
  metadata: {
    name: "p2p_escrow";
    version: "0.2.0";
    spec: "0.1.0";
    description: "P2P Escrow Program with 48h timeout, arbiter dispute resolution, wallet abstraction and rent reclaim";
  };
  instructions: [
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        { name: "payer"; writable: true; signer: true },
        { name: "buyer"; writable: false; signer: false },
        { name: "seller"; writable: false; signer: false },
        { name: "arbiter"; writable: false; signer: false },
        { name: "escrow"; writable: true; signer: false },
        { name: "vault"; writable: true; signer: false },
        { name: "systemProgram"; address: "11111111111111111111111111111111" }
      ];
      args: [
        { name: "orderId"; type: "u64" },
        { name: "amount"; type: "u64" },
        { name: "timeoutDuration"; type: { option: "i64" } }
      ];
    },
    {
      name: "markDelivered";
      discriminator: [217, 246, 178, 12, 194, 238, 252, 103];
      accounts: [
        { name: "authority"; writable: true; signer: true },
        { name: "escrow"; writable: true; signer: false }
      ];
      args: [];
    },
    {
      name: "complete";
      discriminator: [0, 77, 224, 147, 136, 25, 208, 62];
      accounts: [
        { name: "caller"; writable: true; signer: true },
        { name: "payer"; writable: true; signer: false },
        { name: "seller"; writable: true; signer: false },
        { name: "escrow"; writable: true; signer: false },
        { name: "vault"; writable: true; signer: false },
        { name: "systemProgram"; address: "11111111111111111111111111111111" }
      ];
      args: [];
    },
    {
      name: "raiseDispute";
      discriminator: [219, 198, 143, 140, 194, 151, 142, 230];
      accounts: [
        { name: "buyer"; writable: true; signer: true },
        { name: "escrow"; writable: true; signer: false }
      ];
      args: [];
    },
    {
      name: "resolveDispute";
      discriminator: [238, 79, 78, 77, 228, 125, 121, 223];
      accounts: [
        { name: "arbiter"; writable: true; signer: true },
        { name: "payer"; writable: true; signer: false },
        { name: "buyer"; writable: true; signer: false },
        { name: "seller"; writable: true; signer: false },
        { name: "escrow"; writable: true; signer: false },
        { name: "vault"; writable: true; signer: false },
        { name: "systemProgram"; address: "11111111111111111111111111111111" }
      ];
      args: [
        { name: "decision"; type: { defined: { name: "disputeDecision" } } }
      ];
    },
    {
      name: "cancelRefund";
      discriminator: [192, 62, 158, 203, 193, 97, 26, 15];
      accounts: [
        { name: "caller"; writable: true; signer: true },
        { name: "payer"; writable: true; signer: false },
        { name: "buyer"; writable: true; signer: false },
        { name: "escrow"; writable: true; signer: false },
        { name: "vault"; writable: true; signer: false },
        { name: "systemProgram"; address: "11111111111111111111111111111111" }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "escrow";
      discriminator: [31, 213, 123, 187, 186, 251, 214, 218];
    }
  ];
  events: [
    { name: "escrowInitialized"; discriminator: [111, 49, 137, 237, 24, 239, 19, 13] },
    { name: "deliveredMarked"; discriminator: [219, 114, 254, 86, 128, 129, 78, 16] },
    { name: "escrowCompleted"; discriminator: [197, 185, 23, 201, 102, 230, 221, 140] },
    { name: "disputeRaised"; discriminator: [183, 18, 70, 156, 148, 109, 161, 34] },
    { name: "disputeResolved"; discriminator: [84, 180, 140, 93, 230, 103, 117, 72] },
    { name: "escrowCancelled"; discriminator: [98, 241, 195, 122, 213, 0, 162, 161] }
  ];
  types: [
    {
      name: "escrowStatus";
      type: {
        kind: "enum";
        variants: [
          { name: "locked" },
          { name: "delivered" },
          { name: "completed" },
          { name: "disputed" },
          { name: "refunded" }
        ];
      };
    },
    {
      name: "disputeDecision";
      type: {
        kind: "enum";
        variants: [
          { name: "releaseToSeller" },
          { name: "refundToBuyer" }
        ];
      };
    }
  ];
};

