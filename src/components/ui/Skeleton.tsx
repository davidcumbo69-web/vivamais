import React from 'react';
import { cn } from "../../lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200/60",
        className
      )}
      {...props}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-200 mb-4 rounded-xl shadow-sm md:max-w-[700px] md:mx-auto overflow-hidden">
      <div className="p-4 flex items-center space-x-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function VideoThumbnailSkeleton() {
  return (
    <div className="flex-shrink-0 w-24 h-[50px] bg-gray-200 rounded-lg animate-pulse" />
  );
}

export function TopicSkeleton() {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
          </div>
          <div className="flex gap-4 justify-center md:justify-start">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-50">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessageItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-50">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function CommunityCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
      <Skeleton className="aspect-[2/1] w-full" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
