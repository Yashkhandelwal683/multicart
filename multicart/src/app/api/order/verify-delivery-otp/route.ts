  import { NextRequest, NextResponse } from "next/server";
  import connectDb from "@/lib/db";
  import Order from "@/models/order.model";
  import mongoose from "mongoose";

  export async function POST(req: NextRequest) {
    try {

      await connectDb();

      const { orderId, otp } = await req.json();

      // ✅ Validate
      if (!orderId || !otp) {
        return NextResponse.json(
          { message: "orderId and otp required" },
          { status: 400 }
        );
      }

      // ✅ Prevent Mongo crash
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return NextResponse.json(
          { message: "Invalid order id" },
          { status: 400 }
        );
      }

      const order = await Order.findById(orderId).exec();

      if (!order) {
        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 }
        );
      }

      // 🔥 DEBUG (see terminal once)
      console.log("Saved OTP:", order.deliveryOtp);
      console.log("Entered OTP:", otp);

      // ✅ Convert both to string (MOST COMMON BUG FIX)
      if (
        String(order.deliveryOtp) !== String(otp) ||
        !order.otpExpiresAt ||
        order.otpExpiresAt < new Date()
      ) {
        return NextResponse.json(
          { message: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      // ✅ MARK DELIVERED
      order.orderStatus = "delivered";

      // ⭐ BOOLEAN FIX (very important)
      order.isPaid = true;

      order.deliveryDate = new Date();

      // clear otp
      order.deliveryOtp = undefined;
      order.otpExpiresAt = undefined;

      await order.save();

      return NextResponse.json({
        success: true,
        message: "Order delivered successfully",
        order,
      });

    } catch (error: any) {

      console.error("VERIFY OTP ERROR:", error);

      return NextResponse.json(
        { message: error.message || "Failed to verify OTP" },
        { status: 500 }
      );
    }
  }
