import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";

import { BillingService } from "./billing.service";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from "express";
import express from "express";
import { Res } from "@nestjs/common";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(@UploadedFile() file: Express.Multer.File) {
    console.log("Arquivo recebido:", file?.originalname);
    return this.billingService.create(file);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.billingService.findById(id);
  }

  @Get("download/:product")
  async downloadByProduct(
    @Param("product") product: string,
    @Res() res: express.Response,
  ) {
    return this.billingService.downloadByProduct(product, res);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.billingService.delete(id);
  }
}
