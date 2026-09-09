// Vizualizator de unde audio, pur decorativ (hero + finala). Inaltimile sunt
// generate determinist (nu Math.random) ca server si client sa produca
// exact acelasi rezultat — altfel React ar arunca eroare de hidratare la
// primul randare. Nu are nevoie de "use client": valorile nu se schimba
// niciodata dupa montare, deci ramane component de server, mai usor.
function inaltimePseudoRandom(index: number): number {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return 4 + frac * 44; // intre 4px si 48px
}

export function Wave({ bare = 70 }: { bare?: number }) {
  return (
    <div className="wave" aria-hidden="true">
      {Array.from({ length: bare }, (_, i) => (
        <i key={i} style={{ height: `${inaltimePseudoRandom(i)}px` }} />
      ))}
    </div>
  );
}
