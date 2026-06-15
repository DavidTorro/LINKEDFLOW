import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EnvConfig } from "./config/env.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get("WEB_SERVER_PORT", { infer: true });
  const frontendUrl = configService.get("FRONTEND_URL", { infer: true });
  const localDirUrl = configService.get("LOCAL_DIR_URL", { infer: true });
  const nodeEnv = configService.get("NODE_ENV", { infer: true });
  const swaggerEnabled = configService.get("SWAGGER_ENABLED", { infer: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: [frontendUrl, localDirUrl].filter(Boolean),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  if (swaggerEnabled && nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("LinkedFlow API")
      .setDescription("Backend API for LinkedFlow")
      .setVersion("0.1.0")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      jsonDocumentUrl: "api/docs-json",
    });
  }

  await app.listen(port, '0.0.0.0'); // Escuchar en todas las interfaces de red para permitir conexiones externas

  // Box donde se muestra la información del servidor al iniciar
  const RESET = "\x1b[0m";
  const BG_GREEN = "\x1b[42m";
  const FG_WHITE = "\x1b[97m";
  const FG_BLACK = "\x1b[30m";
  const FG_CYAN = "\x1b[96m";
  const FG_BOLD = "\x1b[1m";

  const lines = [
    `Server running`,
    `Mode    : ${nodeEnv}`,
    `Port    : http://localhost:${port}`,
    `CORS    : ${frontendUrl}`,
    `Swagger : ${swaggerEnabled}`,
    `Docs    : http://localhost:${port}/api/docs`,
  ];

  const contentWidth = Math.max(...lines.map((l) => l.length));
  const top = `╔${"═".repeat(contentWidth + 2)}╗`;
  const middle = `╠${"═".repeat(contentWidth + 2)}╣`;
  const bottom = `╚${"═".repeat(contentWidth + 2)}╝`;

  const box = [];
  box.push(BG_GREEN + FG_WHITE + FG_BOLD + top + RESET);
  box.push(
    BG_GREEN +
      FG_WHITE +
      FG_BOLD +
      `║ ${lines[0].padEnd(contentWidth)} ║` +
      RESET,
  );
  box.push(BG_GREEN + FG_WHITE + middle + RESET);
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(":");
    const left = parts[0] + ":";
    const right = parts.slice(1).join(":").trim();
    const leftWidth = 9;
    const row = `║ ${FG_WHITE}${left.padEnd(leftWidth)} ${FG_CYAN}${right.padEnd(
      contentWidth - leftWidth - 1,
    )}${FG_BLACK} ║`;
    box.push(BG_GREEN + row + RESET);
  }
  box.push(BG_GREEN + FG_WHITE + FG_BOLD + bottom + RESET);

  console.log("\n" + box.join("\n") + "\n");
}

void bootstrap();
