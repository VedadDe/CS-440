import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';

interface Tacka {
  x: number;
  y: number;
}

interface Pravougaonik {
  // Pohrani gornji lijevi ugao i donji desni ugao
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-square-serach',
  templateUrl: './square-serach.component.html',
  styleUrls: ['./square-serach.component.scss']
})
export class SquareSerachComponent implements OnInit {
  @ViewChild('mojePlatno', { static: true }) 
  mojePlatno!: ElementRef<HTMLCanvasElement>;
  
  private kontekst!: CanvasRenderingContext2D;
  crtanjePravougaonika = false;
  pocetniX = 0;
  pocetniY = 0;

  // Uzorci tačaka
  tacke: Tacka[] = [];

  // Pravougaonik za pretragu
  pretrazniPravougaonik: Pravougaonik = { x1: 50, y1: 50, x2: 200, y2: 150 };

  // Sortirana lista tačaka po x koordinati za projekcijsku metodu
  tackeSortiranePoX: Tacka[] = [];

  // Broj tačaka unutar pravougaonika za prikaz
  naivneUnutrasnjeTacke: Tacka[] = [];
  projekcijskeUnutrasnjeTacke: Tacka[] = [];

  ngOnInit() {
    // 1) Generiši nasumične tačke
    this.tacke = this.generisiNasumicneTacke(300, 400, 400);

    // 2) Sortiraj tačke po x koordinati za projekcijsku metodu
    this.tackeSortiranePoX = [...this.tacke].sort((a, b) => a.x - b.x);

    // 3) Uzmi kontekst platna i nacrtaj
    this.kontekst = this.mojePlatno.nativeElement.getContext('2d')!;
    this.nacrtajSve();

    const platnoEl = this.mojePlatno.nativeElement;
    platnoEl.addEventListener('mousedown', (evt) => this.naKlik(evt));
    platnoEl.addEventListener('mousemove', (evt) => this.naPomeranjeMiša(evt));
    platnoEl.addEventListener('mouseup',   (evt) => this.naPustanjeMiša(evt));
  }

  naKlik(evt: MouseEvent) {
    this.crtanjePravougaonika = true;
    this.pocetniX = evt.offsetX;
    this.pocetniY = evt.offsetY;
  }

  naPomeranjeMiša(evt: MouseEvent) {
    if (!this.crtanjePravougaonika) return;
    
    const x2 = evt.offsetX;
    const y2 = evt.offsetY;

    this.pretrazniPravougaonik.x1 = Math.min(this.pocetniX, x2);
    this.pretrazniPravougaonik.y1 = Math.min(this.pocetniY, y2);
    this.pretrazniPravougaonik.x2 = Math.max(this.pocetniX, x2);
    this.pretrazniPravougaonik.y2 = Math.max(this.pocetniY, y2);

    this.nacrtajSve();
  }

  naPustanjeMiša(evt: MouseEvent) {
    this.crtanjePravougaonika = false;
  }

  generisiNasumicneTacke(n: number, sirina: number, visina: number): Tacka[] {
    const arr: Tacka[] = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x: Math.random() * sirina,
        y: Math.random() * visina
      });
    }
    return arr;
  }

  nacrtajSve() {
    const platno = this.mojePlatno.nativeElement;
    this.kontekst.clearRect(0, 0, platno.width, platno.height);

    this.kontekst.fillStyle = '#000000';
    for (const t of this.tacke) {
      this.kontekst.fillRect(t.x - 2, t.y - 2, 4, 4);
    }

    this.kontekst.strokeStyle = 'blue';
    this.kontekst.lineWidth = 2;
    this.kontekst.strokeRect(
      this.pretrazniPravougaonik.x1, 
      this.pretrazniPravougaonik.y1,
      this.pretrazniPravougaonik.x2 - this.pretrazniPravougaonik.x1,
      this.pretrazniPravougaonik.y2 - this.pretrazniPravougaonik.y1
    );
  }

  // ------------ 1) Naivni pristup ------------
  // O(n) za provjeru svake tačke da li je unutar pravougaonika
  naivnaPretraga() {
    const pravougaonik = this.pretrazniPravougaonik;
    this.naivneUnutrasnjeTacke = [];

    for (const t of this.tacke) {
      if (this.jeTackaUPravougaoniku(t, pravougaonik)) {
        this.naivneUnutrasnjeTacke.push(t);
      }
    }

    console.log('Naivna: broj tačaka unutar = ', this.naivneUnutrasnjeTacke.length);
    this.oznaciTacke(this.naivneUnutrasnjeTacke, 'red');
  }

  // ------------ 2) Projekcijska metoda ------------
  //  - Prvo radimo binarnu pretragu (ili ugrađeni .filter) na x koordinatama
  //  - Zatim brzu O(k) provjeru na y koordinatama
  //  - Ukupno vrijeme ~ O(k + log n)
  projekcijskaPretraga() {
    const pravougaonik = this.pretrazniPravougaonik;
    this.projekcijskeUnutrasnjeTacke = [];

    // Korak A: Pronađi sve tačke sa x koordinatama u [x1, x2] na efikasan način.
    // U stvarnom scenariju, koristili bismo binarnu pretragu za početne i završne indekse.
    // Za brzi prikaz možemo uraditi ručni pristup ili koristiti .filter.

    const lijeviIndeks = this.binarnaPretragaLijevo(this.tackeSortiranePoX, pravougaonik.x1);
    const desniIndeks = this.binarnaPretragaDesno(this.tackeSortiranePoX, pravougaonik.x2);
    const kandidati = this.tackeSortiranePoX.slice(lijeviIndeks, desniIndeks + 1);

    // Korak B: Među kandidatima provjeri y koordinate u [y1, y2]
    for (const t of kandidati) {
      if (t.y >= pravougaonik.y1 && t.y <= pravougaonik.y2) {
        this.projekcijskeUnutrasnjeTacke.push(t);
      }
    }

    console.log('Projekcija: broj tačaka unutar = ', this.projekcijskeUnutrasnjeTacke.length);
    this.oznaciTacke(this.projekcijskeUnutrasnjeTacke, 'green');
  }

  jeTackaUPravougaoniku(t: Tacka, pravougaonik: Pravougaonik): boolean {
    return (
      t.x >= pravougaonik.x1 &&
      t.x <= pravougaonik.x2 &&
      t.y >= pravougaonik.y1 &&
      t.y <= pravougaonik.y2
    );
  }

  oznaciTacke(tacke: Tacka[], boja: string) {
    this.nacrtajSve();

    this.kontekst.fillStyle = boja;
    for (const t of tacke) {
      this.kontekst.fillRect(t.x - 2, t.y - 2, 5, 5);
    }
  }

  binarnaPretragaLijevo(arr: Tacka[], xVrijednost: number): number {
    let lijevo = 0;
    let desno = arr.length - 1;
    while (lijevo < desno) {
      let sredina = Math.floor((lijevo + desno) / 2);
      if (arr[sredina].x < xVrijednost) {
        lijevo = sredina + 1;
      } else {
        desno = sredina;
      }
    }
    return lijevo;
  }

  binarnaPretragaDesno(arr: Tacka[], xVrijednost: number): number {
    let lijevo = 0;
    let desno = arr.length - 1;
    while (lijevo < desno) {
      let sredina = Math.floor((lijevo + desno + 1) / 2);
      if (arr[sredina].x > xVrijednost) {
        desno = sredina - 1;
      } else {
        lijevo = sredina;
      }
    }
    return lijevo;
  }
}