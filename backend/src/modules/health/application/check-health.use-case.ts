import { Injectable } from '@nestjs/common';

export interface CheckHealthResult {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

@Injectable()
export class CheckHealthUseCase {
  execute(): CheckHealthResult {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
