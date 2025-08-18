import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ToastController,
  LoadingController,
  AlertController
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class ScannerPage implements OnInit {
  imeiValue: string = '';
  isScanning: boolean = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    // Verificar se há um IMEI passado como parâmetro
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['imei']) {
      this.imeiValue = navigation.extras.state['imei'];
    }
  }

  async openCamera() {
    try {
      this.isScanning = true;

      // Usar Camera API para capturar imagem
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Capturar IMEI',
        promptLabelPhoto: 'Tirar Foto',
        promptLabelPicture: 'Escolher da Galeria'
      });

      if (image.dataUrl) {
        // Mostrar alerta para entrada manual após captura da imagem
        await this.showManualInputAlert('Imagem capturada! Digite o IMEI que você vê na imagem:');
      }

    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      if (error instanceof Error && error.message && error.message.includes('cancelled')) {
        await this.showToast('Captura cancelada', 'warning');
      } else {
        await this.showToast('Erro ao acessar a câmera. Digite o IMEI manualmente.', 'danger');
      }
    } finally {
      this.isScanning = false;
    }
  }

  async showManualInputAlert(message: string = 'Digite o IMEI do código que você vê:') {
    const alert = await this.alertController.create({
      header: 'Digite o IMEI',
      message: message,
      inputs: [
        {
          name: 'imei',
          type: 'text',
          placeholder: 'IMEI (15 dígitos)',
          value: this.imeiValue, // Pré-preencher com valor atual se houver
          attributes: {
            maxlength: 15
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: (data) => {
            if (data.imei && data.imei.length >= 15) {
              this.imeiValue = data.imei.replace(/\D/g, '').substring(0, 15); // Limpar e limitar
              return true;
            } else {
              this.showToast('IMEI deve ter pelo menos 15 dígitos', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  extractIMEI(scannedText: string): string {
    // Extrair apenas números do texto escaneado
    const numbers = scannedText.replace(/\D/g, '');
    
    // Se tiver 15 dígitos, assumir que é um IMEI
    if (numbers.length >= 15) {
      return numbers.substring(0, 15);
    }
    
    // Procurar por padrões comuns de IMEI em QR codes
    const imeiMatch = scannedText.match(/IMEI[:\s]*(\d{15})/i);
    if (imeiMatch) {
      return imeiMatch[1];
    }

    // Se não encontrar padrão específico, retornar os primeiros 15 dígitos
    return numbers.substring(0, 15);
  }

  stopScanning() {
    this.isScanning = false;
  }

  async confirmIMEI() {
    if (!this.imeiValue || this.imeiValue.length < 15) {
      await this.showToast('IMEI deve ter pelo menos 15 dígitos', 'warning');
      return;
    }

    // Validar se é apenas números
    if (!/^\d+$/.test(this.imeiValue)) {
      await this.showToast('IMEI deve conter apenas números', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Confirmando IMEI...'
    });
    await loading.present();

    try {
      // Navegar de volta para a página de configuração com o IMEI
      await this.router.navigate(['/config'], {
        state: { 
          imei: this.imeiValue,
          fromScanner: true 
        }
      });

      await this.showToast('IMEI confirmado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao confirmar IMEI:', error);
      await this.showToast('Erro ao confirmar IMEI', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // Método para formatar IMEI enquanto digita
  onIMEIInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove não-dígitos
    if (value.length > 15) {
      value = value.substring(0, 15); // Limita a 15 dígitos
    }
    this.imeiValue = value;
    event.target.value = value;
  }
}
