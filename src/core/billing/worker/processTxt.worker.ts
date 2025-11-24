import { parentPort, workerData } from "worker_threads";
import { BeneficiaryParsed, BillingWorkerData } from "../types/worker.types";

const BATCH_SIZE = Number(process.env.WORKER_BATCH_SIZE);

const data = workerData as BillingWorkerData;

let batch: BeneficiaryParsed[] = [];
let total = 0;

parentPort?.on("message", (msg: { line?: string; done?: boolean }) => {
  if (msg.line) {
    const parsed = parseLine(msg.line);

    batch.push(parsed);
    total++;

    if (batch.length >= BATCH_SIZE) {
      parentPort?.postMessage({ batch });
      batch = [];
    }
  }

  if (msg.done) {
    if (batch.length > 0) {
      parentPort?.postMessage({ batch });
    }

    parentPort?.postMessage({
      finished: true,
      total,
    });
  }
});
function parseLine(line: string): BeneficiaryParsed {
  const parts = line.split(";");

  return {
    name: parts[0],
    cpf: parts[1],
    value: Number(parts[2]),
    gender: parts[3],
    birthDate: parts[4],
    billing: data.billingId,
  };
}
