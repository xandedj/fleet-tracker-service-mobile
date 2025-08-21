import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonList,
  IonAccordion,
  IonAccordionGroup,
  IonTextarea,
  IonIcon,
  IonChip,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonAlert,
  IonToast,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  sendOutline, 
  phonePortraitOutline, 
  mailOutline, 
  settingsOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  timeOutline,
  copyOutline
} from 'ionicons/icons';
import { TrackerConfigService } from '../../shared/services/tracker-config.service';
import { 
  getCommandsForDevice, 
  formatSMSCommand, 
  getCommandDescription,
  CRX3_MINI_COMMANDS,
  GT02D_COMMANDS
} from '../../shared/models/sms-commands.model';
import { SMSCommandTemplate } from '../../shared/models/sms-commands.model';

interface CommandHistory {
  id: string;
  command: string;
  phoneNumber: string;
  deviceType: 'GT02D' | 'CRX3_MINI';
  status: 'SENT' | 'CONFIRMED' | 'FAILED';
  sentAt: Date;
  response?: string;
}

@Component({
  selector: 'app-comandos',
  templateUrl: './comandos.page.html',
  styleUrls: ['./comandos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonList,
    IonAccordion,
    IonAccordionGroup,
    IonIcon,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    IonAlert,
    IonToast,
    IonSpinner
  ]
})
export class ComandosPage implements OnInit {
  comandosForm: FormGroup;
  availableCommands: SMSCommandTemplate[] = [];
  selectedCommand: SMSCommandTemplate | null = null;
  commandParameters: { [key: string]: any } = {};
  generatedCommand: string = '';
  commandHistory: CommandHistory[] = [];
  isLoading = false;
  showAlert = false;
  showToast = false;
  alertMessage = '';
  toastMessage = '';
  toastColor = 'success';

  deviceTypes = [
    { value: 'GT02D', label: 'GT02D' },
    { value: 'CRX3_MINI', label: 'CRX 3 Mini' }
  ];

