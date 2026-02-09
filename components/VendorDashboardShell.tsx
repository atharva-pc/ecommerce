"use client";

import { useState } from "react";
import { VendorProduct } from "@/types/vendor";
import VendorProductUploadForm from "./VendorProductUploadForm";
import VendorProductGrid from "./VendorProductGrid";

type Props = {
  initialProducts: VendorProduct[];
};

export default function VendorDashboardShell({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);

  return (
    <div className="space-y-6">
      <VendorProductUploadForm
        onSuccess={(product) => setProducts((prev) => [product, ...prev])}
      />
      <VendorProductGrid
        products={products}
        onDelete={(id) => setProducts((prev) => prev.filter((product) => product.id !== id))}
      />
    </div>
  );
}
