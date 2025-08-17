import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  TrackerDevice, 
  GT02DCommands, 
  SMSCommand, 
  ConfigurationSession, 
  OPERATOR_CONFIGS, 
  SERVER_CONFIG,
  OperatorConfig 
} from '../models/tracker.models';

@Injectable({
  providedIn: 'root'
})
export class TrackerConfigService {
  private configurationSessionSubject = new BehaviorSubject<ConfigurationSession | null>(null);
  public configurationSession$ = this.configurationSessionSubject.asObservable();

  constructor() {}

  generateGT02DCommands(chipNumber: string, operator: 'VIVO' | 'CLARO'): GT02DCommands {
    const operatorConfig = OPERATOR_CONFIGS.find(op => op.name === operator);
    
    if (!operatorConfig) {
      throw new Error(`Configuração não encontrada para operadora: ${operator}`);
    }

    return {
      timezone: '#6666#stz#w0#',
      apn: `#6666#sapn#${operatorConfig.apn}#${operatorConfig.username}#${operatorConfig.password}#`,
      server: `#6666#ip#${SERVER_CONFIG.ip}#${SERVER_CONFIG.port}#`,
      gprsActivation: '#6666#gprs#1#',
      movingInterval: '#6666#smt#20#',
      stoppedInterval: '#6666#sst#30#'
    };
  }

  createSMSCommands(device: TrackerDevice): SMSCommand[] {
    const commands = this.generateGT02DCommands(device.chipNumber, device.operator);
    
    return [
      {
        deviceId: device.id || '',
        chipNumber: device.chipNumber,
        command: commands.timezone,
        commandType: 'TIMEZONE',
        status: 'PENDING'
      },
      {
        deviceId: device.id || '',
        chipNumber: device.chipNumber,
        command: commands.apn,
        commandType: 'APN',
        status: 'PENDING'
      },
      {
        deviceId: device.id || '',
        chipNumber: device.chipNumber,
        command: commands.server,
        commandType: 'SERVER',
        status: 'PENDING'
      },
      {
        deviceId: device.id || '',
        chipNumber: device.chipNumber,
        command: commands.gprsActivation,
        commandType: 'GPRS',
        status: 'PENDING'
      },
      {
        deviceId: device.id || '',
        chipNumber: device.chipNumber,
        command: commands.movingInterval,
        commandType: 'MOVING_INTERVAL',
        status: 'PENDING'
      },
      {
        deviceId: device.id || '',
        chipNumber: device.chipNumber,
        command: commands.stoppedInterval,
        commandType: 'STOPPED_INTERVAL',
        status: 'PENDING'
      }
    ];
  }

  startConfiguration(device: TrackerDevice): ConfigurationSession {
    const commands = this.createSMSCommands(device);
    
    const session: ConfigurationSession = {
      id: this.generateId(),
      deviceId: device.id || '',
      chipNumber: device.chipNumber,
      deviceType: device.deviceType,
      operator: device.operator,
      status: 'IN_PROGRESS',
      commands: commands,
      startedAt: new Date()
    };

    this.configurationSessionSubject.next(session);
    return session;
  }

  async sendSMSCommand(command: SMSCommand): Promise<boolean> {
    try {
      // Aqui será implementada a integração com o plugin de SMS do Capacitor
      console.log(`Enviando SMS para ${command.chipNumber}: ${command.command}`);
      
      // Simular envio por enquanto
      await this.delay(1000);
      
      command.status = 'SENT';
      command.sentAt = new Date();
      
      this.updateConfigurationSession();
      return true;
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      command.status = 'FAILED';
      this.updateConfigurationSession();
      return false;
    }
  }

  async sendAllCommands(session: ConfigurationSession): Promise<void> {
    for (const command of session.commands) {
      await this.sendSMSCommand(command);
      // Aguardar um pouco entre os comandos
      await this.delay(2000);
    }
  }

  confirmCommand(commandId: string, response: string): void {
    const session = this.configurationSessionSubject.value;
    if (!session) return;

    const command = session.commands.find(cmd => cmd.id === commandId);
    if (command) {
      command.status = 'CONFIRMED';
      command.confirmedAt = new Date();
      command.response = response;
      
      this.updateConfigurationSession();
      this.checkSessionCompletion(session);
    }
  }

  private checkSessionCompletion(session: ConfigurationSession): void {
    const allConfirmed = session.commands.every(cmd => cmd.status === 'CONFIRMED');
    const anyFailed = session.commands.some(cmd => cmd.status === 'FAILED');
    
    if (allConfirmed) {
      session.status = 'COMPLETED';
      session.completedAt = new Date();
    } else if (anyFailed) {
      session.status = 'FAILED';
      session.completedAt = new Date();
    }
    
    this.updateConfigurationSession();
  }

  private updateConfigurationSession(): void {
    const currentSession = this.configurationSessionSubject.value;
    if (currentSession) {
      this.configurationSessionSubject.next({ ...currentSession });
    }
  }

  getCurrentSession(): ConfigurationSession | null {
    return this.configurationSessionSubject.value;
  }

  getOperatorConfigs(): OperatorConfig[] {
    return OPERATOR_CONFIGS;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}