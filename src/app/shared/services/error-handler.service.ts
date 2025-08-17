import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private toastController: ToastController) {}

  async handleError(error: HttpErrorResponse): Promise<void> {
    let message = 'Ocorreu um erro inesperado';
    
    switch (error.status) {
      case 0:
        message = 'Erro de conexão. Verifique sua internet.';
        break;
      case 400:
        message = 'Dados inválidos enviados.';
        break;
      case 401:
        message = 'Credenciais inválidas.';
        break;
      case 403:
        message = 'Acesso negado.';
        break;
      case 404:
        message = 'Recurso não encontrado.';
        break;
      case 422:
        message = 'Dados de entrada inválidos.';
        break;
      case 500:
        message = 'Erro interno do servidor.';
        break;
      case 503:
        message = 'Serviço temporariamente indisponível.';
        break;
      default:
        if (error.error?.message) {
          message = error.error.message;
        }
    }

    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top',
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}