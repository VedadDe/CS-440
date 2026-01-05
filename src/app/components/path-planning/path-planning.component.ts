import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

// Interfejs Tačka
interface Tacka {
  x: number;
  y: number;
}

// Interfejs Ivica (spaja dvije tačke)
interface Ivica {
  od: Tacka;
  do: Tacka;
}

@Component({
  selector: 'app-path-planning',
  templateUrl: './path-planning.component.html',
  styleUrls: ['./path-planning.component.scss']
})
export class PathPlanningComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas', { static: true }) platno!: ElementRef<HTMLCanvasElement>;
  private kontekst!: CanvasRenderingContext2D;

  // Definišemo prepreke kao poligone (nizovi tačaka)
  prepreke: Tacka[][] = [
    [
      { x: 100, y: 100 },
      { x: 150, y: 100 },
      { x: 150, y: 150 },
      { x: 100, y: 150 }
    ],
    [
      { x: 200, y: 200 },
      { x: 250, y: 200 },
      { x: 250, y: 250 },
      { x: 200, y: 250 }
    ]
  ];

  // Početna i ciljana tačka
  pocetak: Tacka = { x: 50, y: 50 };
  cilj: Tacka = { x: 300, y: 300 };

  // Graf vidljivosti
  grafVidljivosti: Ivica[] = [];

  // Put pronađen
  put: Tacka[] = [];

  constructor() { }

  ngOnInit(): void {
    // Inicijalizuj graf vidljivosti
    this.izgradiGrafVidljivosti();
    // Pronađi put koristeći BFS ili DFS
    this.pronadjiPutBFS();
    // Po potrebi, koristi DFS
    // this.pronadjiPutDFS();
  }

  ngAfterViewInit(): void {
    this.kontekst = this.platno.nativeElement.getContext('2d')!;
    this.crtaj();
  }

  
  izgradiGrafVidljivosti() {
    // Čvorovi su početak, cilj i svi vrhovi prepreka
    const cvorovi: Tacka[] = [this.pocetak, this.cilj];
    this.prepreke.forEach(prepreka => {
      cvorovi.push(...prepreka);
    });

    // Kreiraj ivice tamo gdje postoji vidljivost između čvorova
    for (let i = 0; i < cvorovi.length; i++) {
      for (let j = i + 1; j < cvorovi.length; j++) {
        if (this.daLiJeVidljivo(cvorovi[i], cvorovi[j])) {
          this.grafVidljivosti.push({ od: cvorovi[i], do: cvorovi[j] });
        }
      }
    }

    console.log('Graf vidljivosti:', this.grafVidljivosti);
  }

  daLiJeVidljivo(t1: Tacka, t2: Tacka): boolean {
    // Provjeri da li se linijski segment t1-t2 siječe sa nekom ivicom prepreka
    for (let prepreka of this.prepreke) {
      for (let i = 0; i < prepreka.length; i++) {
        const p1 = prepreka[i];
        const p2 = prepreka[(i + 1) % prepreka.length];
        // Ignoriši ako dijele vrh
        if (
          this.tackeJednake(t1, p1) || this.tackeJednake(t1, p2) ||
          this.tackeJednake(t2, p1) || this.tackeJednake(t2, p2)
        ) {
          continue;
        }
        if (this.daLiSeSijeku(t1, t2, p1, p2)) {
          return false;
        }
      }
    }
    return true;
  }

  tackeJednake(t1: Tacka, t2: Tacka): boolean {
    return t1.x === t2.x && t1.y === t2.y;
  }

  // Pomoćne funkcije za detekciju sjecanja linijskog segmenta
  daLiSeSijeku(t1: Tacka, t2: Tacka, p1: Tacka, p2: Tacka): boolean {
    // Nađi četiri orijentacije potrebne za opšte i posebne slučajeve
    const o1 = this.orijentacija(t1, t2, p1);
    const o2 = this.orijentacija(t1, t2, p2);
    const o3 = this.orijentacija(p1, p2, t1);
    const o4 = this.orijentacija(p1, p2, t2);

    // Opšti slučaj
    if (o1 !== o2 && o3 !== o4) {
      return true;
    }

    // Posebni slučajevi
    // t1, t2 i p1 su kolinearne i p1 leži na segmentu t1-t2
    if (o1 === 0 && this.naSegmentu(t1, p1, t2)) return true;

    // t1, t2 i p2 su kolinearne i p2 leži na segmentu t1-t2
    if (o2 === 0 && this.naSegmentu(t1, p2, t2)) return true;

    // p1, p2 i t1 su kolinearne i t1 leži na segmentu p1-p2
    if (o3 === 0 && this.naSegmentu(p1, t1, p2)) return true;

    // p1, p2 i t2 su kolinearne i t2 leži na segmentu p1-p2
    if (o4 === 0 && this.naSegmentu(p1, t2, p2)) return true;

    // Ne spada ni u jedan od gore navedenih slučajeva
    return false;
  }

  orijentacija(a: Tacka, b: Tacka, c: Tacka): number {
    const vrijednost = (b.y - a.y) * (c.x - b.x) - 
                       (b.x - a.x) * (c.y - b.y);
    if (vrijednost === 0) return 0; // kolinearno
    return (vrijednost > 0) ? 1 : 2; // u smjeru kazaljke ili suprotno
  }

  naSegmentu(a: Tacka, b: Tacka, c: Tacka): boolean {
    return b.x <= Math.max(a.x, c.x) && b.x >= Math.min(a.x, c.x) &&
           b.y <= Math.max(a.y, c.y) && b.y >= Math.min(a.y, c.y);
  }

  // canvas-visualization.component.ts (nastavak)

  listaSusjedstva: Map<string, string[]> = new Map();

  izgradiListuSusjedstva() {
    // Kreiramo mapu gdje je ključ tačka kao 'x,y' string
    this.grafVidljivosti.forEach(ivica => {
      const odKljuc = `${ivica.od.x},${ivica.od.y}`;
      const doKljuc = `${ivica.do.x},${ivica.do.y}`;
      if (!this.listaSusjedstva.has(odKljuc)) {
        this.listaSusjedstva.set(odKljuc, []);
      }
      if (!this.listaSusjedstva.has(doKljuc)) {
        this.listaSusjedstva.set(doKljuc, []);
      }
      this.listaSusjedstva.get(odKljuc)!.push(doKljuc);
      this.listaSusjedstva.get(doKljuc)!.push(odKljuc);
    });
  }

  pronadjiPutBFS() {
    this.izgradiListuSusjedstva();

    const pocetakKljuc = `${this.pocetak.x},${this.pocetak.y}`;
    const ciljKljuc = `${this.cilj.x},${this.cilj.y}`;

    const red: string[] = [pocetakKljuc];
    const posjeceno: Set<string> = new Set();
    const prethodnik: Map<string, string | null> = new Map();

    posjeceno.add(pocetakKljuc);
    prethodnik.set(pocetakKljuc, null);

    while (red.length > 0) {
      const trenutni = red.shift()!;
      if (trenutni === ciljKljuc) {
        break;
      }

      const susjedi = this.listaSusjedstva.get(trenutni) || [];
      for (let susjed of susjedi) {
        if (!posjeceno.has(susjed)) {
          posjeceno.add(susjed);
          prethodnik.set(susjed, trenutni);
          red.push(susjed);
        }
      }
    }

    // Rekonstrukcija puta
    let trenutni: string | null = ciljKljuc;
    const nizKljucova: string[] = [];

    while (trenutni !== null) {
      nizKljucova.unshift(trenutni);
      trenutni = prethodnik.get(trenutni) || null;
    }

    if (nizKljucova[0] === pocetakKljuc) {
      // Konvertujemo string ključeve nazad u tačke
      this.put = nizKljucova.map(k => {
        const [x, y] = k.split(',').map(Number);
        return { x, y };
      });
      console.log('Put pronađen:', this.put);
    } else {
      console.log('Put nije pronađen.');
      this.put = [];
    }

    this.crtaj();
  }

  pronadjiPutDFS() {
    this.izgradiListuSusjedstva();

    const pocetakKljuc = `${this.pocetak.x},${this.pocetak.y}`;
    const ciljKljuc = `${this.cilj.x},${this.cilj.y}`;

    const stek: string[] = [pocetakKljuc];
    const posjeceno: Set<string> = new Set();
    const prethodnik: Map<string, string | null> = new Map();

    posjeceno.add(pocetakKljuc);
    prethodnik.set(pocetakKljuc, null);

    while (stek.length > 0) {
      const trenutni = stek.pop()!;
      if (trenutni === ciljKljuc) {
        break;
      }

      const susjedi = this.listaSusjedstva.get(trenutni) || [];
      for (let susjed of susjedi) {
        if (!posjeceno.has(susjed)) {
          posjeceno.add(susjed);
          prethodnik.set(susjed, trenutni);
          stek.push(susjed);
        }
      }
    }

    // Rekonstrukcija puta
    let trenutni: string | null = ciljKljuc;
    const nizKljucova: string[] = [];

    while (trenutni !== null) {
      nizKljucova.unshift(trenutni);
      trenutni = prethodnik.get(trenutni) || null;
    }

    if (nizKljucova[0] === pocetakKljuc) {
      // Konvertujemo string ključeve nazad u tačke
      this.put = nizKljucova.map(k => {
        const [x, y] = k.split(',').map(Number);
        return { x, y };
      });
      console.log('Put pronađen:', this.put);
    } else {
      console.log('Put nije pronađen.');
      this.put = [];
    }

    this.crtaj();
  }


  crtaj() {
    // Očisti platno
    this.kontekst.clearRect(0, 0, this.platno.nativeElement.width, this.platno.nativeElement.height);

    // Nacrtaj prepreke
    this.kontekst.fillStyle = 'lightgray';
    this.prepreke.forEach(prepreka => {
      this.kontekst.beginPath();
      prepreka.forEach((tacka, indeks) => {
        if (indeks === 0) {
          this.kontekst.moveTo(tacka.x, tacka.y);
        } else {
          this.kontekst.lineTo(tacka.x, tacka.y);
        }
      });
      this.kontekst.closePath();
      this.kontekst.fill();
      this.kontekst.stroke();
    });

    // Nacrtaj graf vidljivosti
    this.kontekst.strokeStyle = 'rgba(0, 0, 255, 0.3)';
    this.grafVidljivosti.forEach(ivica => {
      this.kontekst.beginPath();
      this.kontekst.moveTo(ivica.od.x, ivica.od.y);
      this.kontekst.lineTo(ivica.do.x, ivica.do.y);
      this.kontekst.stroke();
    });

    // Nacrtaj put ako postoji
    if (this.put.length > 0) {
      this.kontekst.strokeStyle = 'red';
      this.kontekst.lineWidth = 3;
      this.kontekst.beginPath();
      this.kontekst.moveTo(this.put[0].x, this.put[0].y);
      this.put.forEach(tacka => {
        this.kontekst.lineTo(tacka.x, tacka.y);
      });
      this.kontekst.stroke();
      this.kontekst.lineWidth = 1; // reset linije
    }

    // Nacrtaj početnu i ciljnu tačku
    this.crtajTacku(this.pocetak, 'green');
    this.crtajTacku(this.cilj, 'red');
  }

  crtajTacku(t: Tacka, boja: string) {
    this.kontekst.fillStyle = boja;
    this.kontekst.beginPath();
    this.kontekst.arc(t.x, t.y, 5, 0, 2 * Math.PI);
    this.kontekst.fill();
  }

}