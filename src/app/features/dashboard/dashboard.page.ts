import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircle,
  search,
  ellipsisHorizontal,
  ellipsisVertical,
} from 'ionicons/icons';
import { EstatisticaComponent } from 'src/app/shared/components/dashboard/estatistica/estatistica.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    EstatisticaComponent
  ],
})
export class DashboardPage implements OnInit {
  constructor() {
    addIcons({ personCircle, search, ellipsisHorizontal, ellipsisVertical });
  }

  ngOnInit() {}
}
