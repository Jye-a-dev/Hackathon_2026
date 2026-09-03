import { Global, Module } from '@nestjs/common';
import { pgProvider, PG_POOL } from './pg.provider';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [pgProvider, DatabaseService],
  exports: [PG_POOL, DatabaseService],
})
export class DatabaseModule {}
