  "use client";

  import { useEffect, useState } from "react";
  import Image from "next/image";
  import axios from "axios";
  import { useRouter } from "next/navigation";


  export default function UserCartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const getCart = async () => {
      try {
        const res = await axios.get("/api/cart/get");
        setCart(res.data.cart || []);
      } catch (error) {
        console.log("Cart fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      getCart();
    }, []);

    const handleRemoveFromCart = async (productId: string) => {
      setCart((prev) =>
        prev.filter((i) => i.product._id !== productId)
      );

      await axios.post("/api/cart/remove", { productId });
    };

    const handleUpdateQuantity = async (
      productId: string,
      quantity: number
    ) => {
      if (quantity < 1) return;

      await axios.post("/api/cart/update", {
        productId,
        quantity,
      });

      getCart();
    };

    // ✅ TOTALS
    const itemsTotal = cart.reduce(
      (sum, item) =>
        sum + item.product.price * item.quantity,
      0
    );

    const delivery = itemsTotal > 999 ? 0 : 50; // 🔥 smart delivery
    const service = 30;
    const grandTotal = itemsTotal + delivery + service;

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading cart...
        </div>
      );
    }

    return (
      <div className="relative min-h-screen text-white overflow-hidden bg-gradient-to-br from-[#020617] via-black to-[#020617]">

        {/* 🔥 PARTICLES BACKGROUND */}
        <div className="absolute inset-0 -z-10">
        </div>

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 -z-10 bg-black/40" />

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 p-6">

          {/* ⭐ LEFT — CART ITEMS */}
          <div className="md:col-span-2 space-y-5">

            {cart.length === 0 ? (
              <div className="text-center text-2xl font-bold mt-20">
                Cart is Empty 🛒
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product._id}
                  className="
                    bg-white/10
                    backdrop-blur-xl
                    border border-white/20
                    p-5
                    rounded-2xl
                    flex gap-5
                    items-center
                    hover:bg-white/15
                    transition
                  "
                >
                  <Image
                    src={item.product.image1}
                    alt={item.product.title}
                    width={110}
                    height={110}
                    className="rounded-xl"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {item.product.title}
                    </h3>

                    <p className="text-green-400 font-semibold mt-1">
                      ₹ {item.product.price}
                    </p>

                    {/* QUANTITY */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
                      >
                        -
                      </button>

                      <span className="font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        handleRemoveFromCart(
                          item.product._id
                        )
                      }
                      className="mt-3 text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  {/* ITEM TOTAL */}
                  <div className="text-xl font-bold">
                    ₹ {item.product.price * item.quantity}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ⭐ RIGHT — STICKY BILL */}
          {cart.length > 0 && (
            <div
              className="
                h-fit
                sticky
                top-8
                bg-white/10
                backdrop-blur-xl
                border border-white/20
                p-7
                rounded-2xl
                shadow-xl
              "
            >
              <h2 className="text-2xl font-bold mb-5">
                Order Summary
              </h2>

              <div className="flex justify-between mb-3">
                <span>Items Total</span>
                <span>₹ {itemsTotal}</span>
              </div>

              <div className="flex justify-between mb-3">
                <span>Delivery</span>
                <span>
                  {delivery === 0
                    ? "FREE 🎉"
                    : `₹ ${delivery}`}
                </span>
              </div>

              <div className="flex justify-between mb-4">
                <span>Service</span>
                <span>₹ {service}</span>
              </div>

              <div className="border-t border-white/20 pt-4 flex justify-between font-bold text-2xl">
                <span>Total</span>
                <span>₹ {grandTotal}</span>
              </div>

              {/* 🔥 CHECKOUT BUTTON */}
              <button
                onClick={() => router.push("/checkout")}
                className="
                  w-full
                  mt-6
                  bg-green-600
                  hover:bg-green-700
                  py-4
                  rounded-xl
                  font-bold
                  text-lg
                  transition
                  shadow-lg
                  hover:scale-[1.02]
                "
              >
                Proceed To Checkout →
              </button>

            </div>
          )}
        </div>
      </div>
    );
  }
