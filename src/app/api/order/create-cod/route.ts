  import { NextRequest, NextResponse } from "next/server";
  import connectDb from "@/lib/db";
  import { auth } from "@/auth";
  import Order from "@/models/order.model";
  import Product from "@/models/product.model";
  import User from "@/models/user.model";

  export async function POST(req: NextRequest) {
    try {
      await connectDb();

      // ✅ AUTH
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }

      const userId = session.user.id;

      // ✅ BODY
      const body = await req.json();

      const {
        items,
        address,
        deliveryCharge = 0,
        serviceCharge = 0,
      } = body;

      console.log("COD BODY:", body); // ⭐ DEBUG

      // ✅ VALIDATION
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { message: "Items are required" },
          { status: 400 }
        );
      }

      if (
        !address?.name ||
        !address?.phone ||
        !address?.address ||
        !address?.city ||
        !address?.pincode
      ) {
        return NextResponse.json(
          { message: "Complete address required" },
          { status: 400 }
        );
      }

      // ✅ LOAD USER
      const user: any = await User.findById(userId);

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      let orderProducts: any[] = [];
      let vendors = new Set();
      let productsTotal = 0;

      // ✅ LOOP PRODUCTS
      for (const item of items) {

        if (!item.productId || !item.quantity) {
          return NextResponse.json(
            { message: "productId and quantity required" },
            { status: 400 }
          );
        }

        const product: any = await Product.findById(item.productId);

        if (!product) {
          return NextResponse.json(
            { message: "Product not found" },
            { status: 404 }
          );
        }

        // ✅ STOCK
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { message: `Insufficient stock for ${product.title}` },
            { status: 400 }
          );
        }

        // ✅ COD SUPPORT
        if (!product.payOnDelivery) {
          return NextResponse.json(
            { message: `${product.title} does not support COD` },
            { status: 400 }
          );
        }

        orderProducts.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
        });

        vendors.add(product.vendor.toString());

        productsTotal += product.price * item.quantity;
      }

      // ⭐ NEVER TRUST FRONTEND AMOUNT
      const totalAmount =
        productsTotal + deliveryCharge + serviceCharge;

      // ✅ CREATE ORDER
      const order = await Order.create({
        buyer: userId,
        products: orderProducts,
        productVendor: Array.from(vendors),

        productsTotal,
        deliveryCharge,
        serviceCharge,
        totalAmount,

        paymentMethod: "cod",
        isPaid: false,
        orderStatus: "pending",
        returnedAmount: 0,

        address,
      });

      // ✅ REDUCE STOCK AFTER ORDER
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }

      // ✅ CLEAR CART
      user.cart = [];
      user.orders = user.orders || [];
      user.orders.push(order._id);

      await user.save();

      return NextResponse.json(
        {
          message: "✅ COD Order placed successfully",
          order,
        },
        { status: 201 }
      );

    } catch (error: any) {

      console.error("❌ COD ORDER ERROR:", error);

      return NextResponse.json(
        {
          message:
            error?.message || "Internal Server Error",
        },
        { status: 500 }
      );
    }
  }
