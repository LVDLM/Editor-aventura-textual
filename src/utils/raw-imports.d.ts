// Permite importar archivos como texto con el sufijo `?raw` (lo resuelve Vite).
declare module '*?raw' {
  const content: string;
  export default content;
}
