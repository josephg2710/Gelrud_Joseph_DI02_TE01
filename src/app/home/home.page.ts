import { Component, computed, signal } from '@angular/core';

import {
  AlertController,
  LoadingController,
  ModalController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonContent,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonChip
} from '@ionic/angular/standalone';

import { Restaurante } from '../models/restaurante';
import { RestaurantesService } from '../services/restaurantes.service';
import { AddRestauranteModalComponent } from '../components/add-restaurante-modal/add-restaurante-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonContent,
    IonItem,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonChip
  ]
})
export class HomePage {

  // H1-1 - Visibilidad del estado del sistema:
  // Estas señales permiten mostrar si la aplicación está cargando
  // restaurantes o realizando una importación.
  cargando = signal(false);
  importando = signal(false);

  // Lista principal de restaurantes obtenidos de Firebase.
  restaurantesCargados = signal<Restaurante[]>([]);

  // H7-1 - Flexibilidad y eficiencia de uso:
  // El usuario puede buscar directamente por el nombre del restaurante.
  textoBusqueda = signal('');

  // H7-2 - Flexibilidad y eficiencia de uso:
  // El usuario puede reducir los resultados seleccionando un territorio.
  territorioSeleccionado = signal('');

  // H7-3 - Flexibilidad y eficiencia de uso:
  // Se permite seleccionar varias localidades simultáneamente.
  localidadesSeleccionadas = signal<string[]>([]);

  // H6-1 - Reconocimiento en lugar de recuerdo:
  // Se conserva la columna y la dirección de ordenación activa para que
  // la interfaz pueda mostrar al usuario cómo están ordenados los datos.
  sortColumna = signal<keyof Restaurante>('documentName');
  sortDireccion = signal<'asc' | 'desc'>('asc');

  // H8-1 - Diseño estético y minimalista:
  // Permite ocultar elementos que no tienen utilidad hasta que haya datos.
  hayDatos = computed(() => this.restaurantesCargados().length > 0);

  // Calcula los territorios disponibles sin elementos repetidos.
  territoriosFiltrados = computed(() =>
    [
      ...new Set(
        this.restaurantesCargados()
          .map(restaurante => restaurante.territory)
          .filter(Boolean)
      )
    ].sort()
  );

  // Las localidades mostradas dependen del territorio seleccionado.
  localidadesFiltradasPorTerritorio = computed(() =>
    [
      ...new Set(
        this.restaurantesCargados()
          .filter(restaurante =>
            !this.territorioSeleccionado() ||
            restaurante.territory === this.territorioSeleccionado()
          )
          .map(restaurante => restaurante.locality || '')
          .filter(Boolean)
      )
    ].sort()
  );

  // H6-2 - Reconocimiento en lugar de recuerdo:
  // Permite saber si existen filtros activos para mostrarlos mediante chips.
  // De esta forma, el usuario no tiene que recordar qué filtros ha aplicado.
  hayFiltrosActivos = computed(() =>
    !!this.textoBusqueda() ||
    !!this.territorioSeleccionado() ||
    this.localidadesSeleccionadas().length > 0
  );

  // H7-4 - Flexibilidad y eficiencia de uso:
  // Los filtros de búsqueda, territorio y localidades se pueden combinar.
  restaurantesFiltrados = computed(() => {
    const restaurantes = this.restaurantesCargados().filter(restaurante => {
      const coincideNombre = (restaurante.documentName || '')
        .toLowerCase()
        .includes(this.textoBusqueda().toLowerCase());

      const coincideTerritorio =
        !this.territorioSeleccionado() ||
        restaurante.territory === this.territorioSeleccionado();

      const coincideLocalidad =
        this.localidadesSeleccionadas().length === 0 ||
        this.localidadesSeleccionadas().includes(
          restaurante.locality || ''
        );

      return (
        coincideNombre &&
        coincideTerritorio &&
        coincideLocalidad
      );
    });

    // H6-3 - Reconocimiento en lugar de recuerdo:
    // Los resultados permanecen ordenados según la columna y dirección
    // elegidas por el usuario.
    const columna = this.sortColumna();
    const direccion = this.sortDireccion();

    return [...restaurantes].sort((restauranteA, restauranteB) => {
      const valorA = String(restauranteA[columna] ?? '');
      const valorB = String(restauranteB[columna] ?? '');

      const comparacion = valorA.localeCompare(
        valorB,
        'es',
        { numeric: true }
      );

      return comparacion * (direccion === 'asc' ? 1 : -1);
    });
  });

