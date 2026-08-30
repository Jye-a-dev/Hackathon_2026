import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { P2pEscrow } from "../target/types/p2p_escrow";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("p2p_escrow integration tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2pEscrow as Program<P2pEscrow>;

  const buyer = anchor.web3.Keypair.generate();
  const seller = anchor.web3.Keypair.generate();
  const arbiter = anchor.web3.Keypair.generate();
  const orderId = new anchor.BN(Date.now());
  const amount = new anchor.BN(1 * LAMPORTS_PER_SOL);

  let escrowPda: PublicKey;
  let vaultPda: PublicKey;

  before(async () => {
    // Airdrop SOL cho các actors
    for (const kp of [buyer, seller, arbiter]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig);
    }

    const orderIdBuffer = orderId.toArrayLike(Buffer, "le", 8);
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), orderIdBuffer],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), escrowPda.toBuffer()],
      program.programId
    );
  });

  it("1. Khởi tạo Escrow và lock tiền vào Vault", async () => {
    await program.methods
      .initialize(orderId, amount, new anchor.BN(2)) // Đặt timeout test là 2 giây
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        arbiter: arbiter.publicKey,
        escrow: escrowPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    expect(escrowAccount.amount.toNumber()).to.equal(amount.toNumber());
    expect(escrowAccount.buyer.toBase58()).to.equal(buyer.publicKey.toBase58());
    expect(escrowAccount.seller.toBase58()).to.equal(seller.publicKey.toBase58());
    expect(escrowAccount.status).to.deep.equal({ locked: {} });
  });

  it("2. Đánh dấu đơn hàng đã được giao (Mark Delivered)", async () => {
    await program.methods
      .markDelivered()
      .accounts({
        authority: arbiter.publicKey,
        escrow: escrowPda,
      })
      .signers([arbiter])
      .rpc();

    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    expect(escrowAccount.status).to.deep.equal({ delivered: {} });
  });

  it("3. Giải ngân thành công cho Seller sau khi Buyer confirm sớm", async () => {
    const sellerBalanceBefore = await provider.connection.getBalance(seller.publicKey);

    await program.methods
      .complete()
      .accounts({
        caller: buyer.publicKey,
        seller: seller.publicKey,
        escrow: escrowPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const sellerBalanceAfter = await provider.connection.getBalance(seller.publicKey);
    expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(amount.toNumber());

    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    expect(escrowAccount.status).to.deep.equal({ completed: {} });
  });

  describe("Kịch bản tranh chấp (Dispute Flow)", () => {
    const disputeOrderId = new anchor.BN(Date.now() + 1000);
    let disputeEscrowPda: PublicKey;
    let disputeVaultPda: PublicKey;

    before(async () => {
      const orderIdBuffer = disputeOrderId.toArrayLike(Buffer, "le", 8);
      [disputeEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), orderIdBuffer],
        program.programId
      );
      [disputeVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), disputeEscrowPda.toBuffer()],
        program.programId
      );

      // Khởi tạo escrow mới để test dispute
      await program.methods
        .initialize(disputeOrderId, amount, new anchor.BN(100))
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          arbiter: arbiter.publicKey,
          escrow: disputeEscrowPda,
          vault: disputeVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Mark delivered
      await program.methods
        .markDelivered()
        .accounts({
          authority: seller.publicKey,
          escrow: disputeEscrowPda,
        })
        .signers([seller])
        .rpc();
    });

    it("4. Buyer gửi khiếu nại (Raise Dispute)", async () => {
      await program.methods
        .raiseDispute()
        .accounts({
          buyer: buyer.publicKey,
          escrow: disputeEscrowPda,
        })
        .signers([buyer])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(disputeEscrowPda);
      expect(escrowAccount.status).to.deep.equal({ disputed: {} });
    });

    it("5. Arbiter giải quyết khiếu nại - Hoàn tiền lại cho Buyer (Refund to Buyer)", async () => {
      const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

      await program.methods
        .resolveDispute({ refundToBuyer: {} })
        .accounts({
          arbiter: arbiter.publicKey,
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          escrow: disputeEscrowPda,
          vault: disputeVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([arbiter])
        .rpc();

      const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(amount.toNumber());

      const escrowAccount = await program.account.escrow.fetch(disputeEscrowPda);
      expect(escrowAccount.status).to.deep.equal({ refunded: {} });
    });
  });
});
