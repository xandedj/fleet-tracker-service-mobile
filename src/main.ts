import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/shared/interceptors/auth.interceptor';

// Importar ícones
import { addIcons } from 'ionicons';
import {
  mailOutline,
  mail,
  lockClosedOutline,
  lockClosed,
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  personOutline,
  callOutline,
  searchOutline,
  locationOutline,
  personCircleOutline,
  personCircle,
  logOut,
  settings,
  person,
  refresh,
  helpCircle,
  phonePortrait,
  send,
  checkmarkCircle,
  closeCircle,
  time,
  trash,
  list,
  chatbubbles,
  server,
  location,
  homeOutline,
  home,
  qrCodeOutline,
  qrCode,
  settingsOutline,
  logOutOutline,
  menuOutline,
  closeOutline
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Registrar os ícones
addIcons({
  'mail-outline': mailOutline,
  'mail': mail,
  'lock-closed-outline': lockClosedOutline,
  'lock-closed': lockClosed,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'log-in-outline': logInOutline,
  'person-outline': personOutline,
  'call-outline': callOutline,
  'search-outline': searchOutline,
  'location-outline': locationOutline,
  'person-circle-outline': personCircleOutline,
  'person-circle': personCircle,
  'log-out': logOut,
  'settings': settings,
  'person': person,
  'refresh': refresh,
  'help-circle': helpCircle,
  'phone-portrait': phonePortrait,
  'send': send,
  'checkmark-circle': checkmarkCircle,
  'close-circle': closeCircle,
  'time': time,
  'trash': trash,
  'list': list,
  'chatbubbles': chatbubbles,
  'server': server,
  'location': location,
  'home-outline': homeOutline,
  'home': home,
  'qr-code-outline': qrCodeOutline,
  'qr-code': qrCode,
  'settings-outline': settingsOutline,
  'log-out-outline': logOutOutline,
  'menu-outline': menuOutline,
  'close-outline': closeOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});
