"use client";

import { useState } from "react";
import EquipmentCard from "@/components/EquipmentCard";

const mockData = [
  { id: "1", name: "Excavator", price: 5000, available: true },
  { id: "2", name: "Bulldozer", price: 8000, available: false },
];

export default function EquipmentPage() {
  const [equipment] = useState(mockData);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Equipment List</h2>
      <div className="grid grid-cols-3 gap-4">
        {equipment.map((item) => (
          <EquipmentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
