import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
import { BeneficiaryService } from "./beneficiary.service";
import { CreateBeneficiaryDto } from "./dto/create-beneficiary.dto";

@Controller("beneficiary")
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post("create-many/:billingId")
  async createMany(
    @Param("billingId") billingId: string,
    @Body() beneficiaries: CreateBeneficiaryDto[],
  ) {
    return this.beneficiaryService.createMany(billingId, beneficiaries);
  }

  @Get("by-billing/:billingId")
  async findAllByBilling(@Param("billingId") billingId: string) {
    return this.beneficiaryService.findAllByBilling(billingId);
  }

  @Delete("by-billing/:billingId")
  async deleteAllByBilling(@Param("billingId") billingId: string) {
    return this.beneficiaryService.deleteAllByBilling(billingId);
  }
}