  constructor(
    private fb: FormBuilder,
    private trackerConfigService: TrackerConfigService
  ) {
    addIcons({
      sendOutline,
      phonePortraitOutline,
      mailOutline,
      settingsOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      timeOutline,
      copyOutline
    });

    this.comandosForm = this.fb.group({
      imei: ['', [Validators.required, Validators.pattern(/^\d{15}$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      deviceType: ['GT02D', Validators.required]
    });
  }

  ngOnInit() {
    this.loadAvailableCommands();
    this.loadCommandHistory();
  }

  loadAvailableCommands() {
    const deviceType = this.comandosForm.get('deviceType')?.value as 'GT02D' | 'CRX3_MINI';
    this.availableCommands = getCommandsForDevice(deviceType);
  }

  onDeviceTypeChange() {
    this.loadAvailableCommands();
    this.selectedCommand = null;
    this.generatedCommand = '';
    this.commandParameters = {};
  }

  selectCommand(command: SMSCommandTemplate) {
    this.selectedCommand = command;
    this.commandParameters = {};
    this.generateCommand();
  }

  onParameterChange(paramName: string, value: any) {
    this.commandParameters[paramName] = value;
    this.generateCommand();
  }

  generateCommand() {
    if (!this.selectedCommand) return;

    try {
      // Extrair parâmetros do template
      const template = this.selectedCommand.template;
      const deviceType = this.comandosForm.get('deviceType')?.value;
      
      // Para comandos específicos, usar valores padrão se não fornecidos
      if (deviceType === 'GT02D') {
        this.generateGT02DCommand(template);
      } else if (deviceType === 'CRX3_MINI') {
        this.generateCRX3MiniCommand(template);
      }
    } catch (error) {
      console.error('Erro ao gerar comando:', error);
      this.generatedCommand = 'Erro ao gerar comando';
    }
  }

  private generateGT02DCommand(template: string) {
    const params: { [key: string]: any } = {
      apn: this.commandParameters['apn'] || 'zap.vivo.com.br',
      username: this.commandParameters['username'] || 'vivo',
      password: this.commandParameters['password'] || 'vivo',
      ip: this.commandParameters['ip'] || '51.222.16.164',
      port: this.commandParameters['port'] || '5023',
      interval: this.commandParameters['interval'] || '30'
    };

    this.generatedCommand = formatSMSCommand(template, params);
  }

  private generateCRX3MiniCommand(template: string) {
    const params: { [key: string]: any } = {
      apn: this.commandParameters['apn'] || 'zap.vivo.com.br',
      username: this.commandParameters['username'] || 'vivo',
      password: this.commandParameters['password'] || 'vivo',
      ip: this.commandParameters['ip'] || '51.222.16.164',
      port: this.commandParameters['port'] || '5023',
      moving: this.commandParameters['moving'] || '20',
      stopped: this.commandParameters['stopped'] || '1800',
      angle: this.commandParameters['angle'] || '15',
      sensitivity: this.commandParameters['sensitivity'] || '3',
      distance: this.commandParameters['distance'] || '300'
    };

    this.generatedCommand = formatSMSCommand(template, params);
  }

  getCommandParameters(template: string): string[] {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  async sendCommand() {
    if (!this.comandosForm.valid || !this.generatedCommand) {
      this.showToastMessage('Por favor, preencha todos os campos obrigatórios', 'danger');
      return;
    }

    this.isLoading = true;

    try {
      const phoneNumber = this.comandosForm.get('phoneNumber')?.value;
      const deviceType = this.comandosForm.get('deviceType')?.value;

      // Criar comando SMS
      const smsCommand = {
        deviceId: this.comandosForm.get('imei')?.value,
        chipNumber: phoneNumber,
        command: this.generatedCommand,
        commandType: (this.selectedCommand?.type as any) || 'APN',
        status: 'PENDING' as const
      };

      // Enviar comando
      const success = await this.trackerConfigService.sendSMSCommand(smsCommand);

      if (success) {
        // Adicionar ao histórico
        const historyItem: CommandHistory = {
          id: Date.now().toString(),
          command: this.generatedCommand,
          phoneNumber: phoneNumber,
          deviceType: deviceType,
          status: 'SENT',
          sentAt: new Date()
        };

        this.commandHistory.unshift(historyItem);
        this.saveCommandHistory();

        this.showToastMessage('Comando enviado com sucesso!', 'success');
        
        // Limpar formulário
        this.selectedCommand = null;
        this.generatedCommand = '';
        this.commandParameters = {};
      } else {
        this.showToastMessage('Erro ao enviar comando', 'danger');
      }
    } catch (error) {
      console.error('Erro ao enviar comando:', error);
      this.showToastMessage('Erro ao enviar comando', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  copyCommand() {
    if (this.generatedCommand) {
      navigator.clipboard.writeText(this.generatedCommand).then(() => {
        this.showToastMessage('Comando copiado para a área de transferência', 'success');
      }).catch(() => {
        this.showToastMessage('Erro ao copiar comando', 'danger');
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SENT': return 'primary';
      case 'CONFIRMED': return 'success';
      case 'FAILED': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SENT': return 'time-outline';
      case 'CONFIRMED': return 'checkmark-circle-outline';
      case 'FAILED': return 'alert-circle-outline';
      default: return 'time-outline';
    }
  }

  private showToastMessage(message: string, color: string) {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;
  }

  private loadCommandHistory() {
    const saved = localStorage.getItem('commandHistory');
    if (saved) {
      this.commandHistory = JSON.parse(saved).map((item: any) => ({
        ...item,
        sentAt: new Date(item.sentAt)
      }));
    }
  }

  private saveCommandHistory() {
    localStorage.setItem('commandHistory', JSON.stringify(this.commandHistory));
  }

  clearHistory() {
    this.commandHistory = [];
    localStorage.removeItem('commandHistory');
    this.showToastMessage('Histórico limpo com sucesso', 'success');
  }

  clearCommand() {
    this.selectedCommand = null;
    this.generatedCommand = '';
    this.commandParameters = {};
  }

  getParameterPlaceholder(param: string): string {
    const placeholders: { [key: string]: string } = {
      'apn': 'Ex: zap.vivo.com.br',
      'username': 'Ex: vivo',
      'password': 'Ex: vivo',
      'ip': 'Ex: 51.222.16.164',
      'port': 'Ex: 5023',
      'moving': 'Segundos (Ex: 20)',
      'stopped': 'Segundos (Ex: 1800)',
      'angle': 'Graus (Ex: 15)',
      'sensitivity': 'Nível 1-4 (Ex: 3)',
      'distance': 'Metros (Ex: 300)',
      'interval': 'Segundos (Ex: 30)'
    };
    return placeholders[param] || `Digite ${param}`;
  }

  trackByCommand(index: number, command: SMSCommandTemplate): string {
    return command.type;
  }

  trackByHistory(index: number, item: CommandHistory): string {
    return item.id;
  }
}