import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product, InsertProduct } from "@shared/schema";

interface ProductModalProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    type: "onetime" | "subscription" | "service-based";
    category: string;
    sku: string;
    isActive: boolean;
  }>({
    name: "",
    description: "",
    price: "",
    type: "onetime",
    category: "",
    sku: "",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price.toString(),
        type: product.type as "onetime" | "subscription" | "service-based",
        category: product.category || "",
        sku: product.sku || "",
        isActive: product.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        type: "onetime",
        category: "",
        sku: "",
        isActive: true,
      });
    }
  }, [product, open]);

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: Partial<InsertProduct>) => {
      const response = await apiRequest("PATCH", `/api/products/${product!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    const productData: InsertProduct = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: price.toString(),
      type: formData.type,
      category: formData.category.trim() || null,
      sku: formData.sku.trim() || null,
      isActive: formData.isActive,
    };

    if (product) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Product SKU"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Product category"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Product Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: "onetime" | "subscription" | "service-based") => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onetime">One-time Purchase</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="service-based">Service-based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active Product</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
              {(createProductMutation.isPending || updateProductMutation.isPending) ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}