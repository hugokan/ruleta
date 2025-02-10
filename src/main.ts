import { bootstrapApplication } from '@angular/platform-browser';
//import { appConfig } from './app/app.config';
//import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RuletaComponent } from './app/ruleta/ruleta.component';
//import { appConfig } from './app/app.config';

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from '../src/app/app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

//bootstrapApplication(AppComponent, appConfig)
//  .catch((err) => console.error(err));

bootstrapApplication(RuletaComponent, {
  providers: [provideHttpClient(), provideAnimations(), provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideAnimationsAsync()]
}).catch(err => console.error(err));
