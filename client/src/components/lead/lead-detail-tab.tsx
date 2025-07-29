import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building, Mail, Phone, Calendar, Tag, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Lead, User as UserType, InsertLead } from "@shared/schema";

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function EditableField({ label, value, onSave, placeholder, type = "text" }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center space-x-2 mt-1">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div 
        className="flex items-center space-x-2 mt-1 p-2 rounded hover:bg-muted cursor-pointer group"
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{value || placeholder || 'Click to edit'}</span>
        <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

interface EditableSelectFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function EditableSelectField({ label, value, onSave, options, placeholder }: EditableSelectFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const currentOption = options.find(opt => opt.value === value);

  if (isEditing) {
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center space-x-2 mt-1">
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value || "none"}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div 
        className="flex items-center space-x-2 mt-1 p-2 rounded hover:bg-muted cursor-pointer group"
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{currentOption?.label || placeholder || 'Click to select'}</span>
        <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

interface LeadDetailTabProps {
  lead: Lead;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'qualified':
      return 'bg-green-100 text-green-800';
    case 'converted':
      return 'bg-purple-100 text-purple-800';
    case 'lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'website':
      return 'bg-blue-100 text-blue-800';
    case 'referral':
      return 'bg-green-100 text-green-800';
    case 'cold-call':
      return 'bg-orange-100 text-orange-800';
    case 'social-media':
      return 'bg-purple-100 text-purple-800';
    case 'email-campaign':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const sourceOptions = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "cold-call", label: "Cold Call" },
  { value: "social-media", label: "Social Media" },
  { value: "email-campaign", label: "Email Campaign" },
];

export default function LeadDetailTab({ lead }: LeadDetailTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertLead> }) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
        variant: "destructive",
      });
    },
  });

  const handleFieldUpdate = async (field: string, value: string) => {
    try {
      let processedValue: any = value;
      if (field === 'ownerId') {
        processedValue = value === '' || value === 'none' ? null : parseInt(value);
      } else if (field === 'phone' || field === 'company' || field === 'title' || field === 'source') {
        processedValue = value === '' ? null : value;
      }

      updateLeadMutation.mutate({
        id: lead.id,
        data: { [field]: processedValue }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <EditableField
                label="First Name"
                value={lead.firstName}
                onSave={(value) => handleFieldUpdate('firstName', value)}
                placeholder="Enter first name"
              />
              
              <EditableField
                label="Last Name"
                value={lead.lastName}
                onSave={(value) => handleFieldUpdate('lastName', value)}
                placeholder="Enter last name"
              />
              
              <EditableField
                label="Email"
                value={lead.email}
                onSave={(value) => handleFieldUpdate('email', value)}
                placeholder="Enter email address"
                type="email"
              />

              <EditableField
                label="Phone"
                value={lead.phone || ''}
                onSave={(value) => handleFieldUpdate('phone', value || null)}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>

            <div className="space-y-4">
              <EditableField
                label="Company"
                value={lead.company || ''}
                onSave={(value) => handleFieldUpdate('company', value || null)}
                placeholder="Enter company name"
              />

              <EditableField
                label="Title"
                value={lead.title || ''}
                onSave={(value) => handleFieldUpdate('title', value || null)}
                placeholder="Enter job title"
              />

              <EditableSelectField
                label="Owner"
                value={lead.ownerId?.toString() || 'none'}
                onSave={(value) => handleFieldUpdate('ownerId', value)}
                options={[
                  { value: 'none', label: 'No owner assigned' },
                  ...users.map(user => ({
                    value: user.id.toString(),
                    label: `${user.firstName} ${user.lastName}`
                  }))
                ]}
                placeholder="Select owner"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Status & Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Lead Status & Source</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableSelectField
              label="Status"
              value={lead.status}
              onSave={(value) => handleFieldUpdate('status', value)}
              options={statusOptions}
              placeholder="Select status"
            />
            
            <EditableSelectField
              label="Source"
              value={lead.source || 'none'}
              onSave={(value) => handleFieldUpdate('source', value === 'none' ? null : value)}
              options={[
                { value: 'none', label: 'No source selected' },
                ...sourceOptions
              ]}
              placeholder="Select source"
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Created on {format(new Date(lead.createdAt), 'PPP p')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}