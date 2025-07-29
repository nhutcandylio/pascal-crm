import { useState } from "react";
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
import { ShoppingCart, Plus, Package, Minus, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { OpportunityWithRelations, Product } from "@shared/schema";
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
      items: [{ productId: 0, quantity: 1, costValue: "", proposalValue: "", startDate: "", endDate: "" }],
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
          const itemTotal = parseFloat(item.proposalValue) * item.quantity;
          totalAmount += itemTotal;
          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            costValue: item.costValue,
            proposalValue: item.proposalValue,
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
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities", opportunity.id, "with-relations"] });
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

  const handleCreateOrder = (data: any) => {
    createOrderMutation.mutate(data);
  };

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
                  total + (order.items?.reduce((itemTotal, item) => 
                    itemTotal + (parseFloat(item.unitPrice) * item.quantity), 0) || 0), 0)?.toLocaleString() || '0'}
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
            </CardTitle>
            <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
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
                          onClick={() => append({ productId: 0, quantity: 1, costValue: "", proposalValue: "", startDate: "", endDate: "" })}
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
                          
                          <div className="grid grid-cols-2 gap-4">
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
                        <h5 className="font-medium">Order Items</h5>
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
                              <div className="text-right">
                                <p className="font-semibold">${item.totalPrice}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Cost: </span>
                                <span>${item.costValue}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Proposal: </span>
                                <span>${item.proposalValue}</span>
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
                          </div>
                        ))}
                      </div>
                    </>
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
    </div>
  );
}