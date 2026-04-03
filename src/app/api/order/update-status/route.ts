import Order from "@/models/order.model"; 
import dbConnect from "@/lib/db"; 
import mongoose from "mongoose";
import nodemailer from "nodemailer";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "returned",
  "cancelled",
];

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { orderId, status } = body;

    
    if (!orderId || !status) {
      return Response.json(
        { message: "orderId and status are required" },
        { status: 400 },
      );
    }

    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return Response.json({ message: "Invalid Order ID" }, { status: 400 });
    }

    
    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json(
        { message: "Invalid status value" },
        { status: 400 },
      );
    }

    const order = await Order.findById(orderId)
      .populate("buyer", "email")
      .exec();

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    
    if (status === "delivered") {
      return Response.json(
        { message: "Delivery requires OTP verification" },
        { status: 400 },
      );
    }

    
    const statusFlow = [
      "pending",
      "confirmed",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];

    const currentIndex = statusFlow.indexOf(order.orderStatus || "pending");

    const newIndex = statusFlow.indexOf(status);

    if (newIndex < currentIndex) {
      return Response.json(
        { message: "Cannot move order backwards" },
        { status: 400 },
      );
    }

    if (status === "out_for_delivery") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      order.deliveryOtp = otp;
      order.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      console.log("OTP GENERATED:", otp);

      
      const userEmail = order.buyer?.email;

      console.log("Sending OTP to:", userEmail);

      if (!userEmail) {
        return Response.json(
          { message: "Buyer email not found" },
          { status: 400 },
        );
      }

      
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Delivery OTP",
        text: `Your delivery OTP is ${otp}`,
      });

      console.log("EMAIL SENT ✅");
    }

    
    if (status === "cancelled") {
      order.cancelledAt = new Date();
    }

    order.orderStatus = status;

    await order.save();

    return Response.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error: any) {
    console.error("UPDATE STATUS ERROR:", error);

    return Response.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
