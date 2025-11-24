import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AppConfig } from "./config/app.config";
import { DatabaseConfig } from "./config/db.config";

import { BillingModule } from "./core/billing/billing.module";
import { BeneficiaryModule } from "./core/beneficiary/beneficiary.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig, DatabaseConfig],
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("database.uri"),
      }),
    }),

    BillingModule,
    BeneficiaryModule,
  ],
})
export class AppModule {}
