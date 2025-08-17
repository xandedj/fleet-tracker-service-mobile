import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
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
  IonIcon,
  IonText,
  IonProgressBar,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonBadge,
  LoadingController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  phonePortrait,
  settings,
  send,
  checkmarkCircle,
  closeCircle,
  time,
  refresh,
  trash,
  list,
  chatbubbles,
  server,
  location
} from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { TrackerConfigService } from '../../shared/services/tracker-config.service';
import {
  TrackerDevice,
  ConfigurationSession,
  ConfigurationStep,
  SMSCommand,
  OPERATOR_CONFIGS,
  CONFIGURATION_STEPS
} from '../../shared/models/tracker.models';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  standalone: true,
  imports: [
    IonContent,
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
    IonIcon,
    IonText,
    IonProgressBar,
    IonList,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonBadge,
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent
  ]
})
export class ConfigPage implements OnInit {
  configForm!: FormGroup;
  currentSession: ConfigurationSession | null = null;
  isConfiguring = false;
  operatorConfigs = OPERATOR_CONFIGS;

  constructor(
    private formBuilder: FormBuilder,
    private trackerConfigService: TrackerConfigService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      phonePortrait,
      settings,
      send,
      checkmarkCircle,
      closeCircle,
      time,
      refresh,
      trash,
      list,
      chatbubbles,
      server,
      location
    });
    this.initializeForm();
  }

  ngOnInit() {
    this.trackerConfigService.configurationSession$.subscribe(session => {
      this.currentSession = session;
      this.isConfiguring = session?.status === 'IN_PROGRESS';
    });
  }

  private initializeForm(): void {
    this.configForm = this.formBuilder.group({
      chipNumber: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      deviceType: ['GT02D', Validators.required],
      operator: ['VIVO', Validators.required]
    });
  }

  async startConfiguration(): Promise<void> {
    if (this.configForm.valid && !this.isConfiguring) {
      const alert = await this.alertController.create({
        header: 'Confirmar Configuração',
        message: `Deseja iniciar a configuração do dispositivo ${this.configForm.value.deviceType} com o chip ${this.configForm.value.chipNumber}?`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Confirmar',
            handler: () => {
              this.executeConfiguration();
            }
          }
        ]
      });

      await alert.present();
    } else {
      this.markFormGroupTouched();
    }
  }

  private async executeConfiguration(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Iniciando configuração...',
      spinner: 'crescent'
    });

    await loading.present();

    try {
      const device: TrackerDevice = {
        chipNumber: this.configForm.value.chipNumber,
        deviceType: this.configForm.value.deviceType,
        operator: this.configForm.value.operator
      };

      const session = this.trackerConfigService.startConfiguration(device);
      
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Configuração iniciada! Enviando comandos SMS...',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Enviar todos os comandos
      await this.trackerConfigService.sendAllCommands(session);

    } catch (error) {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Erro ao iniciar configuração. Tente novamente.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  async retryCommand(command: SMSCommand): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Reenviando comando...',
      spinner: 'crescent'
    });

    await loading.present();

    try {
      await this.trackerConfigService.sendSMSCommand(command);
      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Comando reenviado com sucesso!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

    } catch (error) {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Erro ao reenviar comando.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  async clearSession(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Limpar Sessão',
      message: 'Deseja limpar a sessão atual de configuração?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpar',
          handler: () => {
            this.currentSession = null;
            this.isConfiguring = false;
            this.configForm.reset({
              deviceType: 'GT02D',
              operator: 'VIVO'
            });
          }
        }
      ]
    });

    await alert.present();
  }

  getCommandTypeLabel(type: string): string {
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

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'medium',
      'SENT': 'warning',
      'CONFIRMED': 'success',
      'FAILED': 'danger'
    };
    return colors[status] || 'medium';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'SENT': 'Enviado',
      'CONFIRMED': 'Confirmado',
      'FAILED': 'Falhou'
    };
    return labels[status] || status;
  }

  getProgressValue(): number {
    if (!this.currentSession) return 0;
    
    const confirmedCommands = this.currentSession.commands.filter(cmd => cmd.status === 'CONFIRMED').length;
    return confirmedCommands / this.currentSession.commands.length;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.configForm.controls).forEach(key => {
      const control = this.configForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.configForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.configForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${fieldName === 'chipNumber' ? 'Número do chip' : 'Campo'} é obrigatório`;
    }
    
    if (control?.hasError('pattern')) {
      return 'Número do chip deve ter entre 10 e 15 dígitos';
    }
    
    return '';
  }

  trackByCommandType(index: number, command: SMSCommand): string {
    return command.commandType;
  }

  // Métodos para Timeline
  getConfigurationSteps(): ConfigurationStep[] {
    if (this.currentSession) {
      return this.currentSession.steps.sort((a, b) => a.order - b.order);
    }
    
    // Retornar steps padrão se não houver sessão ativa
    return CONFIGURATION_STEPS.map(stepTemplate => ({
      ...stepTemplate,
      id: '',
      status: 'PENDING' as const
    }));
  }

  getStepIcon(step: ConfigurationStep): string {
    if (step.status === 'COMPLETED') {
      return 'checkmark-circle';
    } else if (step.status === 'FAILED') {
      return 'close-circle';
    } else if (step.status === 'IN_PROGRESS') {
      return 'time';
    }
    return step.icon;
  }

  getStepColor(status: ConfigurationStep['status']): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'medium',
      'IN_PROGRESS': 'warning',
      'COMPLETED': 'success',
      'FAILED': 'danger'
    };
    return colors[status] || 'medium';
  }

  getStepStatusLabel(status: ConfigurationStep['status']): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'IN_PROGRESS': 'Em Andamento',
      'COMPLETED': 'Concluído',
      'FAILED': 'Falhou'
    };
    return labels[status] || status;
  }
}
