declare module 'numero-a-letras' {
  export interface NumeroALetrasOptions {
    plural?: string;
    singular?: string;
    centPlural?: string;
    centSingular?: string;
  }
  export function NumerosALetras(monto: number, config?: NumeroALetrasOptions): string;
}
