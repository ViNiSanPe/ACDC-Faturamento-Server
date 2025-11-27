import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Billing {
  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  product: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  totalLives: number;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
