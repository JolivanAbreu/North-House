import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-stone-200/80 rounded-lg ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-stone-100">
    <Skeleton className="w-full h-48 rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl shadow-card border border-stone-100 space-y-3">
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-2/3" />
  </div>
);

export default Skeleton;
