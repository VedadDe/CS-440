import { Injectable } from '@angular/core';
import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';

export interface Tacka {
  x: number;
  y: number;
}

export interface Pravougaonik {
  // R pretpostavljamo da ima dvije tačke:
  // R[0]: donji-lijevi ugao (xMin, yMin)
  // R[1]: gornji-desni ugao (xMax, yMax)
  bottomLeft: Tacka;  
  topRight: Tacka;
}

@Injectable({
  providedIn: 'root'
})
export class MrezaService {

  private m!: number;                // broj ćelija po strani (m x m)
  private dimC!: number;            // dimenzija svake ćelije
  private mat!: Tacka[][][];        // 3D matrica: mat[i][j] = niz tačaka koje upadaju u ćeliju (i,j)
  
  constructor() { }

  /**
   * 1) Formira mrežu dimenzije m x m.
   * 2) Razvrstava (klasificira) sve tačke u odgovarajuće ćelije.
   *
   * @param dimM  dužina jedne strane "velikog kvadrata" (npr. max(x) - min(x) ili slično)
   * @param tacke niz tačaka
   * @param m     broj ćelija po jednoj strani
   */
  public napraviMrezuFixno(dimM: number, tacke: Tacka[], m: number): void {
    this.m = m;
    this.dimC = dimM / m;
    
    // Alociramo 2D matricu gde je svaka ćelija niz tačaka
    this.mat = new Array(this.m);
    for (let i = 0; i < this.m; i++) {
      this.mat[i] = new Array(this.m);
      for (let j = 0; j < this.m; j++) {
        this.mat[i][j] = [];
      }
    }

    // Raspoređivanje tačaka u ćelije
    for (const t of tacke) {
      const i1 = Math.floor(t.x / this.dimC);  // indeks kolone
      const j1 = Math.floor(t.y / this.dimC);  // indeks vrste (reda)
      // Vodite računa da indeksi ne izađu van opsega [0, m-1]
      if (i1 >= 0 && i1 < this.m && j1 >= 0 && j1 < this.m) {
        this.mat[i1][j1].push(t);
      }
    }
  }

  /**
   * Alternativni konstruktor preko epsilona:
   *  m = ceil(sqrt(brojTacaka / eps)).
   * Nakon određivanja m, mreža se kreira i popunjava slično prethodnom.
   */
  public napraviMrezuEps(dimM: number, tacke: Tacka[], eps: number = 1.0): void {
    const brojTc = tacke.length;
    const mCalc = Math.ceil(Math.sqrt(brojTc / eps));
    this.napraviMrezuFixno(dimM, tacke, mCalc);
  }

  /**
   * Pretraga opsega. Vraća niz tačaka koje upadaju u dati pravougaonik R.
   */
  public pretraziOpseg(R: Pravougaonik): Tacka[] {
    const rezultat: Tacka[] = [];

    // indeksne granice u mreži
    const startCol = Math.floor(R.bottomLeft.x / this.dimC);
    const endCol   = Math.floor(R.topRight.x    / this.dimC);
    const startRow = Math.floor(R.bottomLeft.y / this.dimC);
    const endRow   = Math.floor(R.topRight.y    / this.dimC);

    // Prolazimo kroz "relevantne" ćelije
    for (let i = startCol; i <= endCol; i++) {
      for (let j = startRow; j <= endRow; j++) {
        if (this.jeUOpsegu(i, j)) {
          // Prođemo kroz sve tačke u ćeliji (i,j)
          for (const t of this.mat[i][j]) {
            // Provjera da li tačka t leži u pravougaoniku
            if (this.jelTackaUPravougaoniku(t, R)) {
              rezultat.push(t);
            }
          }
        }
      }
    }

    return rezultat;
  }

  /**
   * Pomoćna funkcija za provjeru da li indeks ćelije (i, j) nije van mreže.
   */
  private jeUOpsegu(i: number, j: number): boolean {
    return (i >= 0 && i < this.m && j >= 0 && j < this.m);
  }

  /**
   * Da li tacka t spada u pravougaonik R?
   */
  private jelTackaUPravougaoniku(t: Tacka, R: Pravougaonik): boolean {
    return (
      t.x >= R.bottomLeft.x &&
      t.x <= R.topRight.x &&
      t.y >= R.bottomLeft.y &&
      t.y <= R.topRight.y
    );
  }

  /**
   * Getter dimenzije ćelije (za crtanje).
   */
  public getDimC(): number {
    return this.dimC;
  }

  /**
   * Ukupan broj ćelija po dimenziji.
   */
  public getM(): number {
    return this.m;
  }

