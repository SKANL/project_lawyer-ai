import { Extension } from '@tiptap/core';

export interface LegalDateOptions {
  /** Locale ('es' o 'en') */
  locale: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    legalDate: {
      /**
       * Inserts the current date in legal format
       */
      insertLegalDate: () => ReturnType;
    };
  }
}

export const LegalDate = Extension.create<LegalDateOptions>({
  name: 'legalDate',

  addOptions() {
    return {
      locale: 'es',
    };
  },

  addCommands() {
    return {
      insertLegalDate:
        () =>
        ({ chain }) => {
          const now = new Date();
          let dateStr = '';

          if (this.options.locale === 'es') {
            const formatterOptions = { day: 'numeric', month: 'long', year: 'numeric' } as const;
            // "6 de abril de 2026"
            dateStr = now.toLocaleDateString('es-MX', formatterOptions);
          } else {
            const formatterOptions = { year: 'numeric', month: 'long', day: 'numeric' } as const;
            dateStr = now.toLocaleDateString('en-US', formatterOptions);
          }

          return chain().focus().insertContent(dateStr).run();
        },
    };
  },
});
