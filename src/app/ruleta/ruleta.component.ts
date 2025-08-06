import { Component, computed, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
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
    MatListModule,
    MatTableModule
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
  nombreSeleccionado = signal<string[]>([]);
  nombreAnimado = signal<string[]>([]);
  girando = signal<boolean>(false);
  rotacion = signal<number>(0);
  isDisabled = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalParticipantes = 0;

  private apiNombresUrl = 'https://reservapp.pockethost.io/api/collections/listaruleta/records';
  private apiHistorialUrl = 'https://reservapp.pockethost.io/api/collections/ruleta/records';

  constructor(private http: HttpClient, public dialog: MatDialog) {
    this.cargarHistorial();
    this.obtenerNombres();
    this.cargarRegistros();
  }

  obtenerNombres() {
    this.http.get<{ items: { nombre: string }[] }>(this.apiNombresUrl).subscribe(response => {
      this.nombres.set(response.items.map(item => item.nombre));
      this.totalParticipantes = response.items.length;
    });
  }

  participantesRestantes = computed(() => {
    const todos = this.nombres();
    const yaSalieron = this.historial().map(item => item.nombre);
    return todos.filter(nombre => !yaSalieron.includes(nombre));;
  });

  girarRuleta() {
    if (this.nombres().length === 0 || this.isDisabled()) return;

    this.isDisabled.set(true);
    this.girando.set(true);

    const nombresDisponibles = this.nombres().filter(n => !this.historial().some(h => h.nombre === n));
    if (nombresDisponibles.length === 0) {
      this.nombreSeleccionado.set(['Todos los nombres han salido']);
      this.girando.set(false);
      this.isDisabled.set(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * nombresDisponibles.length);
    const nombre = nombresDisponibles[randomIndex];
    this.rotacion.set(360 * 5 + (randomIndex * (360 / nombresDisponibles.length)));

    setTimeout(() => {
      this.nombreSeleccionado.set([nombre]);
      this.nombres.set(this.nombres().filter(n => n !== nombre));
      const fecha = new Date().toLocaleString();
      this.historial.set([...this.historial(), { nombre, fecha }]);
      this.animarNombre(nombre);
      this.guardarHistorial(nombre, fecha);
      this.girando.set(false);
      this.isDisabled.set(false);
      this.cargarRegistros();
    }, 3000);
  }

  girarRuletaAleatoria() {
    
    this.isDisabled.set(true);
    this.girando.set(true);

    const nombresDisponibles = this.nombres();

    const randomIndex = Math.floor(Math.random() * (nombresDisponibles.length + 150));
    
    this.rotacion.set(360 * 5 + (randomIndex * (360 / nombresDisponibles.length)));

    setTimeout(() => {
      const indiceAleatorio = Math.floor(Math.random() * this.nombres().length);
      const nombre = nombresDisponibles[indiceAleatorio];
      this.nombreSeleccionado.set([nombre]);
      this.animarNombre(nombre);
      this.girando.set(false);
      this.isDisabled.set(false);
    }, 3000);
  }

  animarNombre(nombre: string) {
    this.nombreAnimado.set(Array(nombre.length).fill('?'));
    nombre.split('').forEach((letra, i) => {
      setTimeout(() => {
        this.nombreAnimado.update(prev => {
          const nuevo = [...prev];
          nuevo[i] = letra;
          return nuevo;
        });
      }, i * 300);
    });
  }

  guardarHistorial(nombre: string, fecha: string) {
    const nuevoRegistro = { nombre, fecha };
    this.http.post(this.apiHistorialUrl, nuevoRegistro).subscribe(
      () => console.log('Registro guardado'),
      error => console.error('Error al guardar:', error)
    );
  }

  cargarHistorial() {
    this.http.get<{ items: { nombre: string; fecha: string }[] }>(this.apiHistorialUrl)
      .subscribe(response => this.historial.set(response.items));
  }

  cargarRegistros() {
    this.http.get<any>(this.apiHistorialUrl)
      .subscribe(response => this.totalItems.set(response.totalItems));
  }

  deleteLatestRecord(): Observable<any> {
    return this.http.get<any>(`${this.apiHistorialUrl}?sort=-created&limit=1`).pipe(
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
          () => {
            console.log('Último registro eliminado con éxito');
            this.cargarHistorial();
            this.obtenerNombres();
          },
          (error) => console.error('Error eliminando el registro', error)
        );
      }
    });
  }

  reiniciarLista() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.get<{ items: { id: string }[] }>(this.apiHistorialUrl).subscribe(response => {
          const deleteRequests = response.items.map(item =>
            this.http.delete(`${this.apiHistorialUrl}/${item.id}`)
          );

          Promise.all(deleteRequests.map(req => req.toPromise())).then(() => {
            this.obtenerNombres();
            this.historial.set([]);
            this.nombreSeleccionado.set([]);
          });
        });
      }
    });
  }
}
