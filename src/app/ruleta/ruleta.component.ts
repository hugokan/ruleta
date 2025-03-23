import { Component, Signal, computed, signal } from '@angular/core';
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
import { ApexChartComponent } from "../apex-chart/apex-chart.component";
import { TreeViewComponent } from "../tree-view/tree-view.component";

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
    MatListItem,
    ApexChartComponent,
    TreeViewComponent
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
  apiNombresUrl = 'https://reservapp.pockethost.io/api/collections/listaruleta/records';
  apiHistorialUrl = 'https://reservapp.pockethost.io/api/collections/ruleta/records';
  colores = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFC300', '#800080', '#008080', '#FF4500', '#00CED1', '#FFD700'];
  rotacion = signal<number>(0);
  showNames: boolean = true;
  isDisabled = false;
  totalItems = signal<number>(0);

  nombres2: string[] = [];  // Lista de nombres originales
  historial2: string[] = []; // Lista de nombres ya seleccionados
  nombreSeleccionado2: string | null = null; // Nombre que se mostrará

  // para probar el tree
  miObjeto = [{
    services: { web: "Hosting", cloud: "AWS" },
    users: { admin: "Juan", guest: "Ana" },
    products: {errors: "Laptop", apa2: "Smartphone"}
  }];

  treeNode3 = {
    services: [
      {
        id: 15365,
        metrics: {
          requests: 11588885,
          failedRequests: 155491,
          hiddenErrors: 78971,
          responseTime: 37.15298831595965
        },
        errors: {
          propagated: [
            { count: 78194, categoryId: 'DEVELOPMENT' },
            { count: 318, categoryId: 'CONFIGURATION' },
            { count: 76974, categoryId: 'UNAVAILABILITY' },
            { count: 1, categoryId: 'NOERROR' },
            { count: 4, categoryId: 'UNCLASSIFIED' }
          ],
          hidden: [
            { count: 2754, categoryId: 'UNAVAILABILITY' },
            { count: 76214, categoryId: 'NOERROR' },
            { count: 3, categoryId: 'UNCLASSIFIED' }
          ]
        },
        description: 'Gestión de avisos',
        name: 'GAVI0001'
      },
      {
        id: 18778,
        metrics: { requests: 2, failedRequests: 0, hiddenErrors: 0, responseTime: 215.5 },
        errors: { propagated: [], hidden: [] },
        description: 'Gestión tipos de avisos',
        name: 'XV26T00A'
      }
    ],
    tasks: []
  };

  data = {
    services: [
    { name: 'Servicios', value: 10 },
    { name: 'Errores', value: 5 }
  ],
  tasks: []

};

  jsonData = {
    name: "Producto A",
    price: 20,
    details: {
      manufacturer: "Empresa X",
      category: "Electrónica",
      specs: {
        weight: "1.2kg",
        dimensions: "10x20x30cm"
      }
    }
  };

  constructor(private http: HttpClient, public dialog: MatDialog) {
    this.cargarHistorial();
    this.obtenerNombres();
    this.cargarRegistros();
    this.cargarDatos();
    this.seleccionarNombre()
  }

  obtenerNombres() {
    this.http.get<{ items: { nombre: string }[] }>(this.apiNombresUrl).subscribe(response => {
      this.nombres.set(response.items.map(item => item.nombre));
    });
  }

  // Carga los datos de los dos endpoints
  cargarDatos() {
    this.http.get<any>(this.apiNombresUrl).subscribe(nombresData => {
      this.nombres2 = nombresData.items.map((item: any) => item.nombre); // Extraer nombres
      console.log("Lista completa de nombres:", this.nombres2);
      this.http.get<any>(this.apiHistorialUrl).subscribe(historialData => {
        this.historial2 = historialData.items.map((item: any) => item.nombre); // Extraer historial
        console.log("Historial de nombres:", this.historial2);
        const nombresDisponibles = this.nombres2.filter(nombre => !this.historial2.includes(nombre));
        console.log(nombresDisponibles);
      });
    });
  }

  // Escoge un nombre aleatorio excluyendo los que ya han salido
  seleccionarNombre2() {
    const nombresDisponibles = this.nombres2.filter(nombre => !this.historial2.includes(nombre));
    console.log(nombresDisponibles);

    if (nombresDisponibles.length === 0) {
      this.nombreSeleccionado2 = "Todos los nombres han salido";
      return;
    }

    const indiceAleatorio = Math.floor(Math.random() * nombresDisponibles.length);
    this.nombreSeleccionado2 = nombresDisponibles[indiceAleatorio];

    // Guardar el nombre en el historial automáticamente
    this.guardarEnHistorial(this.nombreSeleccionado2);
  }





  girarRuleta() {
    this.isDisabled = true; // Desactivar el botón

    setTimeout(() => {
      this.isDisabled = false; // Reactivar después de 1 minuto
    }, 15000); // 60000 ms = 1 minuto

    if (this.nombres().length === 0) return;
    this.girando.set(true);
    const randomIndex = Math.floor(Math.random() * this.nombres().length);
    this.rotacion.set(360 * 5 + (randomIndex * (360 * this.nombres().length)));

    setTimeout(() => {
      const nombre = this.seleccionarNombre();
      this.nombreSeleccionado.set([nombre]);
      this.nombres.set(this.nombres().filter(n => n !== nombre));
      this.historial.set([...this.historial(), { nombre, fecha: new Date().toLocaleString() }]);
      this.animarNombre(nombre);
      this.girando.set(false);
      this.guardarHistorial();
      this.cargarRegistros();
    }, 3000);
  }

  registrarHistorial(nombre: string) {
    const registro = { nombre, fecha: new Date().toISOString() };
    //console.log({registro})
    this.http.post(this.apiHistorialUrl, registro).subscribe();
  }

  // Guarda el nombre seleccionado en el historial
  guardarEnHistorial(nombre: string) {
    const nuevoRegistro = { nombre, fecha: new Date().toISOString() };

    this.http.post(this.apiHistorialUrl, nuevoRegistro).subscribe(() => {
      this.historial2.push(nombre); // Actualiza la lista en la aplicación
    });
  }

  // Escoge un nombre aleatorio excluyendo los que ya han salido
  seleccionarNombre() {
    const nombresDisponibles = this.nombres().filter(nombre => !this.historial().some(item => item.nombre === nombre));
    if (nombresDisponibles.length === 0) {
      return "Todos los nombres han salido";
    }
    const indiceAleatorio = Math.floor(Math.random() * nombresDisponibles.length);
    return nombresDisponibles[indiceAleatorio];
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
      (error) => console.error('Error eliminando el registro', error)
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
            this.nombreSeleccionado.set([]);
          });
        });
      }
    });
  }

  cargarRegistros() {
    this.http.get<any>(this.apiHistorialUrl)
      .subscribe(response => {
        //console.log('Total de elementos:', response.totalItems);
        this.totalItems.set(response.totalItems);
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
      response => console.log('Registro guardado'),
      error => console.error('Error al guardar:', error)
    );
  }
}


