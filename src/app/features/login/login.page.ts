import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard } from '@ionic/angular/standalone';
import { FormLoginComponent } from "src/app/shared/components/form-login/form-login.component";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, FormLoginComponent, IonCard]
})
export class LoginPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
