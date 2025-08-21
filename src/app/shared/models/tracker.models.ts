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

export interface CRX3MiniCommands {
  apn: string;
  server: string;
  timer: string;
  gprsOn: string;
  angleRep: string;
  distance: string;
}

export interface SMSCommand {
  id?: string;
  deviceId: string;
  chipNumber: string;
  command: string;
  commandType: 'TIMEZONE' | 'APN' | 'SERVER' | 'GPRS' | 'MOVING_INTERVAL' | 'STOPPED_INTERVAL' |
               'TIMER' | 'GPRSON' | 'ANGLEREP' | 'DISTANCE' | 'FACTORY_RESET' | 'RESET' |
               'VINFO' | 'BLOCK_VEHICLE' | 'UNBLOCK_VEHICLE' | 'CHECK_IP';
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';
  sentAt?: Date;
  confirmedAt?: Date;
  response?: string;
  phoneNumber?: string;
  message?: string;
  error?: string;
}

export interface ConfigurationStep {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  icon: string;
  order: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface TraccarDevice {
  id?: number;
  name: string;
  uniqueId: string;
  status?: string;
  lastUpdate?: Date;
  positionId?: number;
  groupId?: number;
  phone?: string;
  model?: string;
  contact?: string;
  category?: string;
}

export interface ConfigurationSession {
  id?: string;
  deviceId: string;
  chipNumber: string;
  deviceType: 'GT02D' | 'CRX3_MINI' | 'FMB125';
  operator: 'VIVO' | 'CLARO';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  commands: SMSCommand[];
  steps: ConfigurationStep[];
  traccarDeviceId?: number;
  firstPositionReceived?: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export const OPERATOR_CONFIGS: OperatorConfig[] = [
  {
    name: 'VIVO',
    apn: 'smart.m2m.vivo.com.br',
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

export const CONFIGURATION_STEPS: Omit<ConfigurationStep, 'id' | 'status' | 'startedAt' | 'completedAt' | 'error'>[] = [
  {
    title: 'Preparação',
    description: 'Validando dados e preparando configuração',
    icon: 'settings',
    order: 1
  },
  {
    title: 'Comandos SMS',
    description: 'Enviando comandos de configuração via SMS',
    icon: 'chatbubbles',
    order: 2
  },
  {
    title: 'Cadastro Traccar',
    description: 'Registrando dispositivo no servidor Traccar',
    icon: 'server',
    order: 3
  },
  {
    title: 'Aguardando Conexão',
    description: 'Esperando primeira posição do equipamento',
    icon: 'location',
    order: 4
  },
  {
    title: 'Finalização',
    description: 'Configuração concluída com sucesso',
    icon: 'checkmark-circle',
    order: 5
  }
];