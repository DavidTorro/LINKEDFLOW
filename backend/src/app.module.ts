import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { envValidationSchema } from "./config/env.config";
import { HealthModule } from "./modules/health/health.module";
import { CommentsModule } from "./modules/comments/comments.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    HealthModule,
    CommentsModule,
  ],
})
export class AppModule {}
