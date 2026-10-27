import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { brazilianPhoneValidator, normalizeBrazilianPhone } from '../brazil-phone';
import { RegistrationError, RegistrationService } from '../registration.service';

@Component({
  imports: [NgOptimizedImage, ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  templateUrl: './register.html',
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly registrationService = inject(RegistrationService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly feedback = signal<{ kind: 'duplicate' | 'error'; message: string } | null>(
    null,
  );
  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    whatsapp: ['', [Validators.required, brazilianPhoneValidator]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });

  protected async submit(): Promise<void> {
    this.feedback.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const whatsapp = normalizeBrazilianPhone(this.form.controls.whatsapp.value);
    if (!whatsapp) {
      this.form.controls.whatsapp.setErrors({ brazilianPhone: true });
      this.form.controls.whatsapp.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      await firstValueFrom(
        this.registrationService.register({
          nome: this.form.controls.nome.value.trim(),
          whatsapp,
          email: this.form.controls.email.value.trim(),
          plan: 'TRIAL',
          status_pagamento: 'TRIAL',
        }),
      );
    } catch (error: unknown) {
      this.feedback.set({
        kind:
          error instanceof RegistrationError && error.kind === 'duplicate' ? 'duplicate' : 'error',
        message:
          error instanceof RegistrationError
            ? error.message
            : 'Não foi possível concluir o cadastro. Tente novamente em alguns minutos.',
      });
      this.isSubmitting.set(false);
      return;
    }

    this.isSubmitting.set(false);
    await this.router.navigateByUrl('/cadastro/sucesso');
  }
}
