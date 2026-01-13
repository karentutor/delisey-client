import type { Product } from "@/types/products";

/**
 * Static seed data (later replaced by DB).
 * Images should live in /public/images/menu/...
 */
export const products = [
  {
    id: "cinnamon-donut",
    name: "Cinnamon Sugar Donut",
    description: "Light, fluffy donut tossed in warm cinnamon sugar.",
    imageSrc: "/images/donut-cinnamon-sugar.jpg",
    imageAlt: "Cinnamon sugar donut",
    tags: ["Donut", "Cinnamon"],
  },
  {
    id: "glazed-donut",
    name: "Classic Glazed Donut",
    description: "Our signature donut finished with a smooth vanilla glaze.",
    imageSrc: "/images/donut-classic-glaze.jpg",
    imageAlt: "Classic glazed donut",
    tags: ["Donut", "Glazed"],
  },
  {
    id: "chocolate-glazed-donut",
    name: "Chocolate Glazed Donut",
    description: "Rich chocolate glaze over a soft, freshly fried donut.",
    imageSrc: "/images/donut-chocolate.jpg",
    imageAlt: "Chocolate glazed donut",
    tags: ["Donut", "Chocolate"],
  },
] satisfies Product[];