  constructor(
    private service: RestaurantesService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  // H1-2 - Visibilidad del estado del sistema:
  // La señal cargando informa de que existe una operación en curso.

  // H1-3 - Visibilidad del estado del sistema:
  // Al terminar se muestra un toast de éxito y, si falla, un toast de error.

  // H9-1 - Ayudar a reconocer, diagnosticar y recuperarse de errores:
  // El mensaje indica al usuario que revise la conexión si la carga falla.
  async cargarDatos(): Promise<void> {
    this.cargando.set(true);

    try {
      const restaurantes = await this.service.getAll();
      this.restaurantesCargados.set(restaurantes);

      await this.toast(
        'Restaurantes cargados correctamente',
        'success'
      );
    } catch (error: any) {
      await this.error(
        error,
        'Error al cargar datos. Revisa tu conexión a internet.'
      );
    } finally {
      this.cargando.set(false);
    }
  }

  // H3-1 - Control y libertad del usuario:
  // El restaurante se añade desde un modal que el usuario puede cancelar.

  // H1-4 - Visibilidad del estado del sistema:
  // Cuando el restaurante se guarda, se actualiza la lista y se confirma
  // la operación mediante un mensaje visible.
  async abrirModalAnadir(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AddRestauranteModalComponent
    });

    await modal.present();

    const resultado = await modal.onDidDismiss();

