import { Component, OnInit } from '@angular/core';
import { IonToolbar, IonButtons, IonButton, IonTitle, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import {
  personCircle,
  search,
  ellipsisHorizontal,
  ellipsisVertical,
} from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonToolbar, IonButtons, IonButton, IonIcon, IonTitle],
})
export class HeaderComponent  implements OnInit {

  constructor() {
    addIcons({ personCircle, search, ellipsisHorizontal, ellipsisVertical });
   }

  ngOnInit() {}

}
