import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditableFieldProps {
  label: string;
  value: string | number | null | undefined;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  type?: "text" | "number" | "email" | "tel" | "url" | "textarea" | "select";
  options?: { value: string; label: string }[];
  className?: string;
  displayValue?: string; // For custom display formatting
}

export function EditableField({ 
  label, 
  value, 
  onSave, 
  placeholder,
  type = "text",
  options = [],
  className = "",
  displayValue
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ""));
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (editValue === String(value || "")) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      toast({
        title: "Updated",
        description: `${label} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Failed to update field:', error);
      toast({
        title: "Error",
        description: `Failed to update ${label}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value || ""));
    setIsEditing(false);
  };

  const renderEditInput = () => {
    const commonProps = {
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditValue(e.target.value),
      placeholder,
      disabled: isLoading,
      className: "text-base",
      autoFocus: true,
    };

    switch (type) {
      case "textarea":
        return <Textarea {...commonProps} rows={3} />;
      case "select":
        return (
          <Select value={editValue} onValueChange={setEditValue} disabled={isLoading}>
            <SelectTrigger className="text-base">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value || "undefined"}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return <Input {...commonProps} type={type} />;
    }
  };

  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      {isEditing ? (
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            {renderEditInput()}
          </div>
          <div className="flex space-x-1 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between group min-h-[2.5rem]">
          <div className="flex-1">
            <p className="text-base">
              {displayValue || value || placeholder || 'Not provided'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditValue(String(value || ""));
              setIsEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Specialized variant for currency fields
export function EditableCurrencyField({ 
  label, 
  value, 
  onSave, 
  placeholder = "0.00",
  className = ""
}: Omit<EditableFieldProps, 'type' | 'displayValue'>) {
  const displayValue = value ? `$${parseFloat(String(value)).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : undefined;
  
  return (
    <EditableField
      label={label}
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      type="number"
      displayValue={displayValue}
      className={className}
    />
  );
}

// Specialized variant for percentage fields
export function EditablePercentageField({ 
  label, 
  value, 
  onSave, 
  placeholder = "0",
  className = ""
}: Omit<EditableFieldProps, 'type' | 'displayValue'>) {
  const displayValue = value ? `${value}%` : undefined;
  
  return (
    <EditableField
      label={label}
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      type="number"
      displayValue={displayValue}
      className={className}
    />
  );
}

// Specialized variant for date fields
export function EditableDateField({ 
  label, 
  value, 
  onSave, 
  placeholder = "Select date",
  className = ""
}: Omit<EditableFieldProps, 'type' | 'displayValue'>) {
  const displayValue = value ? new Date(String(value)).toLocaleDateString() : undefined;
  
  return (
    <EditableField
      label={label}
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      type="text"
      displayValue={displayValue}
      className={className}
    />
  );
}