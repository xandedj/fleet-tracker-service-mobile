import { OperatorConfig, ServerConfig, CRX3MiniCommands, GT02DCommands } from './tracker.models';

export interface SMSCommandTemplate {
  type: string;
  template: string;
  description: string;
  required: boolean;
  order: number;
}

// Comandos específicos para CRX 3 Mini
export const CRX3_MINI_COMMANDS: SMSCommandTemplate[] = [
  {
    type: 'APN',
    template: 'APN,{apn},{username},{password}#',
    description: 'Configuração do APN da operadora',
    required: true,
    order: 1
  },
  {
    type: 'SERVER',
    template: 'SERVER,0,{ip},{port},0#',
    description: 'Configuração do servidor de rastreamento',
    required: true,
    order: 2
  },
  {
    type: 'TIMER',
    template: 'TIMER,{moving},{stopped}#',
    description: 'Tempo de comunicação (movimento, parado)',
    required: true,
    order: 3
  },
  {
    type: 'GPRSON',
    template: 'GPRSON,1#',
    description: 'Ativar GPRS',
    required: true,
    order: 4
  },
  {
    type: 'ANGLEREP',
    template: 'ANGLEREP,ON,{angle},{sensitivity}#',
    description: 'Definir ângulo de curva',
    required: true,
    order: 5
  },
  {
    type: 'DISTANCE',
    template: 'DISTANCE,{distance}#',
    description: 'Configurar distância mínima para envio',
    required: true,
    order: 6
  }
];

// Comandos específicos para GT02D (mantendo compatibilidade)
export const GT02D_COMMANDS: SMSCommandTemplate[] = [
  {
    type: 'TIMEZONE',
    template: 'TIMEZONE,E,3#',
    description: 'Configuração do fuso horário',
    required: true,
    order: 1
  },
  {
    type: 'APN',
    template: 'APN,{apn},{username},{password}#',
    description: 'Configuração do APN da operadora',
    required: true,
    order: 2
  },
  {
    type: 'SERVER',
    template: 'SERVER,1,{ip},{port},0#',
    description: 'Configuração do servidor de rastreamento',
    required: true,
    order: 3
  },
  {
    type: 'GPRS',
    template: 'GPRS,1#',
    description: 'Ativar GPRS',
    required: true,
    order: 4
  },
  {
    type: 'MOVING_INTERVAL',
    template: 'MOVING,{interval}#',
    description: 'Intervalo de envio em movimento',
    required: true,
    order: 5
  },
  {
    type: 'STOPPED_INTERVAL',
    template: 'STOPPED,{interval}#',
    description: 'Intervalo de envio parado',
    required: true,
    order: 6
  }
];

// Configurações padrão para CRX 3 Mini
export const CRX3_MINI_DEFAULT_CONFIG = {
  moving: 20,        // 20 segundos em movimento
  stopped: 1800,     // 30 minutos parado (1800 segundos)
  angle: 15,         // 15 graus
  sensitivity: 3,    // Sensibilidade 3
  distance: 300      // 300 metros
};

// Configurações padrão para GT02D
export const GT02D_DEFAULT_CONFIG = {
  movingInterval: 30,   // 30 segundos
  stoppedInterval: 300  // 5 minutos
};

/**
 * Gera comandos SMS para CRX 3 Mini
 */
export function generateCRX3MiniCommands(
  operatorConfig: OperatorConfig,
  serverConfig: ServerConfig,
  customConfig?: Partial<typeof CRX3_MINI_DEFAULT_CONFIG>
): CRX3MiniCommands {
  const config = { ...CRX3_MINI_DEFAULT_CONFIG, ...customConfig };
  
  return {
    apn: `APN,${operatorConfig.apn},${operatorConfig.username},${operatorConfig.password}#`,
    server: `SERVER,0,${serverConfig.ip},${serverConfig.port},0#`,
    timer: `TIMER,${config.moving},${config.stopped}#`,
    gprsOn: 'GPRSON,1#',
    angleRep: `ANGLEREP,ON,${config.angle},${config.sensitivity}#`,
    distance: `DISTANCE,${config.distance}#`
  };
}

/**
 * Gera comandos SMS para GT02D (mantendo compatibilidade)
 */
export function generateGT02DCommands(
  operatorConfig: OperatorConfig,
  serverConfig: ServerConfig,
  customConfig?: Partial<typeof GT02D_DEFAULT_CONFIG>
): GT02DCommands {
  const config = { ...GT02D_DEFAULT_CONFIG, ...customConfig };
  
  return {
    timezone: 'TIMEZONE,E,3#',
    apn: `APN,${operatorConfig.apn},${operatorConfig.username},${operatorConfig.password}#`,
    server: `SERVER,1,${serverConfig.ip},${serverConfig.port},0#`,
    gprsActivation: 'GPRS,1#',
    movingInterval: `MOVING,${config.movingInterval}#`,
    stoppedInterval: `STOPPED,${config.stoppedInterval}#`
  };
}

/**
 * Obtém os comandos baseado no tipo de dispositivo
 */
export function getCommandsForDevice(deviceType: 'GT02D' | 'CRX3_MINI'): SMSCommandTemplate[] {
  switch (deviceType) {
    case 'CRX3_MINI':
      return CRX3_MINI_COMMANDS;
    case 'GT02D':
      return GT02D_COMMANDS;
    default:
      return GT02D_COMMANDS;
  }
}

/**
 * Valida se um comando SMS está no formato correto
 */
export function validateSMSCommand(command: string, deviceType: 'GT02D' | 'CRX3_MINI'): boolean {
  if (!command || !command.endsWith('#')) {
    return false;
  }

  const commands = getCommandsForDevice(deviceType);
  const commandType = command.split(',')[0];
  
  return commands.some(cmd => cmd.template.startsWith(commandType));
}

/**
 * Extrai o tipo de comando de uma string SMS
 */
export function extractCommandType(command: string): string {
  return command.split(',')[0];
}

/**
 * Formata um comando SMS com parâmetros
 */
export function formatSMSCommand(template: string, params: Record<string, any>): string {
  let formatted = template;
  
  Object.keys(params).forEach(key => {
    const placeholder = `{${key}}`;
    formatted = formatted.replace(new RegExp(placeholder, 'g'), params[key]);
  });
  
  return formatted;
}

/**
 * Obtém a descrição de um comando
 */
export function getCommandDescription(commandType: string, deviceType: 'GT02D' | 'CRX3_MINI'): string {
  const commands = getCommandsForDevice(deviceType);
  const command = commands.find(cmd => cmd.type === commandType);
  return command?.description || 'Comando desconhecido';
}

/**
 * Verifica se um comando é obrigatório
 */
export function isCommandRequired(commandType: string, deviceType: 'GT02D' | 'CRX3_MINI'): boolean {
  const commands = getCommandsForDevice(deviceType);
  const command = commands.find(cmd => cmd.type === commandType);
  return command?.required || false;
}

/**
 * Obtém a ordem de execução de um comando
 */
export function getCommandOrder(commandType: string, deviceType: 'GT02D' | 'CRX3_MINI'): number {
  const commands = getCommandsForDevice(deviceType);
  const command = commands.find(cmd => cmd.type === commandType);
  return command?.order || 999;
}