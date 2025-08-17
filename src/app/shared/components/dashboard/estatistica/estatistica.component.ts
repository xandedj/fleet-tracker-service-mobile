import { Component, OnInit } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-estatistica',
  templateUrl: './estatistica.component.html',
  styleUrls: ['./estatistica.component.scss'],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent],
})
export class EstatisticaComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
