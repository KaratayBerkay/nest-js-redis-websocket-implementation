import { Test, TestingModule } from '@nestjs/testing';
import { SecureWsGateway } from './secure-ws.gateway';

describe('SecureWsGateway', () => {
  let gateway: SecureWsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecureWsGateway],
    }).compile();

    gateway = module.get<SecureWsGateway>(SecureWsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
