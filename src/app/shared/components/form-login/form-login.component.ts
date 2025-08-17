import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonButton, IonInput, IonIcon, IonInputPasswordToggle, IonToggle, IonSpinner, IonText, LoadingController, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.models';

@Component({
  selector: 'app-form-login',
  templateUrl: './form-login.component.html',
  styleUrls: ['./form-login.component.scss'],
  imports: [IonItem, IonLabel, IonInput, IonButton, IonIcon, IonInputPasswordToggle, IonToggle, IonSpinner, IonText, ReactiveFormsModule, CommonModule],
})
export class FormLoginComponent implements OnInit {
  title: string = 'Seja bem-vindo!';
  subTitle: string = 'Faça login para continuar.';
  currentYear: number = new Date().getFullYear();
  companyName: string = 'Genesis Its';
  
  loginForm!: FormGroup;
  isLoading = false;
  
  // Ícones mais usados em formulários
  commonIcons = {
    email: 'mail-outline',
    password: 'lock-closed-outline',
    user: 'person-outline',
    phone: 'call-outline',
    search: 'search-outline',
    location: 'location-outline',
    calendar: 'calendar-outline',
    time: 'time-outline',
    document: 'document-text-outline',
    card: 'card-outline',
    visibility: 'eye-outline',
    visibilityOff: 'eye-off-outline',
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.initializeForm();
  }

  ngOnInit() {}

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid && !this.isLoading) {
      const loading = await this.loadingController.create({
        message: 'Fazendo login...',
        spinner: 'crescent'
      });
      
      await loading.present();
      this.isLoading = true;

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;
          
          const toast = await this.toastController.create({
            message: 'Login realizado com sucesso!',
            duration: 2000,
            color: 'success',
            position: 'top'
          });
          await toast.present();
          
          this.router.navigate(['/tabs/dashboard']);
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          
          let errorMessage = 'Erro ao fazer login. Tente novamente.';
          
          if (error.status === 401) {
            errorMessage = 'Email ou senha incorretos.';
          } else if (error.status === 0) {
            errorMessage = 'Erro de conexão. Verifique sua internet.';
          }
          
          const toast = await this.toastController.create({
            message: errorMessage,
            duration: 3000,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${fieldName === 'email' ? 'Email' : 'Senha'} é obrigatório`;
    }
    
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    
    if (control?.hasError('minlength')) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }
}
