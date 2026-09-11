import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('Auth & App E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('should return 400 when registering with invalid payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'a' });

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
