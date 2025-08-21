import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
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
  terminalOutline,
  terminal,
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
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavigationCarouselComponent } from '../navigation-carousel/navigation-carousel.component';

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
    RouterModule,
    IonApp,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonRouterOutlet,
    IonButtons,
    IonButton,
    NavigationCarouselComponent
  ]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  selectedPath = '/dashboard';
  private subscriptions = new Subscription();

  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'home-outline',
      activeIcon: 'home',
      color: 'primary'
    },
    {
      title: 'Comandos',
      url: '/comandos',
      icon: 'terminal-outline',
      activeIcon: 'terminal',
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
      terminalOutline,
      terminal,
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
    // Subscrever ao estado de autenticação
    const authSub = this.authService.authState$.subscribe(authState => {
      this.currentUser = authState.user;
    });
    this.subscriptions.add(authSub);

    // Monitorar mudanças de rota - apenas NavigationEnd
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.selectedPath = event.urlAfterRedirects || event.url;
      });
    this.subscriptions.add(routerSub);

    // Definir rota inicial
    this.selectedPath = this.router.url;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  navigateTo(url: string) {
    console.log('Navegando para:', url);
    
    // Navegar primeiro, depois fechar o menu
    this.router.navigate([url]).then(() => {
      console.log('Navegação concluída para:', url);
      this.selectedPath = url;
      // Fechar o menu após navegação bem-sucedida
      this.menuController.close('main-menu').catch(error => {
        console.error('Erro ao fechar menu:', error);
      });
    }).catch(error => {
      console.error('Erro na navegação:', error);
    });
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
    console.log('Fazendo logout...');
    this.menuController.close('main-menu').then(() => {
      this.authService.logout();
    }).catch(() => {
      // Fazer logout mesmo se o menu não fechar
      this.authService.logout();
    });
  }

  openProfile() {
    console.log('Abrindo perfil...');
    this.menuController.close('main-menu').then(() => {
      // Implementar navegação para perfil
      console.log('Perfil aberto');
    });
  }

  closeMenu() {
    console.log('Fechando menu...');
    this.menuController.close('main-menu').catch(error => {
      console.error('Erro ao fechar menu:', error);
    });
  }

  toggleMenu() {
    console.log('Alternando menu...');
    this.menuController.toggle('main-menu').catch(error => {
      console.error('Erro ao alternar menu:', error);
      // Fallback: tentar abrir diretamente
      this.menuController.open('main-menu').catch(err => {
        console.error('Erro ao abrir menu:', err);
      });
    });
  }
}