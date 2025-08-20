import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
            <ion-card-title>Configuração de Equipamentos</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <form [formGroup]="configForm" (ngSubmit)="onSubmit()">
              <!-- Campo IMEI com botão de scanner -->
              <ion-item>
                <ion-label position="stacked">IMEI do Dispositivo</ion-label>
                <ion-input
                  formControlName="imei"
                  type="text"
                  placeholder="Digite ou escaneie o IMEI"
                  maxlength="15">
                </ion-input>
                <ion-button
                  slot="end"
                  fill="clear"
                  (click)="openScanner()"
                  [disabled]="isConfiguring">
                  <ion-icon name="qr-code-outline"></ion-icon>
                </ion-button>
              </ion-item>

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
                  <ion-select-option value="CRX3_MINI">CRX 3 Mini</ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Operadora</ion-label>
                <ion-select formControlName="operator">
                  <ion-select-option value="VIVO">VIVO</ion-select-option>
                  <ion-select-option value="CLARO">CLARO</ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Configurações específicas do CRX 3 Mini -->
              <div *ngIf="configForm.get('deviceType')?.value === 'CRX3_MINI'" class="crx3-config">
                <ion-item>
                  <ion-label position="stacked">Tempo em Movimento (segundos)</ion-label>
                  <ion-input
                    formControlName="movingTime"
                    type="number"
                    placeholder="20"
                    min="10"
                    max="300">
                  </ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Tempo Parado (segundos)</ion-label>
                  <ion-input
                    formControlName="stoppedTime"
                    type="number"
                    placeholder="1800"
                    min="60"
                    max="7200">
                  </ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Ângulo de Curva (graus)</ion-label>
                  <ion-input
                    formControlName="angle"
                    type="number"
                    placeholder="15"
                    min="5"
                    max="90">
                  </ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Sensibilidade</ion-label>
                  <ion-select formControlName="sensitivity">
                    <ion-select-option value="1">1 - Baixa</ion-select-option>
                    <ion-select-option value="2">2 - Média</ion-select-option>
                    <ion-select-option value="3">3 - Alta</ion-select-option>
                    <ion-select-option value="4">4 - Muito Alta</ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Distância Mínima (metros)</ion-label>
                  <ion-input
                    formControlName="distance"
                    type="number"
                    placeholder="300"
                    min="50"
                    max="2000">
                  </ion-input>
                </ion-item>
              </div>
              
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

              <!-- Botão para continuar mesmo com falhas -->
              <ion-button
                *ngIf="showRetryButton && !showTraccarRetryButton"
                expand="block"
                color="success"
                (click)="forceComplete()"
                class="force-complete-button">
                <ion-icon name="checkmark-circle" slot="start"></ion-icon>
                Continuar Mesmo com Falhas
              </ion-button>

              <!-- Botão para reenviar cadastro no Traccar -->
              <ion-button
                *ngIf="showTraccarRetryButton"
                expand="block"
                color="tertiary"
                (click)="retryTraccarRegistration()"
                class="traccar-retry-button">
                <ion-icon name="server" slot="start"></ion-icon>
                Reenviar Cadastro Traccar
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
  showTraccarRetryButton = false;
  failureDetails: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private trackerConfigService: TrackerConfigService,
    private router: Router
  ) {
    console.log('ConfigSimplePage constructor');
  }

  ngOnInit() {
    console.log('ConfigSimplePage ngOnInit');
    this.initializeForm();
    this.initializeSteps();
    
    // Verificar se há IMEI passado do scanner
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['imei']) {
      const scannedIMEI = navigation.extras.state['imei'];
      this.configForm.patchValue({ imei: scannedIMEI });
      this.message = 'IMEI escaneado com sucesso!';
      this.messageColor = 'success';
    }
    
    // Monitorar sessão de configuração
    this.trackerConfigService.configurationSession$.subscribe(session => {
      this.currentSession = session;
      this.isConfiguring = session?.status === 'IN_PROGRESS';
      
      if (session) {
        this.showTimeline = true;
        this.configurationSteps = session.steps;
        
        // Verificar se há falhas
        if (session.status === 'FAILED') {
          this.isConfiguring = false;
          
          // Verificar se falhou especificamente no cadastro Traccar
          if (this.trackerConfigService.hasTraccarRegistrationFailed(session)) {
            this.showTraccarRetryButton = true;
            this.showRetryButton = false;
            this.message = 'Falha no cadastro Traccar. Clique para reenviar.';
            this.messageColor = 'warning';
          } else {
            this.showRetryButton = true;
            this.showTraccarRetryButton = false;
            this.failureDetails = this.trackerConfigService.getFailureDetails(session);
            this.message = `Configuração falhou. ${this.failureDetails.length} erro(s) encontrado(s).`;
            this.messageColor = 'danger';
          }
        } else if (session.status === 'COMPLETED') {
          this.showRetryButton = false;
          this.showTraccarRetryButton = false;
          this.failureDetails = [];
          this.message = 'Configuração concluída com sucesso!';
          this.messageColor = 'success';
        }
      }
    });
  }

  private initializeForm(): void {
    this.configForm = this.formBuilder.group({
      imei: ['', [Validators.required, Validators.pattern(/^\d{15}$/)]],
      chipNumber: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      deviceType: ['GT02D', Validators.required],
      operator: ['VIVO', Validators.required],
      // Campos específicos do CRX 3 Mini
      movingTime: [20, [Validators.min(10), Validators.max(300)]],
      stoppedTime: [1800, [Validators.min(60), Validators.max(7200)]],
      angle: [15, [Validators.min(5), Validators.max(90)]],
      sensitivity: [3, Validators.required],
      distance: [300, [Validators.min(50), Validators.max(2000)]]
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
        imei: this.configForm.value.imei,
        chipNumber: this.configForm.value.chipNumber,
        deviceType: this.configForm.value.deviceType,
        operator: this.configForm.value.operator,
        // Configurações específicas do CRX 3 Mini
        ...(this.configForm.value.deviceType === 'CRX3_MINI' && {
          crx3Config: {
            movingTime: this.configForm.value.movingTime,
            stoppedTime: this.configForm.value.stoppedTime,
            angle: this.configForm.value.angle,
            sensitivity: this.configForm.value.sensitivity,
            distance: this.configForm.value.distance
          }
        })
      };

      try {
        // Iniciar configuração real
        const session = this.trackerConfigService.startConfiguration(device);
        this.showTimeline = true;
        this.isConfiguring = true;
        
        this.message = `Configuração ${device.deviceType} iniciada com sucesso!`;
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
      imei: '',
      deviceType: 'GT02D',
      operator: 'VIVO'
    });
    
    // Limpar sessão no serviço
    this.trackerConfigService.clearSession();
  }

  forceComplete(): void {
    if (this.currentSession) {
      console.log('Forçando conclusão da configuração...');
      
      // Usar método do serviço para forçar conclusão
      this.trackerConfigService.forceCompleteConfiguration(this.currentSession);
      
      // Limpar estado da UI
      this.showRetryButton = false;
      this.failureDetails = [];
      this.message = 'Prosseguindo para cadastro no Traccar...';
      this.messageColor = 'success';
    }
  }

  retryTraccarRegistration(): void {
    if (this.currentSession) {
      console.log('Reenviando cadastro no Traccar...');
      
      // Usar método do serviço para reenviar cadastro Traccar
      this.trackerConfigService.retryTraccarRegistration(this.currentSession);
      
      // Limpar estado da UI
      this.showTraccarRetryButton = false;
      this.showRetryButton = false;
      this.message = 'Reenviando cadastro no Traccar...';
      this.messageColor = 'primary';
      this.isConfiguring = true;
    }
  }

  async openScanner(): Promise<void> {
    try {
      // Navegar para a página de scanner
      await this.router.navigate(['/scanner'], {
        state: {
          imei: this.configForm.get('imei')?.value || '',
          returnUrl: '/config'
        }
      });
    } catch (error) {
      console.error('Erro ao abrir scanner:', error);
      this.message = 'Erro ao abrir scanner. Tente novamente.';
      this.messageColor = 'danger';
    }
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