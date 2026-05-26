import React from "react";

export default function CandleStickSkeleton() {
  return (
    <div
      role="status"
      className="max-w-full h-[350px] max-h-[350px]  p-4 rounded-base shadow-xs animate-pulse md:p-6"
    >
      <div className="h-2.5 bg-card rounded-full w-32 mb-2.5"></div>
      <div className="w-48 h-2 mb-10 bg-card rounded-full"></div>
      <div className="flex items-baseline mt-4">
        <div className="w-[15px] bg-card rounded-t-full h-72"></div>
        <div className="w-[15px] h-56 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] h-64 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] h-56 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] h-64 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] h-56 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] h-64 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] h-56 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] h-64 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] h-56 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] h-64 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
        <div className="w-[15px] h-56 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-72 ms-6" />
        <div className="w-[15px] h-64 ms-6 bg-card rounded-t-full" />
        <div className="w-[15px] bg-card rounded-t-full h-80 ms-6" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
