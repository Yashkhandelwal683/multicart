import mongoose from "mongoose";
import { IProduct } from "./product.model";

 export interface IUser {
  _id?: mongoose.Types.ObjectId;

  name: string;
  email: string;
  password?: string;
  image?: string;

  role: "user" | "vendor" | "admin";
  phone?: string;

  
  shopName?: string;
  businessAddress?: string;
  gstNumber?: string;

  isApproved?: boolean;

  verificationStatus?: "pending" | "approved" | "rejected";
  requestedAt?: Date;
  approvedAt?: Date;
  rejectedReason?: string;

  
  vendorProducts?: IProduct[]; 
  orders?: mongoose.Types.ObjectId[];         

  
  cart?: {
    product: mongoose.Types.ObjectId;
    quantity: number;
  }[];

   chats?: {
    with: mongoose.Types.ObjectId; 
    messages: {
      sender: mongoose.Types.ObjectId; 
      text: string;
      createdAt: Date;
    }[];
  }[];



  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String },

    image: { type: String },

    phone: { type: String },

    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },

    
    shopName: { type: String },
    businessAddress: { type: String },
    gstNumber: { type: String },

    isApproved: { type: Boolean, default: false },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    requestedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedReason: { type: String },

    
    vendorProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: { type: Number, default: 1 },
      },
    ],

      chats: [
      {
        with: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        messages: [
          {
            sender: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },

            text: {
              type: String,
              required: true,
            },

            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const User =
  mongoose.models?.User || mongoose.model<IUser>("User", userSchema);

export default User;
