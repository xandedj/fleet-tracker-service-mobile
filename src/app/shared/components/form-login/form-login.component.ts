import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonItem, IonLabel, IonButton, IonInput, IonIcon, IonInputPasswordToggle, IonToggle } from '@ionic/angular/standalone';


@Component({
  selector: 'app-form-login',
  templateUrl: './form-login.component.html',
  styleUrls: ['./form-login.component.scss'],
  imports: [IonItem, IonLabel, IonInput, IonButton, IonIcon, IonInputPasswordToggle, IonToggle, FormsModule],
})
export class FormLoginComponent implements OnInit {
  title: string = 'Seja bem-vindo!';
  subTitle: string = 'Faça login para continuar.';
  rememberMe: boolean = false;
  currentYear: number = new Date().getFullYear();
  companyName: string = 'Genesis Its';
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

  constructor() {}

  ngOnInit() {}
}
