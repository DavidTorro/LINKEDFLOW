import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CommentsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  // Validación de DTO: una URL que no es de LinkedIn se rechaza antes de llegar a la IA.
  it('POST /comments/from-url rechaza una URL inválida con 400', async () => {
    await request(app.getHttpServer())
      .post('/comments/from-url')
      .send({ url: 'https://example.com/post/123' })
      .expect(400);
  });

  // El campo postContent es obligatorio en la generación manual.
  it('POST /comments/generate exige postContent (400)', async () => {
    await request(app.getHttpServer())
      .post('/comments/generate')
      .send({ tone: 'professional' })
      .expect(400);
  });
});
