import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TraccarDevice } from '../models/tracker.models';

export interface TraccarPosition {
  id: number;
  deviceId: number;
  protocol: string;
  deviceTime: string;
  fixTime: string;
  serverTime: string;
  outdated: boolean;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  address?: string;
  accuracy?: number;
  network?: any;
  attributes: any;
}

export interface TraccarEvent {
  id: number;
  type: string;
  eventTime: string;
  deviceId: number;
  positionId?: number;
  geofenceId?: number;
  attributes: any;
}

@Injectable({
  providedIn: 'root',
})
export class TraccarService {
  private readonly traccarUrl = environment.urlTraccar;

  private websocket: WebSocket | null = null;
  private devicePositionsSubject = new BehaviorSubject<TraccarPosition[]>([]);
  public devicePositions$ = this.devicePositionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${environment.tokenTraccar}`,
      'Content-Type': 'application/json',
    });
  }

  // Autenticar no Traccar
  authenticate(): Observable<any> {
    return this.http.get(`${this.traccarUrl}/session`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Listar todos os dispositivos
  getDevices(): Observable<TraccarDevice[]> {
    return this.http.get<TraccarDevice[]>(`${this.traccarUrl}/devices`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Buscar dispositivo por uniqueId
  getDeviceByUniqueId(uniqueId: string): Observable<TraccarDevice | null> {
    return new Observable((observer) => {
      this.getDevices().subscribe({
        next: (devices) => {
          const device = devices.find((d) => d.uniqueId === uniqueId);
          observer.next(device || null);
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }

  // Criar novo dispositivo
  createDevice(device: Partial<TraccarDevice>): Observable<TraccarDevice> {
    return this.http.post<TraccarDevice>(`${this.traccarUrl}/devices`, device, {
      headers: this.getAuthHeaders(),
    });
  }

  // Atualizar dispositivo
  updateDevice(
    deviceId: number,
    device: Partial<TraccarDevice>
  ): Observable<TraccarDevice> {
    return this.http.put<TraccarDevice>(
      `${this.traccarUrl}/devices/${deviceId}`,
      device,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Obter posições de um dispositivo
  getDevicePositions(
    deviceId: number,
    from?: Date,
    to?: Date
  ): Observable<TraccarPosition[]> {
    let url = `${this.traccarUrl}/positions?deviceId=${deviceId}`;

    if (from && to) {
      url += `&from=${from.toISOString()}&to=${to.toISOString()}`;
    }

    return this.http.get<TraccarPosition[]>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  // Obter última posição de um dispositivo
  getLastPosition(deviceId: number): Observable<TraccarPosition | null> {
    return new Observable((observer) => {
      this.getDevicePositions(deviceId).subscribe({
        next: (positions) => {
          const lastPosition =
            positions.length > 0 ? positions[positions.length - 1] : null;
          observer.next(lastPosition);
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }

  // Conectar ao WebSocket do Traccar
  connectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
    }

    const wsUrl = this.traccarUrl.replace('http', 'ws') + '/socket';
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket conectado ao Traccar');

      // Autenticar via WebSocket
      const authMessage = {
        url: '/api/session',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${environment.tokenTraccar}`,
        },
      };

      this.websocket?.send(JSON.stringify(authMessage));
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.positions) {
          this.devicePositionsSubject.next(data.positions);
        }

        if (data.events) {
          // Processar eventos se necessário
          console.log('Eventos recebidos:', data.events);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    this.websocket.onclose = () => {
      console.log('WebSocket desconectado');
      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        this.connectWebSocket();
      }, 5000);
    };

    this.websocket.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
  }

  // Desconectar WebSocket
  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // Monitorar primeira posição de um dispositivo específico
  monitorFirstPosition(deviceId: number): Observable<TraccarPosition> {
    return new Observable((observer) => {
      const subscription = this.devicePositions$.subscribe((positions) => {
        const devicePosition = positions.find(
          (pos) => pos.deviceId === deviceId
        );
        if (devicePosition) {
          observer.next(devicePosition);
          observer.complete();
          subscription.unsubscribe();
        }
      });

      // Timeout após 10 minutos
      setTimeout(() => {
        observer.error(
          new Error('Timeout: Primeira posição não recebida em 10 minutos')
        );
        subscription.unsubscribe();
      }, 10 * 60 * 1000);
    });
  }

  // Cadastrar dispositivo automaticamente
  async registerDevice(
    chipNumber: string,
    deviceType: string
  ): Promise<TraccarDevice> {
    try {
      // Verificar se dispositivo já existe
      const existingDevice = await this.getDeviceByUniqueId(
        chipNumber
      ).toPromise();

      if (existingDevice) {
        return existingDevice;
      }

      // Criar novo dispositivo
      const newDevice: Partial<TraccarDevice> = {
        name: `${deviceType}_${chipNumber}`,
        uniqueId: chipNumber,
        phone: chipNumber,
        model: deviceType,
        category: 'default',
      };

      const createdDevice = await this.createDevice(newDevice).toPromise();
      if (!createdDevice) {
        throw new Error('Falha ao criar dispositivo no Traccar');
      }

      return createdDevice;
    } catch (error) {
      console.error('Erro ao registrar dispositivo no Traccar:', error);
      throw error;
    }
  }

  // Verificar se dispositivo está online
  async isDeviceOnline(deviceId: number): Promise<boolean> {
    try {
      const lastPosition = await this.getLastPosition(deviceId).toPromise();

      if (!lastPosition) {
        return false;
      }

      // Considerar online se última posição foi há menos de 5 minutos
      const lastUpdate = new Date(lastPosition.serverTime);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

      return diffMinutes <= 5;
    } catch (error) {
      console.error('Erro ao verificar status do dispositivo:', error);
      return false;
    }
  }

  // Converter Observable para Promise com tratamento de erro
  private toPromise<T>(observable: Observable<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      observable.subscribe({
        next: (value) => resolve(value),
        error: (error) => reject(error),
      });
    });
  }
}
