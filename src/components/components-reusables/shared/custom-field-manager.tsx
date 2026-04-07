'use client';

import { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface CustomFieldManagerProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  translationKey: 'clients' | 'cases';
}

/**
 * CustomFieldManager — Gestor dinámico de campos para la columna 'metadata' (JSONB).
 * Permite al usuario añadir pares llave-valor personalizados que no están en el esquema fijo.
 */
export function CustomFieldManager({ value, onChange, translationKey }: CustomFieldManagerProps) {
  const t = useTranslations(`${translationKey}.custom_fields`);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addField = () => {
    if (!newKey.trim()) return;
    
    // Evitar duplicados
    const normalizedKey = newKey.trim();
    const updatedValue = { ...value, [normalizedKey]: newValue };
    
    onChange(updatedValue);
    setNewKey('');
    setNewValue('');
  };

  const removeField = (keyToRemove: string) => {
    const updatedValue = { ...value };
    delete updatedValue[keyToRemove];
    onChange(updatedValue);
  };

  const updateFieldValue = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Tag className="h-4 w-4" />
        <span>{t('title')}</span>
      </div>

      {/* Lista de campos existentes */}
      <div className="space-y-3">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="group relative flex items-end gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground/70">{key}</Label>
              <Input
                value={val}
                onChange={(e) => updateFieldValue(key, e.target.value)}
                placeholder={t('field_value')}
                className="h-9 focus-visible:ring-primary/30"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeField(key)}
              className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 opacity-40 transition-all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Input para añadir nuevo campo */}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">{t('field_name')}</Label>
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder={t('placeholder')}
            className="h-9"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">{t('field_value')}</Label>
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={t('field_value')}
            className="h-9"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
          />
        </div>
        <Button
          type="button"
          onClick={addField}
          disabled={!newKey.trim()}
          size="sm"
          className="h-9 shrink-0 px-3"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('add_field')}
        </Button>
      </div>
    </div>
  );
}
