import { Extension } from '@tiptap/core';
import { NumerosALetras } from 'numero-a-letras';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    numberToWords: {
      /**
       * Convert selected number into legal currency text
       */
      convertNumberToWords: () => ReturnType;
    };
  }
}

export const NumberToWords = Extension.create({
  name: 'numberToWords',

  addCommands() {
    return {
      convertNumberToWords:
        () =>
        ({ editor, chain }) => {
          const { state } = editor;
          const { selection } = state;
          const { empty, from, to } = selection;

          if (empty) return false;

          const text = state.doc.textBetween(from, to, ' ');
          // Extraemos el número (puede contener comas o puntos)
          const cleanText = text.replace(/,/g, '').replace(/\$/g, '').trim();
          const numberValue = parseFloat(cleanText);

          if (isNaN(numberValue)) {
            // Si no es un número válido, no hacemos nada
            return false;
          }

          const formattedNumber = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(numberValue);

          const intPart = Math.floor(numberValue);
          const centPart = Math.round((numberValue - intPart) * 100);
          const centsFormat = `${centPart.toString().padStart(2, '0')}/100 M.N.`;
          
          // `NumerosALetras` typically just returns the word.
          const wordsOnly = NumerosALetras(intPart, {
            plural: 'PESOS',
            singular: 'PESO',
          });

          const result = `${formattedNumber} (${wordsOnly} ${centsFormat})`;

          return chain().focus().insertContent(result).run();
        },
    };
  },
});
