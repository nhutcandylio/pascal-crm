import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Package, Minus, Calendar, DollarSign, Edit2, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { OpportunityWithRelations, Product, Order, OrderItem } from "@shared/schema";
import { z } from "zod";

const createOrderWithItemsSchema = z.object({
  status: z.enum(["draft", "pending", "confirmed", "shipped", "delivered", "cancelled"]),
  orderDate: z.string(),
  items: z.array(
    z.object({
      productId: z.number().min(1, "Please select a product"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      costValue: z.string().min(1, "Cost value is required"),
      proposalValue: z.string().min(1, "Proposal value is required"),
      discount: z.string().optional().default("0"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ).min(1, "At least one item is required"),
});

interface OpportunityOrdersTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityOrdersTab({ opportunity }: OpportunityOrdersTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if opportunity is closed (won or lost) - if so, make it read-only
  const isClosedOpportunity = opportunity.stage === 'closed-won' || opportunity.stage === 'closed-lost';
  
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [editingOrderItem, setEditingOrderItem] = useState<number | null>(null);
  const [addingProductToOrder, setAddingProductToOrder] = useState<number | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<number | null>(null);
  
  // Close dialogs if opportunity becomes closed
  useEffect(() => {
    if (isClosedOpportunity) {
      setNewOrderOpen(false);
      setEditingOrder(null);
      setEditingOrderItem(null);
      setAddingProductToOrder(null);
      setDeletingOrder(null);
    }
  }, [isClosedOpportunity]);

  // Fetch products for order creation
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const orderForm = useForm({
    resolver: zodResolver(createOrderWithItemsSchema),
    defaultValues: {
      status: "draft",
      orderDate: new Date().toISOString().split('T')[0],
      items: [{ productId: 0, quantity: 1, costValue: "", proposalValue: "", discount: "0", startDate: "", endDate: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: orderForm.control,
    name: "items"
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Calculate total amount from selected products
      // For subscription products: use totalCost, for others: use proposalValue * quantity
      let totalAmount = 0;
      const orderItems = [];

      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          let itemTotal;
          if (product.type === 'subscription' && item.startDate && item.endDate) {
            // For subscription: calculate totalCost (cost * quantity * months * discount)
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            const months = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))); // Average days per month
            const discountMultiplier = 1 - (parseFloat(item.discount || "0") / 100);
            itemTotal = parseFloat(item.costValue) * item.quantity * months * discountMultiplier;
          } else {
            // For non-subscription: use proposalValue * quantity * discount
            const discountMultiplier = 1 - (parseFloat(item.discount || "0") / 100);
            itemTotal = parseFloat(item.proposalValue) * item.quantity * discountMultiplier;
          }
          
          totalAmount += itemTotal;
          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            costValue: item.costValue,
            proposalValue: item.proposalValue,
            discount: item.discount || "0",
            unitPrice: item.proposalValue,
            totalPrice: itemTotal.toFixed(2),
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
          });
        }
      }

      const orderData = {
        opportunityId: opportunity.id,
        orderNumber: `ORD-${Date.now()}`,
        totalAmount: totalAmount.toFixed(2),
        status: data.status,
        orderDate: data.orderDate,
      };

      console.log("Sending order data:", orderData);

      const response = await apiRequest("POST", "/api/orders", orderData);
      const order = await response.json();

      // Add items to the order
      for (const item of orderItems) {
        await apiRequest("POST", "/api/order-items", {
          orderId: order.id,
          ...item,
        });
      }

      return order;
    },
    onSuccess: () => {
      // Invalidate all related queries to update metrics and lists
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities/with-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Order created successfully.",
      });
      setNewOrderOpen(false);
      orderForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order.",
        variant: "destructive",
      });
    },
  });

  // Protection function for closed opportunities
  const preventClosedOpportunityAction = (actionName: string) => {
    if (isClosedOpportunity) {
      toast({
        title: "Cannot Edit",
        description: `Cannot ${actionName} for closed opportunities.`,
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  const handleCreateOrder = (data: any) => {
    if (preventClosedOpportunityAction("create orders")) return;
    createOrderMutation.mutate(data);
  };

  const handleNewOrderClick = () => {
    if (preventClosedOpportunityAction("create orders")) return;
    setNewOrderOpen(true);
  };

  const handleEditOrder = (orderId: number) => {
    if (preventClosedOpportunityAction("edit orders")) return;
    setEditingOrder(orderId);
  };

  const handleEditOrderItem = (itemId: number) => {
    if (preventClosedOpportunityAction("edit order items")) return;
    setEditingOrderItem(itemId);
  };

  const handleAddProductToOrder = (orderId: number) => {
    if (preventClosedOpportunityAction("add products to orders")) return;
    setAddingProductToOrder(orderId);
  };

  const handleDeleteOrder = (orderId: number) => {
    if (preventClosedOpportunityAction("delete orders")) return;
    setDeletingOrder(orderId);
  };

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to update metrics and lists
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities/with-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
      setEditingOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  // Update order item mutation
  const updateOrderItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/order-items/${itemId}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to update metrics and lists
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities/with-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Order item updated successfully.",
      });
      setEditingOrderItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order item.",
        variant: "destructive",
      });
    },
  });

  // Add product to existing order mutation
  const addProductToOrderMutation = useMutation({
    mutationFn: async ({ orderId, productData }: { orderId: number; productData: any }) => {
      const response = await apiRequest("POST", "/api/order-items", {
        orderId,
        ...productData,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to update metrics and lists
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities/with-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Product added to order successfully.",
      });
      setAddingProductToOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to order.",
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to update metrics and lists
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities/with-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Order deleted successfully.",
      });
      setDeletingOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order.",
        variant: "destructive",
      });
    },
  });

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Orders Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{opportunity.orders?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">
                {opportunity.orders?.reduce((total, order) => 
                  total + (order.items?.length || 0), 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                ${opportunity.orders?.reduce((total, order) => 
                  total + (order.items?.reduce((itemTotal, item) => {
                    // For subscription products, use totalCost; for others, use totalProposal or calculated value
                    if (item.product?.type === 'subscription') {
                      return itemTotal + (parseFloat(item.totalCost || '0'));
                    } else {
                      return itemTotal + (parseFloat(item.totalProposal || '0') || (parseFloat(item.unitPrice) * item.quantity));
                    }
                  }, 0) || 0), 0)?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">Order Value</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">
                {opportunity.orders?.filter(order => order.status === 'delivered').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Orders ({opportunity.orders?.length || 0})</span>
              {isClosedOpportunity && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full ml-2">
                  Read-Only
                </span>
              )}
            </CardTitle>
            <Dialog open={newOrderOpen && !isClosedOpportunity} onOpenChange={setNewOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={isClosedOpportunity} onClick={handleNewOrderClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                  <DialogDescription>
                    Create a new order for this opportunity.
                  </DialogDescription>
                </DialogHeader>
                <Form {...orderForm}>
                  <form onSubmit={orderForm.handleSubmit(handleCreateOrder)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orderForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orderForm.control}
                        name="orderDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Order Items</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ productId: 0, quantity: 1, costValue: "", proposalValue: "", discount: "0", startDate: "", endDate: "" })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      {fields.map((field, index) => {
                        const selectedProduct = products.find(p => p.id === orderForm.watch(`items.${index}.productId`));
                        return (
                        <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                          <div className="flex items-end space-x-4">
                            <FormField
                              control={orderForm.control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Product</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={orderForm.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="w-24">
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                                className="mb-2"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={orderForm.control}
                              name={`items.${index}.costValue`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cost Value</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={orderForm.control}
                              name={`items.${index}.proposalValue`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Proposal Value</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={orderForm.control}
                              name={`items.${index}.discount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Discount (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      placeholder="0.00"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {selectedProduct?.type === "subscription" && (
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={orderForm.control}
                                name={`items.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={orderForm.control}
                                name={`items.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewOrderOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createOrderMutation.isPending}
                      >
                        {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show read-only warning for closed opportunities */}
          {isClosedOpportunity && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Read-Only Mode:</span> Orders cannot be modified for closed opportunities.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {opportunity.orders && opportunity.orders.length > 0 ? (
            <div className="space-y-4">
              {opportunity.orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">Order #{order.id}</h4>
                      {editingOrder === order.id && !isClosedOpportunity ? (
                        <div className="flex items-center space-x-2">
                          <Select 
                            defaultValue={order.status}
                            onValueChange={(status) => updateOrderStatusMutation.mutate({ orderId: order.id, status })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingOrder(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {!isClosedOpportunity && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingOrder(order.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</span>
                      </div>
                      {!isClosedOpportunity && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingOrder(order.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                      <p className="font-mono text-sm">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">${parseFloat(order.totalAmount).toLocaleString()}</p>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Order Items</h5>
                          {!isClosedOpportunity && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAddingProductToOrder(order.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Product
                            </Button>
                          )}
                        </div>
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="py-2 px-3 bg-muted/50 rounded space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{item.product?.name || `Product #${item.productId}`}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <p className="font-semibold">${item.totalPrice}</p>
                                </div>
                                {!isClosedOpportunity && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingOrderItem(item.id)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {editingOrderItem === item.id && !isClosedOpportunity ? (
                              <EditOrderItemForm 
                                item={item}
                                products={products}
                                onSave={(data) => updateOrderItemMutation.mutate({ itemId: item.id, data })}
                                onCancel={() => setEditingOrderItem(null)}
                                isLoading={updateOrderItemMutation.isPending}
                              />
                            ) : (
                              <>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Cost: </span>
                                    <span>${item.costValue}</span>
                                    {item.totalCost && (
                                      <span className="text-xs text-green-600 block">
                                        Total: ${item.totalCost}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Proposal: </span>
                                    <span>${item.proposalValue}</span>
                                    {item.totalProposal && (
                                      <span className="text-xs text-green-600 block">
                                        Total: ${item.totalProposal}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Discount: </span>
                                    <span>{item.discount || 0}%</span>
                                  </div>
                                </div>
                                {item.product?.type === "subscription" && (item.startDate || item.endDate) && (
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {item.startDate && (
                                      <div>
                                        <span className="text-muted-foreground">Start: </span>
                                        <span>{format(new Date(item.startDate), 'MMM dd, yyyy')}</span>
                                      </div>
                                    )}
                                    {item.endDate && (
                                      <div>
                                        <span className="text-muted-foreground">End: </span>
                                        <span>{format(new Date(item.endDate), 'MMM dd, yyyy')}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Add Product to Order Dialog */}
                  {addingProductToOrder === order.id && !isClosedOpportunity && (
                    <AddProductToOrderDialog
                      orderId={order.id}
                      products={products}
                      onAdd={(data) => addProductToOrderMutation.mutate({ orderId: order.id, productData: data })}
                      onCancel={() => setAddingProductToOrder(null)}
                      isLoading={addProductToOrderMutation.isPending}
                    />
                  )}

                  {(!order.items || order.items.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p>No items in this order</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Orders</h3>
              <p className="mb-4">
                {isClosedOpportunity 
                  ? "This opportunity doesn't have any orders." 
                  : "This opportunity doesn't have any orders yet."
                }
              </p>
              {!isClosedOpportunity && (
                <Button onClick={() => !isClosedOpportunity && setNewOrderOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Order
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Order Confirmation Dialog */}
      <AlertDialog open={deletingOrder !== null && !isClosedOpportunity} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone and will remove all order items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingOrder(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingOrder && deleteOrderMutation.mutate(deletingOrder)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Read-Only Warning for Closed Opportunities */}
      {isClosedOpportunity && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Orders are read-only for closed opportunities ({opportunity.stage})
            </p>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
            No changes can be made to orders, products, or pricing for opportunities that are marked as Closed Won or Closed Lost.
          </p>
        </div>
      )}
    </div>
  );
}

// Edit Order Item Form Component
interface EditOrderItemFormProps {
  item: OrderItem;
  products: Product[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditOrderItemForm({ item, products, onSave, onCancel, isLoading }: EditOrderItemFormProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [costValue, setCostValue] = useState(item.costValue);
  const [proposalValue, setProposalValue] = useState(item.proposalValue);
  const [discount, setDiscount] = useState(item.discount || "0");
  const [startDate, setStartDate] = useState(item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '');
  const [endDate, setEndDate] = useState(item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : '');

  const selectedProduct = products.find(p => p.id === item.productId);

  const handleSave = () => {
    const updatedData = {
      quantity,
      costValue,
      proposalValue,
      discount,
      unitPrice: proposalValue,
      totalPrice: (parseFloat(proposalValue) * quantity).toFixed(2),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
    onSave(updatedData);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Quantity</label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Discount (%)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Cost Value</label>
          <Input
            type="number"
            step="0.01"
            value={costValue}
            onChange={(e) => setCostValue(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Proposal Value</label>
          <Input
            type="number"
            step="0.01"
            value={proposalValue}
            onChange={(e) => setProposalValue(e.target.value)}
          />
        </div>
      </div>
      
      {selectedProduct?.type === "subscription" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

// Add Product to Order Dialog Component
interface AddProductToOrderDialogProps {
  orderId: number;
  products: Product[];
  onAdd: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AddProductToOrderDialog({ orderId, products, onAdd, onCancel, isLoading }: AddProductToOrderDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [costValue, setCostValue] = useState('');
  const [proposalValue, setProposalValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleAdd = () => {
    if (!selectedProductId || !costValue || !proposalValue) return;
    
    const productData = {
      productId: selectedProductId,
      quantity,
      costValue,
      proposalValue,
      unitPrice: proposalValue,
      totalPrice: (parseFloat(proposalValue) * quantity).toFixed(2),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
    onAdd(productData);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product to Order</DialogTitle>
          <DialogDescription>
            Add a new product to this order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Product</label>
            <Select onValueChange={(value) => setSelectedProductId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Value</label>
              <Input
                type="number"
                step="0.01"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Proposal Value</label>
              <Input
                type="number"
                step="0.01"
                value={proposalValue}
                onChange={(e) => setProposalValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          {selectedProduct?.type === "subscription" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={isLoading || !selectedProductId || !costValue || !proposalValue}
          >
            {isLoading ? "Adding..." : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}