  /**
   * Vraća sve tačke unutar jedne ćelije (i, j).
   */
  public getCellPoints(i: number, j: number): Tacka[] {
    if (!this.jeUOpsegu(i, j)) return [];
    return this.mat[i][j];
  }
}

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit {
    @ViewChild('myCanvas', { static: true }) myCanvas!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
  
    // Podaci
    private tacke: Tacka[] = [];
    private pravougaonik?: Pravougaonik;
    private rezultat?: Tacka[]; // tačke unutar izabranog pravougaonika
  
    // Za "klik i prevuci" mišem
    private isDragging: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    private endX: number = 0;
    private endY: number = 0;
  
    constructor(private mrezaService: MrezaService) {}
  
    ngOnInit(): void {
      this.ctx = this.myCanvas.nativeElement.getContext('2d')!;
  
      // 1) generišemo / pravimo neki niz tačaka
      this.generisiTackePrimjer();
  
      // 2) Kreiramo mrežu
      //   a) fiksno: npr. dimM = 600, m = 12 => 12x12 ćelija
      //   this.mrezaService.napraviMrezuFixno(600, this.tacke, 12);
  
      //   b) preko eps:
      this.mrezaService.napraviMrezuEps(600, this.tacke, 1.0); 
  
      // 3) Inicijalno nacrtamo sve
      this.crtajSve();
    }
  
    /**
     * Generiše pseudo-random tačke ili ih definiše "ručno".
     */
    private generisiTackePrimjer(): void {
      // Ovde generišemo 30-ak slučajnih tačaka unutar 600x600
      const N = 37;
      for (let i = 0; i < N; i++) {
        this.tacke.push({
          x: Math.random() * 600,
          y: Math.random() * 600
        });
      }
    }
  
    /**
     * Crta kompletnu scenu:
     *  - mrežu (ćelije)
     *  - sve tačke
     *  - pravougaonik (ako je definisan)
     *  - obojene tačke koje upadaju u pravougaonik
     */
    private crtajSve(): void {
      // 1) brišemo canvas
      this.ctx.clearRect(0, 0, 600, 600);
  
      // 2) iscrtavamo mrežu (ćelije)
      this.crtajMrezu();
  
      // 3) iscrtavamo sve tačke
      this.ctx.fillStyle = 'black';
      for (let t of this.tacke) {
        this.crtajTacku(t.x, t.y, 3);
      }
  
      // 4) iscrtavamo pravougaonik ako postoji
      if (this.pravougaonik) {
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          this.pravougaonik.bottomLeft.x,
          this.pravougaonik.bottomLeft.y,
          this.pravougaonik.topRight.x - this.pravougaonik.bottomLeft.x,
          this.pravougaonik.topRight.y - this.pravougaonik.bottomLeft.y
        );
  
        // 5) iscrtavamo tačke unutar pravougaonika (ako je urađena pretraga)
        if (this.rezultat) {
          this.ctx.fillStyle = 'blue';
          for (let r of this.rezultat) {
            this.crtajTacku(r.x, r.y, 4); // malo veći radijus
          }
        }
      }
    }
  
    /**
     * Uzimajući dimenziju ćelije iz mreže, crtamo linije mreže.
     */
    private crtajMrezu(): void {
      const dimC = this.mrezaService.getDimC();
      const m = this.mrezaService.getM();
  
      this.ctx.strokeStyle = '#aaaaaa';
      this.ctx.lineWidth = 1;
  
      // Vertikalne linije
      for (let i = 0; i <= m; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * dimC, 0);
        this.ctx.lineTo(i * dimC, m * dimC);
        this.ctx.stroke();
      }
  
      // Horizontalne linije
      for (let j = 0; j <= m; j++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, j * dimC);
        this.ctx.lineTo(m * dimC, j * dimC);
        this.ctx.stroke();
      }
    }
  
    private crtajTacku(x: number, y: number, r: number): void {
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  
    /**
     * Slušamo događaje na mišu da bismo nacrtali "izborni" pravougaonik.
     * Kad otpustimo miš, pokrećemo pretragu u mreži i osvežimo prikaz.
     */
    @HostListener('mousedown', ['$event'])
    onMouseDown(e: MouseEvent) {
      this.isDragging = true;
      const rect = this.myCanvas.nativeElement.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
      this.endX   = this.startX;
      this.endY   = this.startY;
    }
  
    @HostListener('mousemove', ['$event'])
    onMouseMove(e: MouseEvent) {
      if (this.isDragging) {
        const rect = this.myCanvas.nativeElement.getBoundingClientRect();
        this.endX = e.clientX - rect.left;
        this.endY = e.clientY - rect.top;
  
        // Definišemo privremeni pravougaonik
        this.pravougaonik = {
          bottomLeft: {
            x: Math.min(this.startX, this.endX),
            y: Math.min(this.startY, this.endY)
          },
          topRight: {
            x: Math.max(this.startX, this.endX),
            y: Math.max(this.startY, this.endY)
          }
        };
  
        // Još nismo izvršili pretragu (tek nakon mouseup)
        this.rezultat = undefined;
  
        // U toku povlačenja, samo vizuelno ažuriramo canvas
        this.crtajSve();
      }
    }
  
    @HostListener('mouseup', ['$event'])
    onMouseUp(e: MouseEvent) {
      this.isDragging = false;
      // Konačan pravougaonik je definisan
      if (this.pravougaonik) {
        // Pozivamo pretragu
        this.rezultat = this.mrezaService.pretraziOpseg(this.pravougaonik);
        this.crtajSve();
      }
    }
  }
  