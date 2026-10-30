import { Component, signal } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ModalController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonText,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';

import { RestaurantesService } from '../../services/restaurantes.service';

@Component({
  selector: 'app-add-restaurante-modal',
  standalone: true,
  templateUrl: './add-restaurante-modal.component.html',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonText,
    IonSpinner,
    IonIcon
  ]
})
export class AddRestauranteModalComponent {

  // H1 - Visibilidad del estado del sistema:
  // La señal guardando permite informar al usuario de que el restaurante
  // se está enviando a Firebase y evita nuevas acciones mientras termina.
  guardando = signal(false);


  // H5 - Prevención de errores:
  // El nombre y el territorio son campos obligatorios.
  // Además, Michelin y Repsol solamente aceptan valores entre 0 y 3.
  form = this.fb.group({
    documentName: [
      '',
      Validators.required
    ],

    territory: [
      '',
      Validators.required
    ],

    locality: [''],

    address: [''],

    phone: [''],

    web: [''],

    michelinStar: [
      0,
      [
        Validators.min(0),
        Validators.max(3)
      ]
    ],

    repsolSun: [
      0,
      [
        Validators.min(0),
        Validators.max(3)
      ]
    ]
  });


  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private service: RestaurantesService,
    private toastCtrl: ToastController
  ) {}


  // H3 - Control y libertad del usuario:
  // El usuario puede cancelar el modal sin guardar ningún restaurante.
  cancelar(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }


  // H5 - Prevención de errores:
  // Antes de guardar se comprueba que el formulario sea válido.
  // Si existen errores, se marcan todos los campos para que puedan
  // mostrarse los mensajes de validación correspondientes.
  async guardar(): Promise<void> {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }


    // H1 - Visibilidad del estado del sistema:
    // Se activa el estado guardando para que la interfaz pueda mostrar
    // "Guardando..." y un spinner mientras se realiza la operación.
    this.guardando.set(true);

    try {

      await this.service.add(
        this.form.getRawValue() as any
      );


      // H3 - Control y libertad del usuario:
      // El modal solamente se cierra automáticamente después
      // de que el restaurante se haya guardado correctamente.
      await this.modalCtrl.dismiss(
        true,
        'saved'
      );

    } catch {

      // H9 - Reconocer, diagnosticar y recuperarse de errores:
      // Si Firebase no puede guardar el restaurante, se muestra
      // un mensaje claro indicando una posible solución.
      const toast = await this.toastCtrl.create({
        message:
          'Error al guardar. Revisa tu conexión.',
        color: 'danger',

        // H9 - Recuperación de errores:
        // El error permanece visible hasta que el usuario lo cierre.
        duration: 0,

        // H4 - Consistencia y estándares:
        // Los mensajes aparecen en la parte inferior, igual que
        // los demás toasts de la aplicación.
        position: 'bottom',

        buttons: [
          {
            icon: 'close',
            role: 'cancel'
          }
        ]
      });

      await toast.present();

    } finally {

      // H1 - Visibilidad del estado del sistema:
      // Al finalizar la operación se desactiva el estado de guardado
      // y la interfaz vuelve a su estado normal.
      this.guardando.set(false);
    }
  }
}