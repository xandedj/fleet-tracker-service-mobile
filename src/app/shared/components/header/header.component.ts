import { Component, OnInit } from '@angular/core';
import { IonToolbar, IonButtons, IonButton, IonTitle, IonIcon, ActionSheetController } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import {
  personCircle,
  search,
  ellipsisHorizontal,
  ellipsisVertical,
  logOut,
  settings,
  person,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.models';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonToolbar, IonButtons, IonButton, IonIcon, IonTitle],
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      personCircle,
      search,
      ellipsisHorizontal,
      ellipsisVertical,
      logOut,
      settings,
      person
    });
  }

  ngOnInit() {
    this.authService.authState$.subscribe(authState => {
      this.currentUser = authState.user;
    });
  }

  async presentUserMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: this.currentUser?.name || 'Usuário',
      subHeader: this.currentUser?.email,
      buttons: [
        {
          text: 'Perfil',
          icon: 'person',
          handler: () => {
            // Implementar navegação para perfil
            console.log('Navegar para perfil');
          }
        },
        {
          text: 'Configurações',
          icon: 'settings',
          handler: () => {
            // Implementar navegação para configurações
            console.log('Navegar para configurações');
          }
        },
        {
          text: 'Sair',
          icon: 'log-out',
          role: 'destructive',
          handler: () => {
            this.logout();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  logout() {
    this.authService.logout();
  }

  onSearch() {
    // Implementar funcionalidade de busca
    console.log('Buscar');
  }

  async presentOptionsMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opções',
      buttons: [
        {
          text: 'Atualizar',
          icon: 'refresh',
          handler: () => {
            // Implementar atualização
            console.log('Atualizar dados');
          }
        },
        {
          text: 'Ajuda',
          icon: 'help-circle',
          handler: () => {
            // Implementar ajuda
            console.log('Mostrar ajuda');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }
}
