import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Edit2, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TopBar } from "@/components/layout/top-bar";
import { ProductModal } from "@/components/modals/product-modal";
import { apiRequest } from "@/lib/queryClient";
import type { Product, InsertProduct } from "@shared/schema";

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'onetime':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'subscription':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'service-based':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar title="Products" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Products" />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <Button 
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No products match your search criteria." : "Get started by adding your first product."}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => {
                      setEditingProduct(null);
                      setIsModalOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge className={getProductTypeColor(product.type)}>
                          {product.type === 'onetime' ? 'One-time' : 
                           product.type === 'subscription' ? 'Subscription' : 
                           'Service-based'}
                        </Badge>
                        {product.isActive && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      {product.sku && (
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Price</p>
                      <p className="text-lg font-semibold">{formatCurrency(parseFloat(product.price))}</p>
                    </div>
                    {product.category && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                        <p className="text-sm">{product.category}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                      <p className="text-sm">{new Date(product.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {product.description && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ProductModal
          product={editingProduct}
          open={isModalOpen}
          onOpenChange={(open: boolean) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingProduct(null);
            }
          }}
        />
      </div>
    </div>
  );
}