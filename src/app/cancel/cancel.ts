import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CancellationError, RegistrationService } from '../registration.service';

type CancellationState = 'confirmation' | 'submitting' | 'success' | 'error';

@Component({
  imports: [RouterLink],
  selector: 'app-cancel',
  styleUrl: './cancel.css',
  templateUrl: './cancel.html',
})
export class Cancel {
  private readonly route = inject(ActivatedRoute);
  private readonly registrationService = inject(RegistrationService);
  protected readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  protected readonly state = signal<CancellationState>(
    this.token ? 'confirmation' : 'error',
  );
  protected readonly errorMessage = signal(
    this.token
      ? ''
      : 'Este link de cancelamento está incompleto ou inválido. Solicite um novo link.',
  );

  protected async confirmCancellation(): Promise<void> {
    if (!this.token || !['confirmation', 'error'].includes(this.state())) {
      return;
    }

    this.errorMessage.set('');
    this.state.set('submitting');
    try {
      await firstValueFrom(this.registrationService.cancel(this.token));
      this.state.set('success');
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof CancellationError
          ? error.message
          : 'Não foi possível concluir o cancelamento. Tente novamente mais tarde.',
      );
      this.state.set('error');
    }
  }
}
