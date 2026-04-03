  import { NextRequest, NextResponse } from "next/server";
  import connectDb from "@/lib/db";
  import { auth } from "@/auth";
  import Product from "@/models/product.model";
  import Stripe from "stripe";

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  export async function POST(req: NextRequest) {
    try {
      await connectDb();

      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }

      const { items, address, deliveryCharge = 0, serviceCharge = 0 } =
        await req.json();

      if (!items || items.length === 0) {
        return NextResponse.json(
          { message: "Items required" },
          { status: 400 }
        );
      }

      const line_items = [];
      let productsTotal = 0;

      
      for (const item of items) {

        const product: any = await Product.findById(item.productId);

        if (!product) {
          return NextResponse.json(
            { message: "Product not found" },
            { status: 404 }
          );
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { message: `Stock issue for ${product.title}` },
            { status: 400 }
          );
        }

        line_items.push({
          price_data: {
            currency: "inr",
            product_data: {
              name: product.title,
              images: [product.image1],
            },
            unit_amount: product.price * 100,
          },
          quantity: item.quantity,
        });

        productsTotal += product.price * item.quantity;
      }

      const totalAmount =
        productsTotal + deliveryCharge + serviceCharge;

      
      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: ["card"],

        success_url: `${process.env.NEXT_BASE_URL}/order-success`,

        cancel_url: `${process.env.NEXT_BASE_URL}/cart`,

        line_items,

        metadata: {
          userId: session.user.id,
          items: JSON.stringify(items),
          address: JSON.stringify(address),
          deliveryCharge: deliveryCharge.toString(),
          serviceCharge: serviceCharge.toString(),
          totalAmount: totalAmount.toString(),
        },
      });

      return NextResponse.json(
        { url: stripeSession.url },
        { status: 200 }
      );

    } catch (error: any) {

      console.error("❌ STRIPE ERROR:", error);

      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
  }
