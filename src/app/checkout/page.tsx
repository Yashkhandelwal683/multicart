    "use client";

    import { useEffect, useState } from "react";
    import axios from "axios";
    import { useRouter } from "next/navigation";
    import { motion } from "framer-motion";
    import { FaStripe } from "react-icons/fa";

    export default function CheckoutPage() {
    const router = useRouter();

    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");

    const [paymentMode, setPaymentMode] =
        useState<"cod" | "stripe">("cod");

    
    useEffect(() => {
        const loadCart = async () => {
        const res = await axios.get("/api/cart/get");

        if (!res.data.cart?.length) {
            router.replace("/cart");
            return;
        }

        setCartItems(res.data.cart);

        
        const codAllowed = res.data.cart.every(
            (i: any) => i.product.payOnDelivery
        );

        if (!codAllowed) {
            setPaymentMode("stripe");
        }

        setLoading(false);
        };

        loadCart();
    }, [router]);

    
    const productsTotal = cartItems.reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0
    );

    const deliveryCharge = cartItems.some(
        (i) => !i.product.freeDelivery
    )
        ? 50
        : 0;

    const serviceCharge = 30;

    const finalTotal =
        productsTotal + deliveryCharge + serviceCharge;

    const codDisabled = cartItems.some(
        (i) => !i.product.payOnDelivery
    );

    
    const handlePlaceOrder = async () => {
        if (!name || !phone || !address || !city || !pincode) {
        alert("Please fill all fields");
        return;
        }

        const payload = {
        items: cartItems.map((i) => ({
            productId: i.product._id,
            quantity: i.quantity,
        })),
        address: { name, phone, address, city, pincode },
        deliveryCharge,
        serviceCharge,
        };

        try {
        
        if (paymentMode === "cod") {

            await axios.post("/api/order/create-cod", payload);

            router.replace("/orders");
        }

        
        else {

            const res = await axios.post(
            "/api/order/online-pay",
            payload
            );

            window.location.href = res.data.url;
        }

        } catch (err: any) {
        alert(err?.response?.data?.message || "Checkout failed");
        }
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            Loading checkout...
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12">
        
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-10"
        >

            {}
            <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">
                Delivery Address
            </h2>

            <input className="input" placeholder="Full Name"
                value={name}
                onChange={(e)=>setName(e.target.value)} />

            <input className="input" placeholder="Phone"
                value={phone}
                onChange={(e)=>setPhone(e.target.value)} />

            <textarea rows={3} className="input"
                placeholder="Address"
                value={address}
                onChange={(e)=>setAddress(e.target.value)} />

            <div className="grid grid-cols-2 gap-4">
                <input className="input" placeholder="City"
                value={city}
                onChange={(e)=>setCity(e.target.value)} />

                <input className="input" placeholder="Pincode"
                value={pincode}
                onChange={(e)=>setPincode(e.target.value)} />
            </div>
            </div>

            {}
            <div className="space-y-6">

            <h2 className="text-2xl font-bold text-white">
                Order Summary
            </h2>

            {}
            <div className="space-y-3 max-h-72 overflow-y-auto">
                {cartItems.map((item) => (
                <div key={item.product._id}
                    className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">

                    <img
                    src={item.product.image1}
                    className="w-20 h-20 object-contain rounded-lg bg-white"
                    />

                    <div className="flex-1">
                    <p>{item.product.title}</p>
                    <p className="text-sm text-gray-400">
                        Qty: {item.quantity}
                    </p>
                    </div>

                    <p className="text-green-400 font-bold">
                    ₹ {item.product.price * item.quantity}
                    </p>
                </div>
                ))}
            </div>

            {}
            <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                <span>Products</span>
                <span>₹ {productsTotal}</span>
                </div>

                <div className="flex justify-between">
                <span>Delivery</span>
                <span>₹ {deliveryCharge}</span>
                </div>

                <div className="flex justify-between">
                <span>Service</span>
                <span>₹ {serviceCharge}</span>
                </div>

                <div className="flex justify-between font-bold text-xl border-t border-white/20 pt-3">
                <span>Total</span>
                <span className="text-green-400">
                    ₹ {finalTotal}
                </span>
                </div>
            </div>

            {}
            <div className="space-y-3">
                <p className="font-semibold text-white">
                Payment Method
                </p>

                <div className="flex gap-3">

                {}
                <button
                    disabled={codDisabled}
                    onClick={() => setPaymentMode("cod")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition ${
                    paymentMode === "cod"
                        ? "bg-green-600"
                        : "bg-white/10"
                    } ${
                    codDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }`}
                >
                    Cash on Delivery
                </button>

                {}
                <button
                    onClick={() => setPaymentMode("stripe")}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                    paymentMode === "stripe"
                        ? "bg-blue-600"
                        : "bg-white/10"
                    }`}
                >
                    <FaStripe />
                    Stripe
                </button>

                </div>
            </div>

            {}
            <button
                onClick={handlePlaceOrder}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-2xl font-bold text-lg"
            >
                {paymentMode === "cod"
                ? "Place Order"
                : "Proceed to Secure Payment"}
            </button>

            </div>
        </motion.div>

        <style jsx>{`
            .input {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            background: rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            }
        `}</style>
        </div>
    );
    }
