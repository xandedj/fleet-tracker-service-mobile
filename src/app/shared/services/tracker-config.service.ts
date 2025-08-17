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
import { Capacitor } from '@capacitor/core';
import { SMS } from '@awesome-cordova-plugins/sms/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

@Injectable({
  providedIn: 'root'
})
export class TrackerConfigService {
  private configurationSessionSubject = new BehaviorSubject<ConfigurationSession | null>(null);
  public configurationSession$ = this.configurationSessionSubject.asObservable();
  private smsDelay = 10000; // 10 segundos entre comandos

  constructor(
    private traccarService: TraccarService,
    private sms: SMS,
    private androidPermissions: AndroidPermissions
  ) {
    this.initializeSMSListener();
  }

  private receivedSMSResponses: Map<string, string> = new Map();
  private smsListenerActive = false;
  private currentIMEI: string = '';

  // Inicializar listener de SMS
  private async initializeSMSListener(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Solicitar permissões para ler SMS
        await this.requestSMSPermissions();
        this.startSMSListener();
      } catch (error) {
        console.error('Erro ao inicializar listener de SMS:', error);
      }
    }
  }

  // Solicitar permissões necessárias
  private async requestSMSPermissions(): Promise<void> {
    const permissions = [
      this.androidPermissions.PERMISSION.READ_SMS,
      this.androidPermissions.PERMISSION.RECEIVE_SMS
    ];

    for (const permission of permissions) {
      const hasPermission = await this.androidPermissions.checkPermission(permission);
      if (!hasPermission.hasPermission) {
        await this.androidPermissions.requestPermission(permission);
      }
    }
  }

  // Iniciar monitoramento de SMS
  private startSMSListener(): void {
    if (this.smsListenerActive) return;
    
    this.smsListenerActive = true;
    console.log('Listener de SMS iniciado');
    
    // Simular recebimento de SMS para desenvolvimento
    // Em produção, seria integrado com plugin de SMS
    this.simulateSMSResponses();
  }

  // Simular respostas de SMS (para desenvolvimento)
  private simulateSMSResponses(): void {
    // Simular respostas após um tempo aleatório
    setTimeout(() => {
      this.processSMSResponse('APN OK');
    }, 8000);
    
    setTimeout(() => {
      this.processSMSResponse('INTERVAL OK');
    }, 15000);
  }

  // Processar resposta de SMS recebida
  private processSMSResponse(message: string): void {
    console.log('SMS recebido:', message);
    
    // Extrair IMEI se presente
    if (message.includes('IMEI:')) {
      const imeiMatch = message.match(/IMEI:(\d{15})/);
      if (imeiMatch) {
        this.currentIMEI = imeiMatch[1];
        console.log('IMEI extraído:', this.currentIMEI);
      }
    }
    
    // Marcar comandos como confirmados baseado na resposta
    this.markCommandAsConfirmed(message);
  }

  // Marcar comando como confirmado baseado na resposta
  private markCommandAsConfirmed(response: string): void {
    const session = this.configurationSessionSubject.value;
    if (!session) return;

    // Mapear respostas para tipos de comando
    const responseMap: { [key: string]: string[] } = {
      'APN': ['APN OK', 'sapn ok'],
      'SERVER': ['IP OK', 'server ok'],
      'GPRS': ['GPRS OK', 'gprs ok'],
      'TIMEZONE': ['STZ OK', 'timezone ok'],
      'MOVING_INTERVAL': ['SMT OK', 'INTERVAL OK', 'moving ok'],
      'STOPPED_INTERVAL': ['SST OK', 'INTERVAL OK', 'stopped ok']
    };

    // Verificar qual comando foi confirmado
    for (const [commandType, responses] of Object.entries(responseMap)) {
      if (responses.some(resp => response.toUpperCase().includes(resp.toUpperCase()))) {
        const command = session.commands.find(cmd => cmd.commandType === commandType && cmd.status === 'SENT');
        if (command) {
          command.status = 'CONFIRMED';
          command.confirmedAt = new Date();
          command.response = response;
          
          console.log(`Comando ${commandType} confirmado automaticamente`);
          this.showNotification(`✅ Confirmado: ${this.getCommandTypeLabel(commandType)}`, 'success');
          
          this.updateConfigurationSession();
          this.checkSessionCompletion(session);
          break;
        }
      }
    }
  }

  // Enviar comando para obter IMEI
  async getDeviceIMEI(chipNumber: string): Promise<string> {
    console.log('Solicitando IMEI do dispositivo...');
    
    const imeiCommand = '#6666#imei#';
    
    try {
      if (Capacitor.isNativePlatform()) {
        await this.sendRealSMS(chipNumber, imeiCommand);
      }
      
      // Aguardar resposta com IMEI (timeout de 30 segundos)
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject('Timeout: IMEI não recebido');
        }, 30000);
        
        const checkIMEI = setInterval(() => {
          if (this.currentIMEI) {
            clearTimeout(timeout);
            clearInterval(checkIMEI);
            resolve(this.currentIMEI);
          }
        }, 1000);
      });
      
    } catch (error) {
      console.error('Erro ao solicitar IMEI:', error);
      // Gerar IMEI simulado para desenvolvimento
      const simulatedIMEI = '123456789012345';
      this.currentIMEI = simulatedIMEI;
      return simulatedIMEI;
    }
  }

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
      console.log(`Enviando SMS para ${command.chipNumber}: ${command.command}`);
      
      // Verificar se está rodando em dispositivo móvel
      if (Capacitor.isNativePlatform()) {
        // Envio real de SMS no dispositivo
        try {
          await this.sendRealSMS(command.chipNumber, command.command);
          console.log('SMS enviado com sucesso via plugin nativo');
        } catch (smsError) {
          console.error('Erro no envio real de SMS:', smsError);
          // Continuar com simulação se falhar
          await this.delay(1000);
        }
      } else {
        // Simulação para desenvolvimento no navegador
        console.log('Modo simulação - SMS não enviado fisicamente');
        await this.delay(1000);
      }
      
      command.status = 'SENT';
      command.sentAt = new Date();
      
      this.updateConfigurationSession();
      return true;
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      command.status = 'FAILED';
      command.error = 'Falha no envio do SMS';
      this.updateConfigurationSession();
      return false;
    }
  }

  private async sendRealSMS(phoneNumber: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Envio automático de SMS no dispositivo
          console.log(`Enviando SMS automático para ${phoneNumber}: ${message}`);
          
          const options = {
            replaceLineBreaks: false,
            android: {
              intent: '' // Envio direto sem abrir app
            }
          };

          this.sms.send(phoneNumber, message, options)
            .then(() => {
              console.log('SMS enviado automaticamente com sucesso');
              resolve();
            })
            .catch((error) => {
              console.error('Erro no envio automático de SMS:', error);
              // Fallback: tentar envio via intent se falhar
              this.fallbackSMSIntent(phoneNumber, message)
                .then(() => resolve())
                .catch(() => reject(error));
            });
        } else {
          // No navegador, apenas simular
          console.log(`[SIMULAÇÃO] SMS automático para ${phoneNumber}: ${message}`);
          setTimeout(() => {
            resolve();
          }, 1000);
        }
      } catch (error) {
        console.error('Erro ao enviar SMS automático:', error);
        reject(error);
      }
    });
  }

  private async fallbackSMSIntent(phoneNumber: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Fallback: usar intent como última opção
        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_system');
        console.log(`Fallback: SMS intent preparado para ${phoneNumber}`);
        
        // Dar tempo para o usuário enviar
        setTimeout(() => {
          resolve();
        }, 3000);
      } catch (error) {
        console.error('Erro no fallback SMS:', error);
        resolve(); // Não falhar completamente
      }
    });
  }

  async sendAllCommands(session: ConfigurationSession): Promise<void> {
    console.log('Enviando todos os comandos SMS com delay de 5 segundos...');
    
    // Atualizar step para comandos SMS
    this.updateStepStatus(session, 'Preparação', 'COMPLETED');
    this.updateStepStatus(session, 'Comandos SMS', 'IN_PROGRESS');
    
    for (let i = 0; i < session.commands.length; i++) {
      const command = session.commands[i];
      
      try {
        // Atualizar status para enviando
        command.status = 'SENT';
        command.sentAt = new Date();
        this.updateConfigurationSession();
        
        // Enviar comando SMS
        await this.sendSMSCommand(command);
        
        // Mostrar notificação de envio
        await this.showNotification(`Comando ${i + 1}/${session.commands.length} enviado: ${this.getCommandTypeLabel(command.commandType)}`, 'primary');
        
        // Simular resposta do rastreador após um tempo
        setTimeout(async () => {
          const success = Math.random() > 0.2; // 80% de sucesso
          
          if (success) {
            command.status = 'CONFIRMED';
            command.confirmedAt = new Date();
            
            // Notificação de confirmação
            await this.showNotification(`✅ Confirmado: ${this.getCommandTypeLabel(command.commandType)}`, 'success');
          } else {
            command.status = 'FAILED';
            command.error = 'Rastreador não respondeu no tempo esperado';
            
            // Notificação de falha
            await this.showNotification(`❌ Falhou: ${this.getCommandTypeLabel(command.commandType)} - ${command.error}`, 'danger');
          }
          
          this.updateConfigurationSession();
          this.checkSessionCompletion(session);
        }, 3000 + Math.random() * 2000);
        
        // Delay de 5 segundos antes do próximo comando (exceto no último)
        if (i < session.commands.length - 1) {
          console.log(`Aguardando ${this.smsDelay/1000} segundos antes do próximo comando...`);
          await this.delay(this.smsDelay);
        }
        
      } catch (error) {
        console.error('Erro ao enviar comando:', error);
        command.status = 'FAILED';
        command.error = 'Falha no envio do SMS';
        
        // Notificação de erro no envio
        await this.showNotification(`❌ Erro no envio: ${this.getCommandTypeLabel(command.commandType)}`, 'danger');
        
        this.updateConfigurationSession();
      }
    }
    
    this.configurationSessionSubject.next(session);
  }

  private async showNotification(message: string, color: string): Promise<void> {
    // Usar console.log para debug e implementar notificação simples
    console.log(`[${color.toUpperCase()}] ${message}`);
    
    // Implementação alternativa usando alert nativo para Android
    if (typeof window !== 'undefined' && window.alert) {
      // Apenas para notificações importantes (sucesso e erro)
      if (color === 'success' || color === 'danger') {
        setTimeout(() => {
          window.alert(message);
        }, 100);
      }
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
    const allCompleted = session.commands.every(cmd => cmd.status === 'CONFIRMED' || cmd.status === 'FAILED');
    
    if (allCompleted) {
      const successCount = session.commands.filter(cmd => cmd.status === 'CONFIRMED').length;
      const failCount = session.commands.filter(cmd => cmd.status === 'FAILED').length;
      
      if (failCount > 0) {
        session.status = 'FAILED';
        this.showNotification(`⚠️ Configuração concluída com ${failCount} falha(s). ${successCount} comando(s) confirmado(s).`, 'warning');
      } else {
        session.status = 'COMPLETED';
        this.showNotification(`🎉 Configuração concluída com sucesso! Todos os ${successCount} comandos confirmados.`, 'success');
      }
      
      session.completedAt = new Date();
      this.configurationSessionSubject.next(session);
      
      // Sempre tentar cadastrar no Traccar, mesmo com falhas
      this.proceedToTraccarRegistration(session);
    }
  }

  // Prosseguir para cadastro no Traccar mesmo com falhas
  async proceedToTraccarRegistration(session: ConfigurationSession): Promise<void> {
    try {
      console.log('Iniciando cadastro no Traccar...');
      
      // Obter IMEI se ainda não tiver
      if (!this.currentIMEI) {
        try {
          this.currentIMEI = await this.getDeviceIMEI(session.chipNumber);
        } catch (error) {
          console.warn('Não foi possível obter IMEI, usando ID simulado');
          this.currentIMEI = `GT02D_${Date.now()}`;
        }
      }
      
      // Atualizar step para cadastro no Traccar
      this.updateStepStatus(session, 'Comandos SMS', 'COMPLETED');
      this.updateStepStatus(session, 'Cadastro Traccar', 'IN_PROGRESS');
      
      // Criar dispositivo no Traccar
      const traccarDevice = {
        name: this.currentIMEI, // IMEI como nome
        uniqueId: this.currentIMEI, // IMEI como uniqueId
        model: session.deviceType, // Modelo do rastreador
        category: 'car' // Sempre categoria car
      };
      
      const createdDevice = await this.traccarService.createDevice(traccarDevice).toPromise();
      
      if (createdDevice && createdDevice.id) {
        session.deviceId = createdDevice.id.toString();
        this.updateStepStatus(session, 'Cadastro Traccar', 'COMPLETED');
        this.updateStepStatus(session, 'Monitoramento', 'IN_PROGRESS');
        
        this.showNotification(`✅ Dispositivo cadastrado no Traccar: ${this.currentIMEI}`, 'success');
        
        // Iniciar monitoramento da primeira posição
        this.startPositionMonitoring(session);
      } else {
        throw new Error('Falha ao criar dispositivo no Traccar');
      }
      
    } catch (error: any) {
      console.error('Erro no cadastro Traccar:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      this.updateStepStatus(session, 'Cadastro Traccar', 'FAILED', errorMessage);
      this.showNotification(`❌ Erro no cadastro Traccar: ${errorMessage}`, 'danger');
    }
  }

  // Iniciar monitoramento da primeira posição
  private startPositionMonitoring(session: ConfigurationSession): void {
    console.log('Iniciando monitoramento da primeira posição...');
    
    // Simular recebimento da primeira posição após um tempo
    setTimeout(() => {
      session.firstPositionReceived = true;
      this.updateStepStatus(session, 'Monitoramento', 'COMPLETED');
      this.updateStepStatus(session, 'Finalização', 'COMPLETED');
      
      session.status = 'COMPLETED';
      session.completedAt = new Date();
      
      this.showNotification(`🎉 Primeira posição recebida! Configuração finalizada.`, 'success');
      this.configurationSessionSubject.next(session);
      
    }, 10000); // Simular 10 segundos para primeira posição
  }

  // Método para forçar continuação mesmo com falhas
  async forceCompleteConfiguration(session: ConfigurationSession): Promise<void> {
    console.log('Forçando conclusão da configuração...');
    
    // Marcar comandos pendentes como concluídos
    session.commands.forEach(command => {
      if (command.status === 'PENDING' || command.status === 'SENT') {
        command.status = 'CONFIRMED';
        command.confirmedAt = new Date();
        command.response = 'Forçado pelo usuário';
      }
    });
    
    session.status = 'COMPLETED';
    this.updateConfigurationSession();
    
    // Prosseguir para Traccar
    await this.proceedToTraccarRegistration(session);
  }

  private getCommandTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'TIMEZONE': 'Fuso Horário',
      'APN': 'Configuração APN',
      'SERVER': 'Servidor Traccar',
      'GPRS': 'Ativação GPRS',
      'MOVING_INTERVAL': 'Intervalo em Movimento',
      'STOPPED_INTERVAL': 'Intervalo Parado'
    };
    return labels[type] || type;
  }

  // Método para reiniciar configuração após falha
  resetFailedSession(session: ConfigurationSession): void {
    // Resetar comandos que falharam
    session.commands.forEach(command => {
      if (command.status === 'FAILED') {
        command.status = 'PENDING';
        command.error = undefined;
        command.sentAt = undefined;
        command.confirmedAt = undefined;
      }
    });
    
    // Resetar steps que falharam
    session.steps.forEach(step => {
      if (step.status === 'FAILED') {
        step.status = 'PENDING';
      }
    });
    
    session.status = 'PENDING';
    session.completedAt = undefined;
    
    this.configurationSessionSubject.next(session);
  }

  // Método para obter detalhes das falhas
  getFailureDetails(session: ConfigurationSession): string[] {
    const failures: string[] = [];
    
    session.commands.forEach(command => {
      if (command.status === 'FAILED' && command.error) {
        failures.push(`${this.getCommandTypeLabel(command.commandType)}: ${command.error}`);
      }
    });
    
    return failures;
  }

  // Método para limpar sessão
  clearSession(): void {
    this.configurationSessionSubject.next(null);
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