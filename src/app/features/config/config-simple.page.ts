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
  IonBadge
} from '@ionic/angular/standalone';
import { TrackerConfigService } from '../../shared/services/tracker-config.service';
import { ConfigurationSession, ConfigurationStep, CONFIGURATION_STEPS } from '../../shared/models/tracker.models';

@Component({
  selector: 'app-config-simple',
  template: `
    <ion-content>
      <div class="config-container">
        <!-- Formulário de Configuração -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Configuração GT02D</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <form [formGroup]="configForm" (ngSubmit)="onSubmit()">
              <ion-item>
                <ion-label position="stacked">Número do Chip</ion-label>
                <ion-input
                  formControlName="chipNumber"
                  type="tel"
                  placeholder="Digite o número do chip">
                </ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Tipo do Dispositivo</ion-label>
                <ion-select formControlName="deviceType">
                  <ion-select-option value="GT02D">GT02D</ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Operadora</ion-label>
                <ion-select formControlName="operator">
                  <ion-select-option value="VIVO">VIVO</ion-select-option>
                  <ion-select-option value="TIM">TIM</ion-select-option>
                  <ion-select-option value="CLARO">CLARO</ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-button
                expand="block"
                type="submit"
                [disabled]="!configForm.valid || isConfiguring"
                class="config-button">
                <ion-icon name="settings" slot="start"></ion-icon>
                {{ isConfiguring ? 'Configurando...' : 'Iniciar Configuração' }}
              </ion-button>

              <!-- Botão para reiniciar configuração após falha -->
              <ion-button
                *ngIf="showRetryButton"
                expand="block"
                color="warning"
                (click)="retryConfiguration()"
                class="retry-button">
                <ion-icon name="refresh" slot="start"></ion-icon>
                Tentar Novamente
              </ion-button>

              <!-- Botão para limpar sessão -->
              <ion-button
                *ngIf="currentSession && !isConfiguring"
                expand="block"
                fill="outline"
                color="medium"
                (click)="clearSession()"
                class="clear-button">
                <ion-icon name="trash" slot="start"></ion-icon>
                Limpar Sessão
              </ion-button>
            </form>
            
            <div *ngIf="message" class="message">
              <ion-text [color]="messageColor">{{ message }}</ion-text>
            </div>

            <!-- Detalhes das falhas -->
            <div *ngIf="failureDetails.length > 0" class="failure-details">
              <h4>Detalhes das Falhas:</h4>
              <ul>
                <li *ngFor="let failure of failureDetails">{{ failure }}</li>
              </ul>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Timeline de Configuração -->
        <ion-card *ngIf="showTimeline" class="timeline-card">
          <ion-card-header>
            <ion-card-title>Progresso da Configuração</ion-card-title>
            <ion-progress-bar [value]="getProgressValue()" color="primary"></ion-progress-bar>
          </ion-card-header>
          
          <ion-card-content>
            <div class="timeline-container">
              <div *ngFor="let step of getConfigurationSteps(); let i = index"
                   class="timeline-step"
                   [class.active]="step.status === 'IN_PROGRESS'"
                   [class.completed]="step.status === 'COMPLETED'"
                   [class.failed]="step.status === 'FAILED'">
                
                <div class="step-indicator">
                  <ion-icon
                    [name]="getStepIcon(step)"
                    [color]="getStepColor(step.status)">
                  </ion-icon>
                </div>
                
                <div class="step-content">
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.description }}</p>
                  <ion-badge [color]="getStepColor(step.status)">
                    {{ getStepStatusLabel(step.status) }}
                  </ion-badge>
                </div>
                
                <div *ngIf="i < getConfigurationSteps().length - 1" class="step-connector"></div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .config-container {
      padding: 20px;
    }
    
    .config-button {
      margin-top: 20px;
    }
    
    .message {
      margin-top: 15px;
      text-align: center;
    }
    
    ion-item {
      margin-bottom: 10px;
    }

    .timeline-card {
      margin-top: 20px;
    }

    .timeline-container {
      position: relative;
    }

    .timeline-step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      position: relative;
    }

    .step-indicator {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      z-index: 2;
      position: relative;
    }

    .timeline-step.active .step-indicator {
      background: var(--ion-color-warning);
      animation: pulse 2s infinite;
    }

    .timeline-step.completed .step-indicator {
      background: var(--ion-color-success);
    }

    .timeline-step.failed .step-indicator {
      background: var(--ion-color-danger);
    }

    .step-content {
      flex: 1;
    }

    .step-content h3 {
      margin: 0 0 5px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .step-content p {
      margin: 0 0 10px 0;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .step-connector {
      position: absolute;
      left: 19px;
      top: 40px;
      width: 2px;
      height: 20px;
      background: var(--ion-color-light);
      z-index: 1;
    }

    .timeline-step.completed .step-connector {
      background: var(--ion-color-success);
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    IonBadge
  ]
})
export class ConfigSimplePage implements OnInit {
  configForm!: FormGroup;
  message = '';
  messageColor = 'success';
  showTimeline = false;
  isConfiguring = false;
  currentSession: ConfigurationSession | null = null;
  configurationSteps: ConfigurationStep[] = [];
  showRetryButton = false;
  failureDetails: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private trackerConfigService: TrackerConfigService
  ) {
    console.log('ConfigSimplePage constructor');
  }

  ngOnInit() {
    console.log('ConfigSimplePage ngOnInit');
    this.initializeForm();
    this.initializeSteps();
    
    // Monitorar sessão de configuração
    this.trackerConfigService.configurationSession$.subscribe(session => {
      this.currentSession = session;
      this.isConfiguring = session?.status === 'IN_PROGRESS';
      
      if (session) {
        this.showTimeline = true;
        this.configurationSteps = session.steps;
        
        // Verificar se há falhas
        if (session.status === 'FAILED') {
          this.showRetryButton = true;
          this.isConfiguring = false;
          this.failureDetails = this.trackerConfigService.getFailureDetails(session);
          this.message = `Configuração falhou. ${this.failureDetails.length} erro(s) encontrado(s).`;
          this.messageColor = 'danger';
        } else if (session.status === 'COMPLETED') {
          this.showRetryButton = false;
          this.failureDetails = [];
          this.message = 'Configuração concluída com sucesso!';
          this.messageColor = 'success';
        }
      }
    });
  }

  private initializeForm(): void {
    this.configForm = this.formBuilder.group({
      chipNumber: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      deviceType: ['GT02D', Validators.required],
      operator: ['VIVO', Validators.required]
    });
  }

  private initializeSteps(): void {
    this.configurationSteps = CONFIGURATION_STEPS.map(stepTemplate => ({
      ...stepTemplate,
      id: '',
      status: 'PENDING' as const
    }));
  }

  onSubmit(): void {
    if (this.configForm.valid && !this.isConfiguring) {
      console.log('Formulário válido:', this.configForm.value);
      
      const device = {
        chipNumber: this.configForm.value.chipNumber,
        deviceType: this.configForm.value.deviceType,
        operator: this.configForm.value.operator
      };

      try {
        // Iniciar configuração real
        const session = this.trackerConfigService.startConfiguration(device);
        this.showTimeline = true;
        this.isConfiguring = true;
        
        this.message = 'Configuração iniciada com sucesso!';
        this.messageColor = 'success';
        
        // Enviar comandos
        this.trackerConfigService.sendAllCommands(session);
        
      } catch (error) {
        console.error('Erro na configuração:', error);
        this.message = 'Erro ao iniciar configuração. Tente novamente.';
        this.messageColor = 'danger';
        this.isConfiguring = false;
      }
      
    } else {
      this.message = 'Por favor, preencha todos os campos corretamente.';
      this.messageColor = 'danger';
    }
  }

  retryConfiguration(): void {
    if (this.currentSession) {
      console.log('Reiniciando configuração após falha...');
      
      // Resetar sessão falhada
      this.trackerConfigService.resetFailedSession(this.currentSession);
      
      // Limpar estado da UI
      this.showRetryButton = false;
      this.failureDetails = [];
      this.message = 'Reiniciando configuração...';
      this.messageColor = 'primary';
      this.isConfiguring = true;
      
      // Reenviar comandos
      setTimeout(() => {
        this.trackerConfigService.sendAllCommands(this.currentSession!);
      }, 1000);
    }
  }

  clearSession(): void {
    console.log('Limpando sessão de configuração...');
    
    // Resetar estado
    this.currentSession = null;
    this.showTimeline = false;
    this.isConfiguring = false;
    this.showRetryButton = false;
    this.failureDetails = [];
    this.message = '';
    
    // Resetar formulário
    this.configForm.reset({
      deviceType: 'GT02D',
      operator: 'VIVO'
    });
    
    // Limpar sessão no serviço
    this.trackerConfigService.clearSession();
  }

  getConfigurationSteps(): ConfigurationStep[] {
    if (this.currentSession) {
      return this.currentSession.steps.sort((a, b) => a.order - b.order);
    }
    return this.configurationSteps;
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

  getProgressValue(): number {
    const steps = this.getConfigurationSteps();
    if (steps.length === 0) return 0;
    
    const completedSteps = steps.filter(step => step.status === 'COMPLETED').length;
    return completedSteps / steps.length;
  }
}