// Tamaño de lote de la generación de captions.
// MEDIDO (20 jul) contra la API real: 4 piezas ≈ 28s por llamada; el peor lote
// de 5 fue 34.6s. El límite de la función es 60s (maxDuration, tope de Hobby).
// No subirlo sin volver a medir: en 18 piezas de un tiro son 101.6s y la
// función muere en silencio.
export const LOTE_CAPTIONS = 4;
