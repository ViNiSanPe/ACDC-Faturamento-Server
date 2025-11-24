import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Billing } from "./schemas/billing.schema";
import { BeneficiaryService } from "../beneficiary/beneficiary.service";
import { CreateBillingDto } from "./dto/create-billing.dto";

import { Readable } from "stream";
import { createInterface } from "readline";
import { Worker } from "worker_threads";
import { join } from "path";
import { Response } from "express";
import { WorkerMessage } from "./types/worker.types";

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name)
    private readonly billingModel: Model<Billing>,
    private readonly beneficiaryService: BeneficiaryService,
  ) {}

  private calculateThreads(fileSize: number): number {
    if (fileSize < 5 * 1024 * 1024) return 1;
    if (fileSize < 20 * 1024 * 1024) return 2;
    return 3;
  }

  async create(file: Express.Multer.File, dto: CreateBillingDto) {
    try {
      const billing = await this.billingModel.create(dto);

      const threads = this.calculateThreads(file.size);
      console.log(`Usando ${threads} threads para processar o arquivo.`);

      const workers: Worker[] = [];
      const finishedWorkers = new Set<number>();

      const readable = Readable.from(file.buffer);

      const rl = createInterface({
        input: readable,
        crlfDelay: Infinity,
      });

      let lineIndex = 0;

      for (let i = 0; i < threads; i++) {
        const worker = new Worker(
          join(__dirname, "worker", "processTxt.worker.js"),
          {
            workerData: { billingId: billing._id.toString() },
          },
        );
        workers.push(worker);
      }

      rl.on("line", (line: string) => {
        const workerIndex = lineIndex % threads;
        workers[workerIndex].postMessage({ line });
        lineIndex++;
      });

      rl.on("close", () => {
        workers.forEach((w) => w.postMessage({ done: true }));
      });

      const workerPromises = workers.map((worker, index) => {
        return new Promise<void>((resolve, reject) => {
          worker.on("message", (raw: unknown) => {
            void (async () => {
              const msg = raw as WorkerMessage;

              try {
                if ("batch" in msg) {
                  await this.beneficiaryService.createMany(
                    billing._id.toString(),
                    msg.batch,
                  );
                }

                if ("finished" in msg) {
                  finishedWorkers.add(index);

                  if (finishedWorkers.size === workers.length) {
                    resolve();
                  }
                }
              } catch (err) {
                reject(
                  err instanceof Error ? err : new Error("Erro desconhecido"),
                );
              }
            })();
          });

          worker.on("error", reject);
          worker.on("exit", (code) => {
            if (code !== 0)
              reject(new Error(`Worker ${index} saiu com código ${code}`));
          });
        });
      });

      await Promise.all(workerPromises);

      return {
        message: "Processamento concluído com múltiplas threads!",
        billingId: billing._id,
        totalWorkers: threads,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : "Erro ao processar billing",
      );
    }
  }

  async findById(id: string) {
    const billing = await this.billingModel.findById(id).exec();
    if (!billing) throw new NotFoundException("Billing não encontrado");
    return billing;
  }

  async downloadByProduct(product: string, res: Response) {
    const billings = await this.billingModel.find({ product }).exec();

    if (!billings.length) {
      throw new NotFoundException("Nenhum billing encontrado para o produto");
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
      stream.push("------------------------------\n");
    }

    stream.push(null);
    stream.pipe(res);
  }

  async delete(id: string) {
    const billing = await this.billingModel.findById(id).exec();

    if (!billing) {
      throw new NotFoundException("Billing não encontrado");
    }

    await this.beneficiaryService.deleteAllByBilling(id);
    await this.billingModel.deleteOne({ _id: id });

    return { message: "Billing e Beneficiários removidos" };
  }
}
