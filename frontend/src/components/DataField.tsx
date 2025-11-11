import React from 'react';

interface DataFieldProps {
  label?: string;
  value: string | number | null | undefined;
  fallback?: string;
  format?: (value: string | number) => string;
  className?: string;
  inline?: boolean;
}

export const DataField: React.FC<DataFieldProps> = ({
  label,
  value,
  fallback = 'N/A',
  format,
  className = '',
  inline = false,
}) => {
  const hasValue = value !== null && value !== undefined && value !== '';
  const displayValue = hasValue ? (format ? format(value) : String(value)) : fallback;
  
  const valueClasses = hasValue 
    ? 'text-foreground' 
    : 'text-muted-foreground italic';

  if (inline) {
    return (
      <span className={`${valueClasses} ${className}`}>
        {label && <span className="font-medium">{label}: </span>}
        {displayValue}
      </span>
    );
  }

  return (
    <div className={className}>
      {label && (
        <div className="text-sm font-medium text-muted-foreground mb-1">
          {label}
        </div>
      )}
      <div className={valueClasses}>
        {displayValue}
      </div>
    </div>
  );
};


export const TimeField: React.FC<{
  label?: string;
  minutes?: number;
  className?: string;
}> = ({ label, minutes, className }) => {
  const formatTime = (value: string | number): string => {
    const mins = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(mins)) return 'N/A';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <DataField
      label={label}
      value={minutes}
      format={formatTime}
      className={className}
    />
  );
};

export const RatingField: React.FC<{
  label?: string;
  rating?: number;
  className?: string;
}> = ({ label, rating, className }) => {
  const formatRating = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    const stars = '★'.repeat(Math.floor(numValue)) + '☆'.repeat(5 - Math.floor(numValue));
    return `${stars} (${numValue.toFixed(1)})`;
  };

  return (
    <DataField
      label={label}
      value={rating}
      format={formatRating}
      className={className}
    />
  );
};

export const NutrientField: React.FC<{
  label: string;
  value?: string | number;
  unit?: string;
  className?: string;
}> = ({ label, value, unit, className }) => {
  const formatNutrient = (val: string | number): string => {
    if (typeof val === 'number') {
      return unit ? `${val}${unit}` : String(val);
    }
    
    return String(val);
  };

  return (
    <DataField
      label={label}
      value={value}
      format={formatNutrient}
      className={className}
    />
  );
};