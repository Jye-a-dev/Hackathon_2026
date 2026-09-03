import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { P2P_ESCROW_IDL } from './idl/p2p_escrow.idl';
import { ESCROW_SEED, VAULT_SEED } from './solana.constants';
import {
  DisputeDecision,
  EscrowAccountData,
  EscrowStatusOnChain,
  PdaResult,
} from './solana.types';

@Injectable()
export class SolanaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private arbiterKeypair: Keypair;
  private program: Program;
  private listenerIds: number[] = [];

  onModuleInit() {
    this.initSolana();
  }

  onModuleDestroy() {
    this.cleanupListeners();
  }

  private initSolana() {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const wsUrl = process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com';
    const programIdStr =
      process.env.SOLANA_PROGRAM_ID ||
      'Eh9UPtnvbD3SX7NkNMk9BUKX6marhVMHWhdQ8Gus557a';

    this.logger.log(
      `Initializing Solana connection: RPC=${rpcUrl}, WS=${wsUrl}`,
    );

    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: wsUrl,
    });

    // Parse Arbiter Keypair
    this.arbiterKeypair = this.parseArbiterKeypair(
      process.env.ARBITER_PRIVATE_KEY,
    );
    this.logger.log(
      `Arbiter Wallet Public Key: ${this.arbiterKeypair.publicKey.toBase58()}`,
    );

    const wallet = new Wallet(this.arbiterKeypair);
    const provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });

    const programId = new PublicKey(programIdStr);
    this.program = new Program(P2P_ESCROW_IDL, provider);

    this.logger.log(
      `Solana Program initialized successfully for Program ID: ${programId.toBase58()}`,
    );
  }

  private parseArbiterKeypair(keyString?: string): Keypair {
    if (!keyString) {
      this.logger.warn(
        'ARBITER_PRIVATE_KEY not provided. Generating a random fallback keypair.',
      );
      return Keypair.generate();
    }

    try {
      const trimmed = keyString.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const bytes = JSON.parse(trimmed);
        return Keypair.fromSecretKey(Uint8Array.from(bytes));
      }

      // Try base58 decode
      const decodeFn = (bs58 as any).decode || (bs58 as any).default?.decode;
      if (typeof decodeFn === 'function') {
        const decoded = decodeFn(trimmed);
        return Keypair.fromSecretKey(Uint8Array.from(decoded));
      }

      throw new Error('No valid base58 decoder found');
    } catch (err: any) {
      this.logger.error(
        `Failed to parse ARBITER_PRIVATE_KEY: ${err.message}. Falling back to random keypair.`,
      );
      return Keypair.generate();
    }
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public getProgram(): Program {
    return this.program;
  }

  public getArbiterPublicKey(): PublicKey {
    return this.arbiterKeypair.publicKey;
  }

  /**
   * Derive Escrow PDA [Buffer.from("escrow"), orderId.to_le_bytes(8)]
   */
  public getEscrowPda(
    orderId: string | number | bigint | BN,
  ): [PublicKey, number] {
    const bnOrderId = this.toBN(orderId);
    const orderIdBuffer = bnOrderId.toArrayLike(Buffer, 'le', 8);
    return PublicKey.findProgramAddressSync(
      [ESCROW_SEED, orderIdBuffer],
      this.program.programId,
    );
  }

  /**
   * Derive Vault PDA [Buffer.from("vault"), escrowPda.toBuffer()]
   */
  public getVaultPda(escrowPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [VAULT_SEED, escrowPda.toBuffer()],
      this.program.programId,
    );
  }

  /**
   * Derive Escrow PDA and Vault PDA for an order ID
   */
  public calculatePdas(orderId: string | number | bigint | BN): PdaResult {
    const bnOrderId = this.toBN(orderId);
    const [escrowPda, escrowBump] = this.getEscrowPda(bnOrderId);
    const [vaultPda, vaultBump] = this.getVaultPda(escrowPda);

    return {
      escrowPda: escrowPda.toBase58(),
      escrowBump,
      vaultPda: vaultPda.toBase58(),
      vaultBump,
      orderId: bnOrderId.toString(),
    };
  }

  /**
   * Fetch and decode Escrow account from Solana blockchain
   */
  public async fetchEscrowAccount(
    orderId: string | number | bigint | BN,
  ): Promise<EscrowAccountData | null> {
    const { escrowPda } = this.calculatePdas(orderId);
    try {
      const accountPubkey = new PublicKey(escrowPda);
      const accountData = await (
        this.program.account as any
      ).escrow.fetchNullable(accountPubkey);
      return accountData as EscrowAccountData | null;
    } catch (err: any) {
      this.logger.error(
        `Error fetching Escrow account for orderId ${orderId}: ${err.message}`,
      );
      return null;
    }
  }

  /**
   * Convert on-chain status enum to human-readable string
   */
  public parseStatus(status: EscrowStatusOnChain): string {
    if ('locked' in status) return 'LOCKED';
    if ('delivered' in status) return 'DELIVERED';
    if ('completed' in status) return 'COMPLETED';
    if ('disputed' in status) return 'DISPUTED';
    if ('refunded' in status) return 'REFUNDED';
    return 'UNKNOWN';
  }

  /**
   * Arbiter / Authority marks order as delivered on-chain
   */
  public async markDelivered(
    orderId: string | number | bigint | BN,
  ): Promise<string> {
    const { escrowPda } = this.calculatePdas(orderId);
    this.logger.log(
      `Executing markDelivered for orderId: ${orderId}, Escrow PDA: ${escrowPda}`,
    );

    const txSig = await (this.program.methods as any)
      .markDelivered()
      .accounts({
        authority: this.arbiterKeypair.publicKey,
        escrow: new PublicKey(escrowPda),
      })
      .signers([this.arbiterKeypair])
      .rpc();

    this.logger.log(`markDelivered transaction confirmed: ${txSig}`);
    return txSig;
  }

  /**
   * Arbiter resolves dispute on-chain: Release to Seller or Refund to Buyer
   */
  public async resolveDispute(
    orderId: string | number | bigint | BN,
    decision: DisputeDecision,
  ): Promise<{ signature: string; status: string; recipient: string }> {
    const { escrowPda, vaultPda } = this.calculatePdas(orderId);
    const account = await this.fetchEscrowAccount(orderId);

    if (!account) {
      throw new Error(
        `Escrow on-chain account for orderId ${orderId} does not exist`,
      );
    }

    const currentStatus = this.parseStatus(account.status);
    if (currentStatus !== 'DISPUTED') {
      throw new Error(
        `Escrow is currently in ${currentStatus} state, must be DISPUTED to resolve.`,
      );
    }

    const decisionArg =
      decision === 'ReleaseToSeller'
        ? { releaseToSeller: {} }
        : { refundToBuyer: {} };

    const recipient =
      decision === 'ReleaseToSeller' ? account.seller : account.buyer;
    const finalStatus =
      decision === 'ReleaseToSeller' ? 'COMPLETED' : 'REFUNDED';

    this.logger.log(
      `Resolving dispute for orderId: ${orderId}, Decision: ${decision}, Recipient: ${recipient.toBase58()}`,
    );

    const txSig = await (this.program.methods as any)
      .resolveDispute(decisionArg)
      .accounts({
        arbiter: this.arbiterKeypair.publicKey,
        buyer: account.buyer,
        seller: account.seller,
        escrow: new PublicKey(escrowPda),
        vault: new PublicKey(vaultPda),
        systemProgram: SystemProgram.programId,
      })
      .signers([this.arbiterKeypair])
      .rpc();

    this.logger.log(`resolveDispute transaction confirmed: ${txSig}`);

    return {
      signature: txSig,
      status: finalStatus,
      recipient: recipient.toBase58(),
    };
  }

  /**
   * Complete escrow after 48h timeout expiration or buyer confirmation
   */
  public async completeEscrow(
    orderId: string | number | bigint | BN,
  ): Promise<string> {
    const { escrowPda, vaultPda } = this.calculatePdas(orderId);
    const account = await this.fetchEscrowAccount(orderId);

    if (!account) {
      throw new Error(
        `Escrow on-chain account for orderId ${orderId} does not exist`,
      );
    }

    this.logger.log(`Executing complete on-chain for orderId: ${orderId}`);

    const txSig = await (this.program.methods as any)
      .complete()
      .accounts({
        caller: this.arbiterKeypair.publicKey,
        seller: account.seller,
        escrow: new PublicKey(escrowPda),
        vault: new PublicKey(vaultPda),
        systemProgram: SystemProgram.programId,
      })
      .signers([this.arbiterKeypair])
      .rpc();

    this.logger.log(`complete transaction confirmed: ${txSig}`);
    return txSig;
  }

  /**
   * Subscribe to on-chain Anchor events and pass to handler
   */
  public subscribeToProgramEvents(
    handler: (
      eventName: string,
      data: any,
      slot: number,
      signature?: string,
    ) => Promise<void> | void,
  ) {
    const eventNames = [
      'escrowInitialized',
      'deliveredMarked',
      'escrowCompleted',
      'disputeRaised',
      'disputeResolved',
    ];

    for (const eventName of eventNames) {
      try {
        const listenerId = this.program.addEventListener(
          eventName,
          async (event: any, slot: number, sig: string) => {
            this.logger.log(
              `[On-Chain Event] ${eventName} caught at slot ${slot}`,
            );
            try {
              await handler(eventName, event, slot, sig);
            } catch (err: any) {
              this.logger.error(
                `Error processing event ${eventName}: ${err.message}`,
                err.stack,
              );
            }
          },
        );

        this.listenerIds.push(listenerId);
        this.logger.log(
          `Subscribed to Anchor event: ${eventName} (id: ${listenerId})`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to subscribe to Anchor event ${eventName}: ${err.message}`,
        );
      }
    }
  }

  private cleanupListeners() {
    for (const id of this.listenerIds) {
      try {
        this.program.removeEventListener(id);
      } catch (err: any) {
        this.logger.warn(`Error removing event listener ${id}: ${err.message}`);
      }
    }
    this.listenerIds = [];
  }

  private toBN(val: string | number | bigint | BN): BN {
    if (BN.isBN(val)) return val;
    return new BN(val.toString());
  }
}
