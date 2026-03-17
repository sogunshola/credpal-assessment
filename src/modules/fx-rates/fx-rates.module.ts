import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FxRatesService } from './fx-rates.service';
import { FxRatesController } from './fx-rates.controller';

@Module({
  imports: [HttpModule],
  controllers: [FxRatesController],
  providers: [FxRatesService],
  exports: [FxRatesService],
})
export class FxRatesModule {}
