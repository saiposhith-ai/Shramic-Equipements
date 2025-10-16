import React from "react";
import { Equipment } from "@/types/equipment";

export default function EquipmentCard({ item }: { item: Equipment }) {
  return (
    <div className="border p-4 rounded-lg bg-white shadow-sm">
      <h3 className="text-xl font-semibold">{item.name}</h3>
      <p className="text-gray-600 mt-1">₹{item.price} / day</p>
      <p className={`mt-2 ${item.available ? "text-green-600" : "text-red-600"}`}>
        {item.available ? "Available" : "Rented"}
      </p>
      <button className="mt-3 bg-blue-500 text-white px-4 py-1 rounded">
        {item.available ? "Rent Now" : "Notify Me"}
      </button>
    </div>
  );
}
