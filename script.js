// -- Datum i zalijevanje --

function dajDanas() {
  return new Date().toISOString().split('T')[0];
}

function danaProslo(datum) {
  var d1 = new Date(datum);
  var d2 = new Date();
  d1.setHours(0,0,0,0);
  d2.setHours(0,0,0,0);
  return Math.round((d2 - d1) / 86400000);
}

function danaPreostalo(biljka) {
  return biljka.intervalZalijevanja - danaProslo(biljka.zadnjeZalijevanje);
}

function statusZalijevanja(biljka) {
  var d = danaPreostalo(biljka);
  if (d < 0)  return { klasa: 'z-treba',  tekst: 'Treba zaliti (' + Math.abs(d) + ' dana kasno)' };
  if (d === 0) return { klasa: 'z-treba',  tekst: 'Treba zaliti danas' };
  if (d <= 2)  return { klasa: 'z-uskoro', tekst: 'Zaliti za ' + d + ' dana' };
  return       { klasa: 'z-ok',    tekst: 'Sljedeće za ' + d + ' dana' };
}

function nazivVrste(id) {
  var nazivi = { sobne: 'Sobne biljke', kaktusi: 'Kaktusi', zacinske: 'Začinske', jednogodisnje: 'Jednogodišnje', visegodisnje: 'Višegodišnje' };
  return nazivi[id] || id;
}

