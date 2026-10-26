import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cadastro',
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./register/register').then((component) => component.Register),
  },
  {
    path: 'cadastro/sucesso',
    loadComponent: () =>
      import('./registration-success/registration-success').then(
        (component) => component.RegistrationSuccess,
      ),
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found').then((component) => component.NotFound),
  },
];
