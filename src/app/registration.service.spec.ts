import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ACTIVEPIECES_WEBHOOK_URL,
  RegistrationError,
  RegistrationPayload,
  RegistrationService,
} from './registration.service';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let httpTestingController: HttpTestingController;
  const payload: RegistrationPayload = {
    nome: 'Maria Silva',
    whatsapp: '+5511912345678',
    email: 'maria@example.com.br',
    plan: 'TRIAL',
    status_pagamento: 'TRIAL',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RegistrationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('envia os dados com plano de teste e aceita uma resposta explícita de sucesso', () => {
    let completed = false;
    service.register(payload).subscribe(() => (completed = true));

    const request = httpTestingController.expectOne(ACTIVEPIECES_WEBHOOK_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ success: true });

    expect(completed).toBe(true);
  });

  it('identifica um cadastro existente como duplicado', () => {
    let receivedError: unknown;
    service.register(payload).subscribe({ error: (error: unknown) => (receivedError = error) });

    const request = httpTestingController.expectOne(ACTIVEPIECES_WEBHOOK_URL);
    request.flush(
      { code: 'USER_EXISTS', message: 'Este WhatsApp já existe.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(receivedError).toBeInstanceOf(RegistrationError);
    expect(receivedError).toMatchObject({
      kind: 'duplicate',
      message: 'Já existe um cadastro com este WhatsApp ou e-mail.',
    });
  });

  it('não trata uma resposta rejeitada ou desconhecida como sucesso', () => {
    let receivedError: unknown;
    service.register(payload).subscribe({ error: (error: unknown) => (receivedError = error) });

    httpTestingController
      .expectOne(ACTIVEPIECES_WEBHOOK_URL)
      .flush({ success: false, message: 'No fue posible crear el usuario.' });

    expect(receivedError).toBeInstanceOf(RegistrationError);
    expect(receivedError).toMatchObject({ kind: 'error' });
  });
});