function formatirajDatum(datum) {
  if (!datum) return '—';
  return new Date(datum).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// -- Pohrana --

function ucitajBiljkeIzMemorije() {
  var podatci = localStorage.getItem('biljke');
  return podatci ? JSON.parse(podatci) : null;
}

function spremiUMemoriju(biljke) {
  localStorage.setItem('biljke', JSON.stringify(biljke));
}

async function dohvatiBiljke() {
  var biljke = ucitajBiljkeIzMemorije();
  if (!biljke) {
    var odgovor = await fetch('biljke.json');
    biljke = await odgovor.json();
    spremiUMemoriju(biljke);
  }
  return biljke;
}

// -- Prikaz kartica --

function napraviKarticu(b) {
  var s = statusZalijevanja(b);
  var pozicija = b.vrstaId === 'kaktusi' ? 'center center' : 'center top';
  var html = '<div class="card" id="card-' + b.id + '">';

  if (b.fotografija) {
    html += '<img class="card-img" src="' + b.fotografija + '" alt="' + b.naziv + '" loading="lazy" style="object-position:' + pozicija + '">';
  }

  html += '<div class="card-body">';
  html += '<div class="card-naziv">' + b.naziv + '</div>';
  html += '<span class="tag">' + nazivVrste(b.vrstaId) + '</span><br>';
  html += '<span class="z-badge ' + s.klasa + '">' + s.tekst + '</span>';
  html += '<div class="detalji">';
  if (b.latinskiNaziv) html += '<div class="detalj"><span class="detalj-k">Latinski naziv</span><span>' + b.latinskiNaziv + '</span></div>';
  if (b.datumNabave)   html += '<div class="detalj"><span class="detalj-k">Datum nabave</span><span>' + formatirajDatum(b.datumNabave) + '</span></div>';
  if (b.prica)         html += '<div class="detalj"><span class="detalj-k">O biljci</span><span>' + b.prica + '</span></div>';
  if (b.biljeska)      html += '<div class="detalj"><span class="detalj-k">Bilješka o rastu</span><span>' + b.biljeska + '</span></div>';
  html += '<div class="detalj"><span class="detalj-k">Zalijevanje</span><span>svakih ' + b.intervalZalijevanja + ' dana</span></div>';
  html += '<div class="detalj"><span class="detalj-k">Zadnje zaliveno</span><span>' + formatirajDatum(b.zadnjeZalijevanje) + '</span></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;">';
  html += '<button class="btn-ghost" style="font-size:0.8rem;padding:6px 12px;" onclick="oznaciZaliveno(' + b.id + ')">Zalio/la sam</button>';
  html += '<button class="btn-ghost" style="font-size:0.8rem;padding:6px 12px;" onclick="otvoriUredi(' + b.id + ')">Uredi</button>';
  html += '<button class="btn-ghost" style="font-size:0.8rem;padding:6px 12px;color:#B84020;border-color:#F2BCAC;" onclick="obrisi(' + b.id + ')">Ukloni</button>';
  html += '</div></div></div>';
  return html;
}

function napraviFormuZaUredivanje(b) {
  var html = '<div class="card" id="card-' + b.id + '"><div class="card-body" style="padding:18px;">';
  html += '<div style="font-weight:700;color:var(--odyssey);margin-bottom:14px;">Uredi: ' + b.naziv + '</div>';
  html += '<div class="uredi-grid">';
  html += '<div class="fg"><label>Naziv</label><input type="text" id="e-naziv-' + b.id + '" value="' + b.naziv + '"></div>';
  html += '<div class="fg"><label>Latinski naziv</label><input type="text" id="e-lat-' + b.id + '" value="' + (b.latinskiNaziv || '') + '"></div>';
  html += '<div class="fg"><label>Vrsta</label><select id="e-vrsta-' + b.id + '">';
  html += '<option value="sobne"' + (b.vrstaId==='sobne'?' selected':'') + '>Sobne biljke</option>';
  html += '<option value="kaktusi"' + (b.vrstaId==='kaktusi'?' selected':'') + '>Kaktusi</option>';
  html += '<option value="zacinske"' + (b.vrstaId==='zacinske'?' selected':'') + '>Začinske biljke</option>';
  html += '<option value="jednogodisnje"' + (b.vrstaId==='jednogodisnje'?' selected':'') + '>Jednogodišnje</option>';
  html += '<option value="visegodisnje"' + (b.vrstaId==='visegodisnje'?' selected':'') + '>Višegodišnje</option>';
  html += '</select></div>';
  html += '<div class="fg"><label>Datum nabave</label><input type="date" id="e-datum-' + b.id + '" value="' + (b.datumNabave || '') + '"></div>';
  html += '<div class="fg"><label>Interval zalijevanja (dani)</label><input type="number" id="e-interval-' + b.id + '" value="' + b.intervalZalijevanja + '" min="1" max="60"></div>';
  html += '</div>';
  html += '<div class="fg" style="margin-bottom:10px;"><label>O biljci</label><textarea id="e-prica-' + b.id + '">' + (b.prica || '') + '</textarea></div>';
  html += '<div class="fg" style="margin-bottom:14px;"><label>Bilješka o rastu</label><textarea id="e-biljeska-' + b.id + '">' + (b.biljeska || '') + '</textarea></div>';
  html += '<div style="display:flex;gap:8px;">';
  html += '<button class="btn" onclick="spremiIzmjene(' + b.id + ')">Spremi</button>';
  html += '<button class="btn-ghost" onclick="zatvoriUredi(' + b.id + ')">Odustani</button>';
  html += '</div></div></div>';
  return html;
}

// -- Glavna stranica --

var trenutniFilter = 'sve';

async function ucitajBiljke() {
  var biljke = await dohvatiBiljke();

  document.getElementById('stat-ukupno').textContent = biljke.length;
  document.getElementById('stat-treba').textContent  = biljke.filter(function(b) { return danaPreostalo(b) <= 0; }).length;
  document.getElementById('stat-uskoro').textContent = biljke.filter(function(b) { var d = danaPreostalo(b); return d > 0 && d <= 2; }).length;

  var vrste = [];
  biljke.forEach(function(b) { if (vrste.indexOf(b.vrstaId) === -1) vrste.push(b.vrstaId); });

  var filterHtml = '<button class="fbtn ' + (trenutniFilter==='sve'?'on':'') + '" onclick="postaviFilter(\'sve\',this)">Sve</button>';
  filterHtml += '<button class="fbtn ' + (trenutniFilter==='treba'?'on':'') + '" onclick="postaviFilter(\'treba\',this)">Treba zaliti</button>';
  vrste.forEach(function(v) {
    filterHtml += '<button class="fbtn ' + (trenutniFilter===v?'on':'') + '" onclick="postaviFilter(\'' + v + '\',this)">' + nazivVrste(v) + '</button>';
  });
  document.getElementById('filters').innerHTML = filterHtml;

  prikaziGrid(biljke);
}

function prikaziGrid(biljke) {
  var grid = document.getElementById('grid');
  if (biljke.length === 0) { grid.innerHTML = '<div class="empty">Nema biljaka u ovoj kategoriji.</div>'; return; }
  var html = '';
  biljke.forEach(function(b) { html += napraviKarticu(b); });
  grid.innerHTML = html;
}

function postaviFilter(vrsta, gumb) {
  trenutniFilter = vrsta;
  document.querySelectorAll('.fbtn').forEach(function(b) { b.classList.remove('on'); });
  gumb.classList.add('on');

  var biljke = ucitajBiljkeIzMemorije() || [];
  if (vrsta === 'sve')        prikaziGrid(biljke);
  else if (vrsta === 'treba') prikaziGrid(biljke.filter(function(b) { return danaPreostalo(b) <= 0; }));
  else                        prikaziGrid(biljke.filter(function(b) { return b.vrstaId === vrsta; }));
}

function oznaciZaliveno(id) {
  var biljke = ucitajBiljkeIzMemorije() || [];
  for (var i = 0; i < biljke.length; i++) {
    if (biljke[i].id === id) { biljke[i].zadnjeZalijevanje = dajDanas(); break; }
  }
  spremiUMemoriju(biljke);
  ucitajBiljke();
}

function obrisi(id) {
  if (!confirm('Ukloniti biljku?')) return;
  spremiUMemoriju((ucitajBiljkeIzMemorije() || []).filter(function(b) { return b.id !== id; }));
  ucitajBiljke();
}

function otvoriUredi(id) {
  var biljke = ucitajBiljkeIzMemorije() || [];
  for (var i = 0; i < biljke.length; i++) {
    if (biljke[i].id === id) {
      document.getElementById('card-' + id).outerHTML = napraviFormuZaUredivanje(biljke[i]);
      break;
    }
  }
}

function zatvoriUredi(id) {
  var biljke = ucitajBiljkeIzMemorije() || [];
  for (var i = 0; i < biljke.length; i++) {
    if (biljke[i].id === id) {
      document.getElementById('card-' + id).outerHTML = napraviKarticu(biljke[i]);
      break;
    }
  }
}

function spremiIzmjene(id) {
  var biljke = ucitajBiljkeIzMemorije() || [];
  for (var i = 0; i < biljke.length; i++) {
    if (biljke[i].id === id) {
      biljke[i].naziv               = document.getElementById('e-naziv-' + id).value.trim();
      biljke[i].latinskiNaziv       = document.getElementById('e-lat-' + id).value.trim();
      biljke[i].vrstaId             = document.getElementById('e-vrsta-' + id).value;
      biljke[i].datumNabave         = document.getElementById('e-datum-' + id).value;
      biljke[i].intervalZalijevanja = parseInt(document.getElementById('e-interval-' + id).value) || 7;
      biljke[i].prica               = document.getElementById('e-prica-' + id).value.trim();
      biljke[i].biljeska            = document.getElementById('e-biljeska-' + id).value.trim();
      spremiUMemoriju(biljke);
      document.getElementById('card-' + id).outerHTML = napraviKarticu(biljke[i]);
      ucitajBiljke();
      break;
    }
  }
}

// -- Dodaj novu biljku --

function dodajNovuBiljku() {
  var naziv = document.getElementById('inp-naziv').value.trim();
  if (!naziv) { prikaziPoruku('err', 'Naziv je obavezan.'); return; }

  var fotoFajl = document.getElementById('inp-foto').files[0];

  function spremi(fotoData) {
    var biljke = ucitajBiljkeIzMemorije() || [];
    biljke.push({
      id: Date.now(),
      naziv:               naziv,
      latinskiNaziv:       document.getElementById('inp-lat').value.trim(),
      vrstaId:             document.getElementById('inp-vrsta').value,
      datumNabave:         document.getElementById('inp-datum').value || dajDanas(),
      prica:               document.getElementById('inp-prica').value.trim(),
      biljeska:            document.getElementById('inp-biljeska').value.trim(),
      fotografija:         fotoData || '',
      zadnjeZalijevanje:   dajDanas(),
      intervalZalijevanja: parseInt(document.getElementById('inp-interval').value) || 7
    });
    spremiUMemoriju(biljke);
    prikaziPoruku('ok', 'Biljka dodana!');
    setTimeout(function() { window.location.href = 'index.html'; }, 1000);
  }

  if (fotoFajl) {
    var citac = new FileReader();
    citac.onload = function(e) { spremi(e.target.result); };
    citac.readAsDataURL(fotoFajl);
  } else {
    spremi('');
  }
}

// -- Vrste iz XML-a --

async function ucitajVrste() {
  var grid = document.getElementById('vrste-grid');
  try {
    var odgovor = await fetch('vrste.xml');
    var tekst = await odgovor.text();
    var xml = new DOMParser().parseFromString(tekst, 'application/xml');

    if (xml.querySelector('parsererror')) throw new Error('Greška u XML-u');

    var html = '';
    xml.querySelectorAll('vrsta').forEach(function(vrsta) {
      var naziv  = vrsta.querySelector('naziv')?.textContent || '';
      var opis   = vrsta.querySelector('opis')?.textContent || '';
      var savjet = vrsta.querySelector('savjet')?.textContent || '';
      var uvjeti = vrsta.querySelector('uvjeti');

      html += '<div class="vrsta-card"><div class="vrsta-body">';
      html += '<div class="vrsta-naziv">' + naziv + '</div>';
      html += '<div class="vrsta-opis">' + opis + '</div>';
      html += '<div class="uvjeti">';
      if (uvjeti) {
        ['svjetlo','temperatura','vlaga','zalijevanje'].forEach(function(polje) {
          var vrijednost = uvjeti.querySelector(polje)?.textContent;
          if (vrijednost) {
            html += '<div class="uvjet"><span class="uvjet-k">' + polje.charAt(0).toUpperCase() + polje.slice(1) + '</span><span>' + vrijednost + '</span></div>';
          }
        });
      }
      html += '</div>';
      if (savjet) html += '<div class="savjet">' + savjet + '</div>';
      html += '</div></div>';
    });

    grid.innerHTML = html;
  } catch (e) {
    grid.innerHTML = '<div class="empty">Greška pri učitavanju XML-a.</div>';
  }
}

// -- Poruke --

function prikaziPoruku(tip, tekst) {
  var poruka = document.getElementById('alert');
  if (!poruka) return;
  poruka.className = 'alert ' + tip;
  poruka.textContent = tekst;
}