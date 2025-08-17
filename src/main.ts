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
  personCircle
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
  'person-circle': personCircle
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
