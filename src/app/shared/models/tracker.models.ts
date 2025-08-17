export interface TrackerDevice {
  id?: string;
  chipNumber: string;
  deviceType: 'GT02D' | 'CRX3_MINI' | 'FMB125';
  operator: 'VIVO' | 'CLARO';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OperatorConfig {
  name: 'VIVO' | 'CLARO';
  apn: string;
  username: string;
  password: string;
}

export interface ServerConfig {
  ip: string;
  port: number;
}

export interface GT02DCommands {
  timezone: string;
  apn: string;
  server: string;
  gprsActivation: string;
  movingInterval: string;
  stoppedInterval: string;
}

export interface SMSCommand {
  id?: string;
  deviceId: string;
  chipNumber: string;
  command: string;
  commandType: 'TIMEZONE' | 'APN' | 'SERVER' | 'GPRS' | 'MOVING_INTERVAL' | 'STOPPED_INTERVAL';
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';
  sentAt?: Date;
  confirmedAt?: Date;
  response?: string;
}

export interface ConfigurationSession {
  id?: string;
  deviceId: string;
  chipNumber: string;
  deviceType: 'GT02D' | 'CRX3_MINI' | 'FMB125';
  operator: 'VIVO' | 'CLARO';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  commands: SMSCommand[];
  startedAt: Date;
  completedAt?: Date;
}

export const OPERATOR_CONFIGS: OperatorConfig[] = [
  {
    name: 'VIVO',
    apn: 'smat.m2m.vivo.com.br',
    username: 'vivo',
    password: 'vivo'
  },
  {
    name: 'CLARO',
    apn: 'g.claro.com.br',
    username: 'claro',
    password: 'claro'
  }
];

export const SERVER_CONFIG: ServerConfig = {
  ip: '51.222.16.164',
  port: 5023
};