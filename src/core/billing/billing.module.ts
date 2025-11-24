import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { Billing, BillingSchema } from "./schemas/billing.schema";
import { BeneficiaryModule } from "../beneficiary/beneficiary.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    BeneficiaryModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
