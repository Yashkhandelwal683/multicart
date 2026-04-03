  "use client";

  import React, { useEffect, useMemo, useState } from "react";
  import { useSelector, useDispatch } from "react-redux";
  import { RootState, AppDispatch } from "@/redux/store";
  import { setAllOrderData } from "@/redux/orderSlice";
  import axios from "axios";
  import { motion } from "framer-motion";
  import { FiEdit3 } from "react-icons/fi";

  export default function VendorOrdersPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { allOrderData } = useSelector((state: RootState) => state.order);
    const { userData } = useSelector((state: RootState) => state.user);

    const [otpModal, setOtpModal] = useState<any>(null);
    const [otpInput, setOtpInput] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/order/allOrder");
        dispatch(setAllOrderData(res.data.orders || res.data || []));
      } catch {
        dispatch(setAllOrderData([]));
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchOrders();
    }, []);

    if (!userData || userData.role !== "vendor") {
      return (
        <div className="min-h-screen flex items-center justify-center text-white">
          Access Denied
        </div>
      );
    }

    const vendorOrders = useMemo(
      () =>
        (allOrderData || []).filter(
          (o: any) =>
            String(o.productVendor?._id || o.productVendor) ===
            String(userData._id)
        ),
      [allOrderData, userData]
    );

    
    const updateStatus = async (orderId: string, status: string) => {
      try {
        setLoadingId(orderId);

        await axios.post("/api/order/update-status", { orderId, status });

        
        await fetchOrders();

      } catch (err: any) {
        alert(err?.response?.data?.message || "Something went wrong");
      } finally {
        setLoadingId(null);
      }
    };

    
    const verifyAndDeliver = async () => {
      try {
        setLoadingId(otpModal._id);

        await axios.post("/api/order/verify-delivery-otp", {
          orderId: otpModal._id,
          otp: otpInput,
        });

        await fetchOrders();

        setOtpModal(null);
        setOtpInput("");

      } catch (err: any) {
        alert(err?.response?.data?.message || "Invalid OTP");
      } finally {
        setLoadingId(null);
      }
    };

    const statusOptions = [
      "pending",
      "confirmed",
      "shipped",
      "out_for_delivery",
    ];

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading Orders...
        </div>
      );
    }

    return (
      <div className="w-full p-4 sm:p-8 text-white">

        {}
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Vendor Orders</h1>
          <span className="text-gray-300">{vendorOrders.length} orders</span>
        </div>

        {}
        <div className="hidden sm:block bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/10">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Buyer</th>
                <th className="p-4">Products</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Update</th>
              </tr>
            </thead>

            <tbody>
              {vendorOrders.map((order: any) => (
                <tr key={order._id} className="border-t border-white/10">

                  <td className="p-4">#{order._id.slice(-8)}</td>

                  <td className="p-4">
                    {order.address?.name}
                    <div className="text-xs text-gray-400">
                      {order.address?.phone}
                    </div>
                  </td>

                  <td className="p-4">
                    {order.products.map((p: any, i: number) => (
                      <div key={i}>
                        {p.product?.title} × {p.quantity}
                      </div>
                    ))}
                  </td>

                  <td className="p-4">
                    {order.paymentMethod}
                    <div className="text-xs">
                      {order.isPaid ? "Paid" : "Pending"}
                    </div>
                  </td>

                  <td className="p-4 capitalize">
                    {order.orderStatus}
                  </td>

                  <td className="p-4 text-center">

                    {["cancelled", "delivered", "returned"].includes(order.orderStatus) ? (
                      <span className="font-semibold capitalize">
                        {order.orderStatus}
                      </span>
                    ) : (

                      <select
                        disabled={loadingId === order._id}
                        value={order.orderStatus}
                        onChange={(e) => {

                          const value = e.target.value;

                          if (value === "out_for_delivery") {
                            updateStatus(order._id, value);
                            setOtpModal(order); 
                          } else {
                            updateStatus(order._id, value);
                          }

                        }}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s} className="bg-black">
                            {s}
                          </option>
                        ))}
                      </select>

                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {}

        <div className="sm:hidden space-y-4">
          {vendorOrders.map((order: any) => (
            <motion.div
              key={order._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 border border-white/20 rounded-xl p-4"
            >

              <div className="flex justify-between mb-2">
                <span className="text-sm">#{order._id.slice(-8)}</span>
                <span className="text-green-400 font-bold">
                  ₹{order.totalAmount}
                </span>
              </div>

              <p className="text-sm">
                <b>Buyer:</b> {order.address?.name}
              </p>

              <p className="text-xs text-gray-400">
                {order.address?.phone}
              </p>

              <div className="mt-2 text-sm">
                {order.products.map((p: any, i: number) => (
                  <p key={i}>
                    {p.product?.title} × {p.quantity}
                  </p>
                ))}
              </div>

              <div className="mt-3 text-sm">
                <b>Status:</b>{" "}
                <span className="capitalize">
                  {order.orderStatus}
                </span>
              </div>

              {!["cancelled", "delivered", "returned"].includes(order.orderStatus) && (

                <select
                  disabled={loadingId === order._id}
                  value={order.orderStatus}
                  onChange={(e) => {

                    const value = e.target.value;

                    if (value === "out_for_delivery") {
                      updateStatus(order._id, value);
                      setOtpModal(order);
                    } else {
                      updateStatus(order._id, value);
                    }

                  }}
                  className="mt-3 w-full bg-white/10 border border-white/20 rounded px-3 py-2"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s} className="bg-black">
                      {s}
                    </option>
                  ))}
                </select>

              )}

            </motion.div>
          ))}
        </div>


        {}

        {otpModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#061526] p-6 rounded-xl w-full max-w-md">

              <h2 className="text-lg font-semibold mb-3">
                Enter Delivery OTP
              </h2>

              <input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full bg-white/10 border border-white/20 px-4 py-2 rounded mb-4"
                placeholder="Enter OTP"
              />

              <button
                onClick={verifyAndDeliver}
                className="w-full bg-green-600 py-2 rounded flex items-center justify-center gap-2"
              >
                <FiEdit3 /> Verify & Deliver
              </button>

            </div>
          </div>
        )}

      </div>
    );
  }
