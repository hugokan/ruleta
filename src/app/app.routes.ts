import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () =>
      import('./ruleta/ruleta.component').then(m => m.RuletaComponent)
  },
  {
    path: '**',
    redirectTo: 'ruleta'
  }
];