    if (resultado.role === 'saved') {
      await this.cargarDatos();

      await this.toast(
        'Restaurante añadido correctamente',
        'success'
      );
    }
  }

  // H3-2 - Control y libertad del usuario:
  // El cuadro de confirmación ofrece la opción Cancelar.

  // H5-1 - Prevención de errores:
  // Antes de borrar se solicita una confirmación explícita para evitar
  // eliminaciones accidentales.

  // H2-1 - Coincidencia entre el sistema y el mundo real:
  // El mensaje menciona el nombre real del restaurante que se va a borrar.
  async borrarRestaurante(restaurante: Restaurante): Promise<void> {
    const alerta = await this.alertCtrl.create({
      header: 'Confirmar borrado',
      message:
        `¿Deseas borrar el restaurante ${restaurante.documentName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Borrar',
          role: 'destructive',
          handler: () => this.ejecutarBorrado(restaurante)
        }
      ]
    });

    await alerta.present();
  }

  // H1-5 - Visibilidad del estado del sistema:
  // Durante la operación de red se muestra el mensaje
  // "Borrando restaurante...".

  // H9-2 - Ayudar a reconocer, diagnosticar y recuperarse de errores:
  // Si el borrado falla, se explica que puede deberse a la conexión.
  private async ejecutarBorrado(
    restaurante: Restaurante
  ): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Borrando restaurante...'
    });

    await loading.present();

    try {
      await this.service.remove(restaurante);

      this.restaurantesCargados.update(restaurantes =>
        restaurantes.filter(
          elemento => elemento.id !== restaurante.id
        )
      );

      await this.toastDeshacer(restaurante);
    } catch {
      await this.toast(
        'Error al borrar el restaurante. Revisa tu conexión.',
        'danger',
        0
      );
    } finally {
      await loading.dismiss();
    }
  }

  // H3-3 - Control y libertad del usuario:
  // Después de borrar, el usuario dispone de seis segundos para deshacer.

  // H9-3 - Ayudar a reconocer, diagnosticar y recuperarse de errores:
  // Si la acción Deshacer falla, se informa mediante un mensaje persistente.
  private async toastDeshacer(
    restaurante: Restaurante
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: 'Restaurante eliminado',
      color: 'success',
      duration: 6000,
      position: 'bottom',
      buttons: [
        {
          text: 'Deshacer',
          handler: async () => {
            try {
              await this.service.add(restaurante);
              await this.cargarDatos();
            } catch {
              await this.toast(
                'Error al deshacer el borrado. Revisa tu conexión.',
                'danger',
                0
              );
            }
          }
        },
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  // H3-4 - Control y libertad del usuario:
  // La importación masiva también se puede cancelar antes de ejecutarse.

  // H5-2 - Prevención de errores:
  // Se explica que la importación sustituirá los datos actuales antes
  // de solicitar la confirmación.
  async confirmarImportacion(): Promise<void> {
    const alerta = await this.alertCtrl.create({
      header: 'Importar datos',
      subHeader: 'Se sustituirán los restaurantes actuales',
      message:
        'Esta operación afecta a todos los datos. ¿Deseas continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Importar',
          handler: () => this.importar()
        }
      ]
    });

    await alerta.present();
  }

  // H1-6 - Visibilidad del estado del sistema:
  // Durante la importación se muestra un overlay con el mensaje
  // "Subiendo restaurantes...".

  // H5-3 - Prevención de errores:
  // La señal importando permite deshabilitar otras operaciones mientras
  // se está modificando toda la base de datos.
  private async importar(): Promise<void> {
    this.importando.set(true);

    const loading = await this.loadingCtrl.create({
      message: 'Subiendo restaurantes...'
    });

    await loading.present();

    try {
      const respuesta = await fetch('assets/restaurantes.json');
      const datos = await respuesta.json();

      const restaurantes = Array.isArray(datos)
        ? datos
        : (datos.restaurantes ?? []);

      await this.service.replaceAll(restaurantes);
      await this.cargarDatos();

      await this.toast(
        'Importación completada',
        'success'
      );
    } catch (error: any) {
      await this.error(
        error,
        'Error al importar datos. Revisa tu conexión.'
      );
    } finally {
      this.importando.set(false);
      await loading.dismiss();
    }
  }

  // H5-4 - Prevención de errores:
  // Al cambiar de territorio se eliminan las localidades anteriores,
  // evitando conservar localidades que no pertenecen al nuevo territorio.
  onTerritorioChange(valor: string): void {
    this.territorioSeleccionado.set(valor || '');
    this.localidadesSeleccionadas.set([]);
  }

  onLocalidadesChange(localidades: string[]): void {
    this.localidadesSeleccionadas.set(localidades || []);
  }

  // H3-5 - Control y libertad del usuario:
  // Permite volver rápidamente al estado inicial de los filtros.
  limpiarTodosFiltros(): void {
    this.textoBusqueda.set('');
    this.territorioSeleccionado.set('');
    this.localidadesSeleccionadas.set([]);
  }

  // H3-6 - Control y libertad del usuario:
  // El usuario puede eliminar una sola localidad sin perder los demás
  // filtros seleccionados.
  quitarLocalidad(localidad: string): void {
    this.localidadesSeleccionadas.update(localidades =>
      localidades.filter(
        elemento => elemento !== localidad
      )
    );
  }

  // H7-5 - Flexibilidad y eficiencia de uso:
  // El usuario puede ordenar los restaurantes por distintas columnas
  // sin recargar la aplicación.
  cambiarOrden(columna: keyof Restaurante): void {
    if (this.sortColumna() === columna) {
      this.sortDireccion.update(direccion =>
        direccion === 'asc' ? 'desc' : 'asc'
      );
    } else {
      this.sortColumna.set(columna);
      this.sortDireccion.set('asc');
    }
  }

  // H2-2 - Coincidencia entre el sistema y el mundo real:
  // Las estrellas Michelin se convierten a un número comprensible
  // para su presentación en la tabla.
  estrellasMichelin(restaurante: Restaurante): number {
    return Number(restaurante.michelinStar) || 0;
  }

  // H2-3 - Coincidencia entre el sistema y el mundo real:
  // Los Soles Repsol mantienen la terminología gastronómica conocida.
  repsolSoles(restaurante: Restaurante): number {
    return Number(restaurante.repsolSun) || 0;
  }

  // H9-4 - Ayudar a reconocer y diagnosticar errores:
  // Se distingue un error de permisos de un fallo general de conexión.
  private async error(
    error: any,
    mensajeAlternativo: string
  ): Promise<void> {
    const mensaje =
      error?.code === 'permission-denied'
        ? 'Sin permisos en Firebase. Revisa las reglas de seguridad.'
        : mensajeAlternativo;

    await this.toast(
      mensaje,
      'danger',
      0
    );
  }

  // H4-1 - Consistencia y estándares:
  // Todos los avisos aparecen en la parte inferior y tienen un botón
  // de cierre con el mismo formato.

  // H9-5 - Ayudar a reconocer y recuperarse de errores:
  // Los errores tienen duración 0 y permanecen visibles hasta que el
  // usuario los cierre, mientras los mensajes de éxito duran tres segundos.
  private async toast(
    message: string,
    color: 'success' | 'danger',
    duration = 3000
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
