import { forwardRef, useId } from 'react';

const inputBase =
  'block w-full rounded-lg border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors disabled:bg-ink-50 disabled:text-ink-500';
const inputState = (error) => (error ? 'border-danger-600' : 'border-ink-300 hover:border-ink-400');

export function Field({ id, label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
          {required && <span className="text-danger-600" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger-700">{error}</p>}
    </div>
  );
}

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export const TextField = forwardRef(function TextField({ label, error, hint, required, className = '', id: idProp, ...rest }, ref) {
  const gen = useId();
  const id = idProp || gen;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input ref={ref} id={id} required={required && undefined} aria-required={required || undefined} aria-invalid={!!error || undefined} aria-describedby={describedBy(id, error, hint)} className={`${inputBase} h-10 ${inputState(error)}`} {...rest} />
    </Field>
  );
});

export const SelectField = forwardRef(function SelectField({ label, error, hint, required, className = '', id: idProp, children, ...rest }, ref) {
  const gen = useId();
  const id = idProp || gen;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <select ref={ref} id={id} aria-invalid={!!error || undefined} aria-describedby={describedBy(id, error, hint)} className={`${inputBase} h-10 pr-8 ${inputState(error)}`} {...rest}>
        {children}
      </select>
    </Field>
  );
});

export const TextAreaField = forwardRef(function TextAreaField({ label, error, hint, required, className = '', id: idProp, rows = 4, ...rest }, ref) {
  const gen = useId();
  const id = idProp || gen;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea ref={ref} id={id} rows={rows} aria-invalid={!!error || undefined} aria-describedby={describedBy(id, error, hint)} className={`${inputBase} py-2 ${inputState(error)}`} {...rest} />
    </Field>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, error, className = '', id: idProp, ...rest }, ref) {
  const gen = useId();
  const id = idProp || gen;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
        <input ref={ref} id={id} type="checkbox" aria-invalid={!!error || undefined} className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 accent-brand-600" {...rest} />
        <span>{label}</span>
      </label>
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-danger-700">{error}</p>}
    </div>
  );
});
