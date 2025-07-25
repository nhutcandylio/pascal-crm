import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, ShoppingCart, DollarSign, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { insertOrderSchema, insertOrderItemSchema, type OpportunityWithRelations, type InsertOrder, type InsertOrderItem } from "@shared/schema";

interface OpportunityRelatedTabProps {
  opportunity: OpportunityWithRelations;
}

export default function OpportunityRelatedTab({ opportunity }: OpportunityRelatedTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const orderForm = useForm({
    resolver: zodResolver(insertOrderSchema.extend({
      orderNumber: insertOrderSchema.shape.orderNumber.optional(),
      totalAmount: insertOrderSchema.shape.totalAmount.optional(),
    })),
    defaultValues: {
      opportunityId: opportunity.id,
      status: "draft",
      orderDate: new Date().toISOString().split('T')[0],
      orderNumber: `ORD-${Date.now()}`, // Auto-generate order number
      totalAmount: "0.00", // Will be calculated from items
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
      toast({
        title: "Success",
        description: "Order created successfully.",
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
    createOrderMutation.mutate({
      ...data,
      opportunityId: opportunity.id,
      orderDate: new Date(data.orderDate),
      orderNumber: `ORD-${Date.now()}`, // Auto-generate unique order number
      totalAmount: "0.00", // Initial amount, will be updated when items are added
    });
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
                  <form onSubmit={orderForm.handleSubmit(handleCreateOrder)} className="space-y-4">
                    <FormField
                      control={orderForm.control}
                      name="orderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Auto-generated" disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">
                      <p className="font-medium mb-1">Note:</p>
                      <p>This will create an empty order. You can add products to it after creation by managing order items.</p>
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