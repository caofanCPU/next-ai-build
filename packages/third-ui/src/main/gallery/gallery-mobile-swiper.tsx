"use client";

import type { CSSProperties } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import Image from "next/image";
import { themeSvgIconColor } from "@windrun-huaiin/base-ui/lib";
import { GalleryItem } from "./gallery-types";

interface Props {
  items: GalleryItem[];
}

const swiperThemeStyle = {
  "--gallery-swiper-bullet-active-color": themeSvgIconColor,
  "--swiper-theme-color": themeSvgIconColor,
} as CSSProperties;

export function GalleryMobileSwiper({ items }: Props) {
  return (
    <div className="block sm:hidden px-4">
      {/* 外层容器：强制 maxWidth，防止任何溢出 */}
      <div
        className="w-full overflow-hidden"
        style={{ maxWidth: "min(calc(100vw - 48px), 350px)", margin: "0 auto" }}
      >
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          spaceBetween={12}
          slidesPerView={1}
          loop={true}
          grabCursor={true}
          className="gallery-mobile-swiper rounded-2xl"
          style={swiperThemeStyle}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="relative w-full pb-[100%] bg-gray-100">
                <Image
                  src={item.url}
                  alt={item.altMsg}
                  fill
                  sizes="(max-width: 600px) min(100vw-48px, 350px)"
                  className="object-cover"
                  data-gallery-image={item.id}
                />
                <button
                  className="absolute bottom-4 right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all z-10"
                  data-gallery-download={item.id}
                  aria-label={`Download ${item.altMsg}`}
                >
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
