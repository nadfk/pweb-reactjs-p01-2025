import React, { InputHTMLAttributes } from "react"; 

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  // Allow string or array of strings for Zod errors
  error?: string | string[]; 
  textarea?: boolean; 
  // FIX: Hanya mencakup input dan textarea, menghilangkan HTMLSelectElement.
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function Input({
  label,
  error,
  textarea = false,
  className = "",
  onChange,
  ...props
}: InputProps) {
  const commonClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const errorClasses = error ? "border-red-500" : "border-gray-300";

  // Display only the first error message if it's an array
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const inputProps = props as InputHTMLAttributes<HTMLInputElement>;
  const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>;

  return (
    <div>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          id={textareaProps.id || textareaProps.name}
          className={`${commonClasses} ${errorClasses} ${className}`}
          rows={textareaProps.rows || 4}
          {...textareaProps}
          // Type casting untuk memastikan kompatibilitas saat rendering textarea
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        />
      ) : (
        <input
          id={inputProps.id || inputProps.name}
          className={`${commonClasses} ${errorClasses} ${className}`}
          type={inputProps.type || "text"}
          {...inputProps}
          // Type casting untuk memastikan kompatibilitas saat rendering input
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        />
      )}
      {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
    </div>
  );
}