import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideMarkdown } from 'ngx-markdown';
import { LOCALE_ID } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';
import { KeycloakConf } from './services/KeycloakConf.service';
import { initializeKeycloak, KeycloakService } from './services/keycloak.service';
import { KeycloakInterceptor } from './interceptors/keycloak.interceptor';

registerLocaleData(localeFr);

export function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, '/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    provideMarkdown(),

    KeycloakConf,
    KeycloakService,

    provideAppInitializer(() => {
      const keycloakConf = inject(KeycloakConf);
      return initializeKeycloak(keycloakConf)();
    }),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakInterceptor,
      multi: true,
    },
    provideToastr({
      closeButton: false,
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      countDuplicates: true,
      progressBar: true,
    }),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ]
};