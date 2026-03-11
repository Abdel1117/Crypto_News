import React from "react";
import fancy_image_1 from "@/public/images/product/1.png";
import fancy_image_2 from "@/public/images/product/2.png";
import fancy_image_3 from "@/public/images/product/3.png";
import fancy_image_4 from "@/public/images/product/4.png";
import fancy_image_5 from "@/public/images/product/5.png";
import fancy_image_6 from "@/public/images/product/6.png";
import CardProduct from "@/app/components/CardProduct/CardProduct";

export default function ProductDescription() {
  const products = [
    {
      image: fancy_image_1,
      title: "Feature 1",
      paragraphe:
        "Lorem Ipsum has been the industry's standard dummy text ever since the unknown printer Lorem ",
    },
    {
      image: fancy_image_2,
      title: "Feature 2",
      paragraphe:
        "Lorem Ipsum has been the industry's standard dummy text ever since the unknown printer Lorem ",
    },
    {
      image: fancy_image_3,
      title: "Feature 3",
      paragraphe:
        "Lorem Ipsum has been the industry's standard dummy text ever since the unknown printer Lorem ",
    },
    {
      image: fancy_image_4,
      title: "Feature 4",
      paragraphe:
        "Lorem Ipsum has been the industry's standard dummy text ever since the unknown printer Lorem ",
    },
    {
      image: fancy_image_5,
      title: "Feature 4",
      paragraphe:
        "Lorem Ipsum has been the industry's standard dummy text ever since the unknown printer Lorem ",
    },
    {
      image: fancy_image_6,
      title: "Feature 4",
      paragraphe:
        "Lorem Ipsum has been the industry's standard dummy text ever since the unknown printer Lorem ",
    },
  ];
  return (
    <div id="product_description">
      <div className="container max-w-7xl mx-auto ">
        <div className="text-center">
          <small className="text-base uppercase text-foreground">
            Main Features
          </small>
          <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-5xl">
            Product Description
          </h2>
          <p className="px-2 md:px-12 lg:px-25">
            Lorem Ipsum is simply dummy text ever sincehar the 1500s, when an
            unknownshil printer took a galley of type and scrambled it to make a
            type specimen book. It has survived not only five centuries.
          </p>
        </div>

        <div className="mt-[160px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-30 px-2 sm:px-1 xl:px-0">
          {products?.map((val, keys) => (
            <CardProduct
              key={keys}
              image={val?.image}
              title={val?.title}
              paragraphe={val?.paragraphe}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
