import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  TrackerDevice,
  GT02DCommands,
  SMSCommand,
  ConfigurationSession,
  ConfigurationStep,
  OPERATOR_CONFIGS,
  SERVER_CONFIG,
  CONFIGURATION_STEPS,
  OperatorConfig
} from '../models/tracker.models';
import { TraccarService } from './traccar.service';

@Injectable({
  providedIn: 'root'
})
export class TrackerConfigService {
  private configurationSessionSubject = new BehaviorSubject<ConfigurationSession | null>(null);
  public configurationSession$ = this.configurationSessionSubject.asObservable();

  constructor(private traccarService: TraccarService) {}

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
    const steps = this.createConfigurationSteps();
    
    const session: ConfigurationSession = {
      id: this.generateId(),
      deviceId: device.id || '',
      chipNumber: device.chipNumber,
      deviceType: device.deviceType,
      operator: device.operator,
      status: 'IN_PROGRESS',
      commands: commands,
      steps: steps,
      firstPositionReceived: false,
      startedAt: new Date()
    };

    // Iniciar primeiro step
    this.updateStepStatus(session, 'Preparação', 'IN_PROGRESS');
    
    this.configurationSessionSubject.next(session);
    return session;
  }

  private createConfigurationSteps(): ConfigurationStep[] {
    return CONFIGURATION_STEPS.map(stepTemplate => ({
      ...stepTemplate,
      id: this.generateId(),
      status: 'PENDING' as const
    }));
  }

  updateStepStatus(session: ConfigurationSession, stepTitle: string, status: ConfigurationStep['status'], error?: string): void {
    const step = session.steps.find(s => s.title === stepTitle);
    if (step) {
      step.status = status;
      
      if (status === 'IN_PROGRESS') {
        step.startedAt = new Date();
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        step.completedAt = new Date();
        if (error) {
          step.error = error;
        }
      }
      
      this.updateConfigurationSession();
    }
  }

  getCurrentStep(session: ConfigurationSession): ConfigurationStep | null {
    return session.steps.find(step => step.status === 'IN_PROGRESS') || null;
  }

  getNextStep(session: ConfigurationSession): ConfigurationStep | null {
    const currentStep = this.getCurrentStep(session);
    if (!currentStep) {
      return session.steps.find(step => step.status === 'PENDING') || null;
    }
    
    const nextOrder = currentStep.order + 1;
    return session.steps.find(step => step.order === nextOrder) || null;
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
    // Atualizar step para comandos SMS
    this.updateStepStatus(session, 'Preparação', 'COMPLETED');
    this.updateStepStatus(session, 'Comandos SMS', 'IN_PROGRESS');
    
    for (const command of session.commands) {
      await this.sendSMSCommand(command);
      // Aguardar um pouco entre os comandos
      await this.delay(2000);
    }
    
    // Verificar se todos os comandos foram confirmados
    const allConfirmed = session.commands.every(cmd => cmd.status === 'CONFIRMED');
    if (allConfirmed) {
      this.updateStepStatus(session, 'Comandos SMS', 'COMPLETED');
      this.updateStepStatus(session, 'Cadastro Traccar', 'IN_PROGRESS');
    } else {
      this.updateStepStatus(session, 'Comandos SMS', 'FAILED', 'Alguns comandos SMS falharam');
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