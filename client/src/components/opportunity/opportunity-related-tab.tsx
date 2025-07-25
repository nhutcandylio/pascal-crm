import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, ShoppingCart, DollarSign, Calendar, User, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { insertOrderSchema, insertOrderItemSchema, type OpportunityWithRelations, type InsertOrder, type InsertOrderItem, type Product } from "@shared/schema";
import { z } from "zod";

// Schema for creating order with items
const createOrderWithItemsSchema = z.object({
  status: z.string(),
  orderDate: z.string(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
  })).min(1, "At least one item is required"),
});

interface OpportunityRelatedTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityRelatedTab({ opportunity }: OpportunityRelatedTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  // Fetch products for order creation
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const orderForm = useForm({
    resolver: zodResolver(createOrderWithItemsSchema),
    defaultValues: {
      status: "draft",
      orderDate: new Date().toISOString().split('T')[0],
      items: [{ productId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: orderForm.control,
    name: "items"
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Calculate total amount from selected products
      let totalAmount = 0;
      const orderItems = [];

      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const itemTotal = parseFloat(product.price) * item.quantity;
          totalAmount += itemTotal;
          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: itemTotal.toFixed(2),
          });
        }
      }

      // Create the order first with proper data types
      const orderData = {
        opportunityId: opportunity.id,
        orderNumber: `ORD-${Date.now()}`,
        totalAmount: totalAmount.toFixed(2),
        status: data.status || "draft",
        orderDate: data.orderDate, // Send as string, backend will parse it
      };

      console.log("Sending order data:", orderData);

      const orderResponse = await apiRequest("POST", "/api/orders", orderData);
      const createdOrder = await orderResponse.json();

      // Create order items
      for (const item of orderItems) {
        const orderItemData = {
          orderId: createdOrder.id,
          ...item,
        };
        await apiRequest("POST", "/api/order-items", orderItemData);
      }

      return createdOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Success",
        description: "Order created successfully with products.",
      });
      orderForm.reset();
      setNewOrderOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrder = (data: any) => {
    createOrderMutation.mutate(data);
  };

  const calculateOrderTotal = () => {
    const items = orderForm.watch("items");
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return total + (parseFloat(product.price) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Orders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Orders ({opportunity.orders?.length || 0})</span>
            </CardTitle>
            <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
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
                        <FormLabel className="text-base font-medium">Order Items</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ productId: 0, quantity: 1 })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
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
                                        {product.name} - ${parseFloat(product.price).toFixed(2)}
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
                                <FormLabel>Qty</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Amount:</span>
                        <span className="text-lg font-semibold">
                          ${calculateOrderTotal().toFixed(2)}
                        </span>
                      </div>
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
          {opportunity.orders && opportunity.orders.length > 0 ? (
            <div className="space-y-4">
              {opportunity.orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">Order #{order.id}</h4>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Items:</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.product?.name || `Product ${item.productId}`}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {item.product?.type || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                ${parseFloat(item.unitPrice).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
              <p className="mb-4">This opportunity doesn't have any orders yet.</p>
              <Button onClick={() => setNewOrderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Related Summary</span>
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
                  total + (order.items?.reduce((itemTotal, item) => 
                    itemTotal + (parseFloat(item.unitPrice) * item.quantity), 0) || 0), 0)?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">Order Value</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <User className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{opportunity.stageLogs?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Stage Changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}