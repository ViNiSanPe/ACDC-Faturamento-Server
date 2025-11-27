import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Billing } from "./schemas/billing.schema";
import { BeneficiaryService } from "../beneficiary/beneficiary.service";

import * as readline from "readline";

import { Readable } from "stream";
import { Response } from "express";

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name)
    private readonly billingModel: Model<Billing>,
    private readonly beneficiaryService: BeneficiaryService,
  ) {}

  async create(file: Express.Multer.File) {
    if (!file) {
      throw new Error("Nenhum arquivo enviado");
    }

    const buffer = file.buffer;
    const stream = Readable.from(buffer);

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const batch: unknown[] = [];

    for await (const line of rl) {
      const parts = line.split(",");
      batch.push({
        company: parts[0],
        product: parts[1],
        value: Number(parts[2]),
        totalLives: Number(parts[3]),
        timestamp: new Date(),
        fileName: file.originalname,
        fileSize: file.size,
      });
    }

    // salva tudo no Mongo
    return this.billingModel.insertMany(batch);
  }

  async findById(id: string) {
    const billing = await this.billingModel.findById(id).exec();
    if (!billing) throw new NotFoundException("Billing not found");
    return billing;
  }

  async downloadByProduct(product: string, res: Response) {
    const billings = await this.billingModel.find({ product }).exec();

    if (!billings.length) {
      throw new NotFoundException(`No billings found for product: ${product}`);
    }

    res.set({
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${product}-report.txt"`,
    });

    const stream = new Readable({
      read() {},
    });

    for (const bill of billings) {
      stream.push(`Company: ${bill.company}\n`);
      stream.push(`Product: ${bill.product}\n`);
      stream.push(`Value: ${bill.value}\n`);
      stream.push(`Total Lives: ${bill.totalLives}\n`);
      stream.push("-------------------- ----------\n");
    }

    stream.push(null);
    stream.pipe(res);
  }

  async delete(id: string) {
    const billing = await this.billingModel.findById(id).exec();

    if (!billing) {
      throw new NotFoundException("Billing not found");
    }

    await this.beneficiaryService.deleteAllByBilling(id);
    await this.billingModel.deleteOne({ _id: id });

    return { message: "Billing and Beneficiaries successfully removed" };
  }
}
