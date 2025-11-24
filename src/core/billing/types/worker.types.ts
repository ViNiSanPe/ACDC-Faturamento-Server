export interface WorkerBatchMessage {
  batch: BeneficiaryParsed[];
}

export interface WorkerFinishedMessage {
  finished: true;
  total: number;
}

export type WorkerMessage = WorkerBatchMessage | WorkerFinishedMessage;

export interface BeneficiaryParsed {
  name: string;
  cpf: string;
  value: number;
  gender: string;
  birthDate: string;
  billing: string;
}
export interface BillingWorkerData {
  billingId: string;
}
