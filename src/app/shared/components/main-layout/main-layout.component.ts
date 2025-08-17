import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonButtons,
  IonButton,
  MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  qrCodeOutline,
  qrCode,
  settingsOutline,
  settings,
  personOutline,
  person,
  logOutOutline,
  menuOutline,
  closeOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.models';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  activeIcon: string;
  color?: string;
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonFooter,
    IonTabBar,
    IonTabButton,
    IonButtons,
    IonButton
  ]
})
export class MainLayoutComponent implements OnInit {
  currentUser: User | null = null;
  selectedPath = '/dashboard';

  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'home-outline',
      activeIcon: 'home',
      color: 'primary'
    },
    {
      title: 'Scanner',
      url: '/scanner',
      icon: 'qr-code-outline',
      activeIcon: 'qr-code',
      color: 'secondary'
    },
    {
      title: 'Configuração',
      url: '/config',
      icon: 'settings-outline',
      activeIcon: 'settings',
      color: 'tertiary'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private menuController: MenuController
  ) {
    addIcons({
      homeOutline,
      home,
      qrCodeOutline,
      qrCode,
      settingsOutline,
      settings,
      personOutline,
      person,
      logOutOutline,
      menuOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.authService.authState$.subscribe(authState => {
      this.currentUser = authState.user;
    });

    // Monitorar mudanças de rota
    this.router.events.subscribe(() => {
      this.selectedPath = this.router.url;
    });
  }

  navigateTo(url: string) {
    this.selectedPath = url;
    this.router.navigate([url]);
    this.menuController.close('main-menu');
  }

  isActive(url: string): boolean {
    return this.selectedPath === url || this.selectedPath.startsWith(url + '/');
  }

  getIcon(item: MenuItem): string {
    return this.isActive(item.url) ? item.activeIcon : item.icon;
  }

  getColor(item: MenuItem): string {
    return this.isActive(item.url) ? (item.color || 'primary') : 'medium';
  }

  logout() {
    this.authService.logout();
    this.menuController.close('main-menu');
  }

  openProfile() {
    // Implementar navegação para perfil
    console.log('Abrir perfil');
    this.menuController.close('main-menu');
  }

  async toggleMenu() {
    const isOpen = await this.menuController.isOpen('main-menu');
    if (isOpen) {
      this.menuController.close('main-menu');
    } else {
      this.menuController.open('main-menu');
    }
  }
}