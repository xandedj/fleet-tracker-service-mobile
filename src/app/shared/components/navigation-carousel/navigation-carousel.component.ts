import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonIcon,
  IonLabel,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  qrCodeOutline,
  qrCode,
  settingsOutline,
  settings
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface NavigationItem {
  title: string;
  url: string;
  icon: string;
  activeIcon: string;
  color: string;
}

@Component({
  selector: 'app-navigation-carousel',
  templateUrl: './navigation-carousel.component.html',
  styleUrls: ['./navigation-carousel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon,
    IonLabel
  ],
  providers: [NavController]
})
export class NavigationCarouselComponent implements OnInit, OnDestroy {
  selectedPath = '/dashboard';
  private subscriptions = new Subscription();

  navigationItems: NavigationItem[] = [
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
    private location: Location,
    private navController: NavController
  ) {
    addIcons({
      homeOutline,
      home,
      qrCodeOutline,
      qrCode,
      settingsOutline,
      settings
    });
  }

  ngOnInit() {
    // Monitorar mudanças de rota
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
    console.log('Navegando via carousel para:', url);
    
    // Método 1: NavController (recomendado para Ionic)
    try {
      this.navController.navigateForward(url).then(() => {
        console.log('Navegação via NavController concluída para:', url);
        this.selectedPath = url;
      }).catch(error => {
        console.error('Erro na navegação via NavController:', error);
        this.fallbackNavigation(url);
      });
    } catch (error) {
      console.error('Erro ao usar NavController:', error);
      this.fallbackNavigation(url);
    }
  }

  private fallbackNavigation(url: string) {
    console.log('Tentando navegação alternativa para:', url);
    
    // Método 2: Router tradicional
    this.router.navigate([url]).then((success) => {
      if (success) {
        console.log('Navegação via Router concluída para:', url);
        this.selectedPath = url;
      } else {
        console.log('Router falhou, usando Location...');
        // Método 3: Location + reload
        this.location.go(url);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }).catch(error => {
      console.error('Erro na navegação via Router:', error);
      // Método 4: Fallback final
      this.forceNavigation(url);
    });
  }

  private forceNavigation(url: string) {
    console.log('Forçando navegação para:', url);
    try {
      // Atualizar o estado manualmente
      this.selectedPath = url;
      this.location.go(url);
      
      // Recarregar a página como último recurso
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (e) {
      console.error('Erro em todos os métodos de navegação:', e);
    }
  }

  isActive(url: string): boolean {
    return this.selectedPath === url || this.selectedPath.startsWith(url + '/');
  }

  getIcon(item: NavigationItem): string {
    return this.isActive(item.url) ? item.activeIcon : item.icon;
  }

  getColor(item: NavigationItem): string {
    return this.isActive(item.url) ? item.color : 'medium';
  }

  trackByUrl(index: number, item: NavigationItem): string {
    return item.url;
  }
}