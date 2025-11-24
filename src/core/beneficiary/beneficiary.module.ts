import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { BeneficiaryService } from "./beneficiary.service";
import { Beneficiary, BeneficiarySchema } from "./schemas/beneficiary.schemas";
import { BeneficiaryController } from "./beneficiary.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Beneficiary.name, schema: BeneficiarySchema },
    ]),
  ],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService],
  exports: [BeneficiaryService],
})
export class BeneficiaryModule {}
