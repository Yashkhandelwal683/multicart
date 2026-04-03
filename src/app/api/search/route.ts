import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Product from "@/models/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const shop = searchParams.get("shop"); 
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");

    
    const filter: any = {
      isActive: true,
      verificationStatus: "approved",
    };

    
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ];
    }

    
    if (category && category !== "all") {
      filter.category = category;
    }

    
    if (shop && shop !== "all") {
      filter.vendor = shop;
    }

    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    
    if (minRating) {
      filter["reviews.rating"] = { $gte: Number(minRating) };
    }

    
    const products = await Product.find(filter)
      .populate("vendor", "shopName image")
      .populate("reviews.user", "name image")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SEARCH API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
