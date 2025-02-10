import { Component, Signal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatList, MatListItem } from '@angular/material/list';
import { trigger, style, animate, transition } from '@angular/animations';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-ruleta',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatList,
    MatListItem
  ],
  templateUrl: './ruleta.component.html',
  styleUrls: ['./ruleta.component.css'],
  animations: [
    trigger('spin', [
      transition(':enter', [
        style({ transform: 'rotate(0deg)' }),
        animate('2s ease-out', style({ transform: 'rotate(720deg)' }))
      ])
    ])
  ]
})
export class RuletaComponent {
  nombres = signal<string[]>([]);
  historial = signal<{ nombre: string; fecha: string }[]>([]);
  nombreSeleccionado = signal<string | null>(null);
  nombreAnimado = signal<string[]>([]);
  girando = signal<boolean>(false);
  apiNombresUrl = 'https://reservapp.pockethost.io/api/collections/listaruleta/records';
  apiHistorialUrl = 'https://reservapp.pockethost.io/api/collections/ruleta/records';
  colores = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFC300', '#800080', '#008080', '#FF4500', '#00CED1', '#FFD700'];
  rotacion = signal<number>(0);
  showNames: boolean = true;
  latestRecord: any;

  constructor(private http: HttpClient, public dialog: MatDialog) {
    this.cargarHistorial();
    this.obtenerNombres();
  }

  obtenerNombres() {
    this.http.get<{ items: { nombre: string }[] }>(this.apiNombresUrl).subscribe(response => {
      this.nombres.set(response.items.map(item => item.nombre));
    });
  }

  girarRuleta() {
    /*if (this.nombres().length === 0) {
      alert('Todos los nombres han sido seleccionados. Reinicia la lista.');
      return;
    }

    this.girando.set(true);
    const vueltas = 5 + Math.floor(Math.random() * 5); // Entre 5 y 10 vueltas completas
    const randomIndex = Math.floor(Math.random() * this.nombres().length);
    const anguloPorNombre = 360 / this.nombres().length;
    const nuevoAngulo = vueltas * 360 + randomIndex * anguloPorNombre;
    this.rotacion.set(nuevoAngulo);*/
    if (this.nombres().length === 0) return;
    this.girando.set(true);
    const randomIndex = Math.floor(Math.random() * this.nombres().length);
    this.rotacion.set(360 * 5 + (randomIndex * (360 / this.nombres().length)));

    setTimeout(() => {
      const nombre = this.nombres()[randomIndex];
      this.nombreSeleccionado.set(nombre);
      this.nombres.set(this.nombres().filter(n => n !== nombre));
      this.historial.set([...this.historial(), { nombre, fecha: new Date().toLocaleString() }]);
      this.animarNombre(nombre);
      this.girando.set(false);
      this.guardarHistorial();
    }, 3000);
  }

  registrarHistorial(nombre: string) {
    const registro = { nombre, fecha: new Date().toISOString() };
    this.http.post(this.apiHistorialUrl, registro).subscribe();
  }

  animarNombre(nombre: string) {
    this.nombreAnimado.set(Array(nombre.length).fill('?')); // Inicializa con '?'

    nombre.split('').forEach((letra, i) => {
      setTimeout(() => {
        this.nombreAnimado.update(prev => {
          const nuevo = [...prev];
          nuevo[i] = letra;
          return nuevo;
        });
      }, i * 300); // Cada letra aparecerá con retraso
    });
  }

  // Método para obtener el registro más reciente
  deleteLatestRecord(): Observable<any> {
    return this.http.get<any>(`https://reservapp.pockethost.io/api/collections/ruleta/records?sort=-created&limit=1`).pipe(
      switchMap((data) => {
        if (data?.items?.length > 0) {
          const latestId = data.items[0].id;
          return this.http.delete<any>(`${this.apiHistorialUrl}/${latestId}`);
        } else {
          throw new Error('No hay registros para eliminar.');
        }
      })
    );
  }

  saltarNombre() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
    this.deleteLatestRecord().subscribe(
      () => console.log('Último registro eliminado con éxito'),
      (error) => console.error('Error eliminando el registro:', error)
    );
    this.girarRuleta();
  }
})
this.cargarHistorial();
this.obtenerNombres();
}

  reiniciarLista() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Eliminar todos los registros de PocketHost
        this.http.get<{ items: { id: string }[] }>(this.apiHistorialUrl).subscribe(response => {
          const deleteRequests = response.items.map(item =>
            this.http.delete(`${this.apiHistorialUrl}/${item.id}`)
          );

          // Ejecutar todas las solicitudes de eliminación
          Promise.all(deleteRequests.map(req => req.toPromise())).then(() => {
            this.obtenerNombres();
            //this.nombres.set(['Juan', 'Maria', 'Luis', 'Ana', 'Carlos', 'Sofia', 'Pedro', 'Elena', 'Diego', 'Marta']);
            this.historial.set([]);
            this.nombreSeleccionado.set(null);
          });
        });
      }
    });
  }

  cargarHistorial() {
    this.http.get<{ items: { nombre: string; fecha: string }[] }>(this.apiHistorialUrl)
      .subscribe(response => this.historial.set(response.items));
  }

  guardarHistorial() {
    const nuevoRegistro = this.historial()[this.historial().length - 1]; // Último seleccionado
    if (!nuevoRegistro) return;

    this.http.post(this.apiHistorialUrl, nuevoRegistro).subscribe(
      response => console.log('Registro guardado:', response),
      error => console.error('Error al guardar:', error)
    );
  }
}


