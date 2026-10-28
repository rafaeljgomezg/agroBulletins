import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

export const ACTIVEPIECES_WEBHOOK_URL =
  'https://cloud.activepieces.com/api/v1/webhooks/aibYC4KKD4HGKZMcO4jUq/sync';
export const CANCELLATION_WEBHOOK_URL =
  'https://cloud.activepieces.com/api/v1/webhooks/8y9NATCryBPAfTFiIxAdh/sync';

export interface RegistrationPayload {
  nome: string;
  whatsapp: string;
  email: string;
  plan: 'TRIAL' | 'PREMIUM' | 'CANCELED' | 'EXPIRED';
  status_pagamento: 'ACTIVE' | 'PENDING';
}

type ErrorKind = 'duplicate' | 'error';
type ResponseRecord = Record<string, unknown>;

export class RegistrationError extends Error {
  constructor(
    readonly kind: ErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'RegistrationError';
  }
}

export class CancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CancellationError';
  }
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  register(payload: RegistrationPayload): Observable<void> {
    return this.http.post<unknown>(ACTIVEPIECES_WEBHOOK_URL, payload).pipe(
      map((response) => {
        const result = asRecord(response);
        if (isDuplicate(result) || result?.['exists'] === true) {
          throw new RegistrationError(
            'duplicate',
            'Já existe um cadastro com este WhatsApp ou e-mail.',
          );
        }

        const status = typeof result?.['status'] === 'string' ? result['status'].toLowerCase() : '';
        const code = typeof result?.['code'] === 'string' ? result['code'].toUpperCase() : '';
        if (
          result?.['success'] === true ||
          status === 'created' ||
          status === 'success' ||
          code === 'CREATED'
        ) {
          return;
        }

        throw new RegistrationError(
          'error',
          'Não foi possível confirmar seu cadastro. Tente novamente em alguns minutos.',
        );
      }),
      catchError((error: unknown) => {
        if (error instanceof RegistrationError) {
          return throwError(() => error);
        }
        if (error instanceof HttpErrorResponse) {
          const body = asRecord(error.error);
          const duplicate = error.status === 409 || isDuplicate(body);
          return throwError(
            () =>
              new RegistrationError(
                duplicate ? 'duplicate' : 'error',
                duplicate
                  ? 'Já existe um cadastro com este WhatsApp ou e-mail.'
                  : 'Não foi possível conectar ao serviço de cadastro. Tente novamente mais tarde.',
              ),
          );
        }
        return throwError(
          () => new RegistrationError('error', 'Ocorreu um erro inesperado ao criar sua conta.'),
        );
      }),
    );
  }

  cancel(token: string): Observable<void> {
    return this.http.post<unknown>(CANCELLATION_WEBHOOK_URL, { token }).pipe(
      map((response) => {
        const result = asRecord(response);
        const status =
          typeof result?.['status'] === 'string' ? result['status'].toLowerCase() : '';
        const code = typeof result?.['code'] === 'string' ? result['code'].toUpperCase() : '';
        if (
          result?.['success'] === true ||
          ['canceled', 'cancelled'].includes(status) ||
          ['CANCELED', 'CANCELLED'].includes(code)
        ) {
          return;
        }

        throw new CancellationError(
          readMessage(result) ??
            'Não foi possível confirmar o cancelamento. Tente novamente mais tarde.',
        );
      }),
      catchError((error: unknown) => {
        if (error instanceof CancellationError) {
          return throwError(() => error);
        }
        if (error instanceof HttpErrorResponse) {
          const responseMessage = readMessage(asRecord(error.error));
          return throwError(
            () =>
              new CancellationError(
                responseMessage ??
                  'Não foi possível conectar ao serviço de cancelamento. Tente novamente mais tarde.',
              ),
          );
        }
        return throwError(
          () => new CancellationError('Ocorreu um erro inesperado ao cancelar sua conta.'),
        );
      }),
    );
  }
}

function asRecord(value: unknown): ResponseRecord | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as ResponseRecord;
  }
  return null;
}

function readMessage(value: ResponseRecord | null): string | null {
  for (const key of ['message', 'error', 'detail']) {
    const message = value?.[key];
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return null;
}

function isDuplicate(value: ResponseRecord | null): boolean {
  const code = value?.['code'];
  const status = value?.['status'];
  const message = readMessage(value);
  const duplicateCodes = ['USER_EXISTS', 'ALREADY_EXISTS', 'DUPLICATE', '23505'];
  return (
    (typeof code === 'string' && duplicateCodes.includes(code.toUpperCase())) ||
    (typeof status === 'string' &&
      ['duplicate', 'exists', 'already_exists', 'conflict'].includes(status.toLowerCase())) ||
    (typeof message === 'string' &&
      /already exists|duplicate|unique violation|ya existe|duplicad/i.test(message))
  );
}
