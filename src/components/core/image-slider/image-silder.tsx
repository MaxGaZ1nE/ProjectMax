import type { FC } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Link } from 'react-router-dom';

import 'swiper/css';
import 'swiper/css/pagination';

type ImageItem = {
  src: string;
  link?: string;
};

type ImageSliderProps = {
  images: ImageItem[];
  height?: string;
};

const ImageSlider: FC<ImageSliderProps> = ({
  images,
  height = 'h-[320px]',
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl ${height}`}>
      <Swiper
        modules={[Autoplay, Pagination]}
        className="h-full w-full"
        loop
        speed={600}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        onSwiper={(swiper) => {
          swiper.autoplay.start();
        }}
      >
        {images.map((item, index) => (
          <SwiperSlide key={index} className="h-full w-full">
            {item.link ? (
              <Link to={item.link} className="block h-full w-full">
                <img
                  src={item.src}
                  alt={`slide-${index}`}
                  className="h-full w-full object-cover cursor-pointer"
                  draggable={false}
                />
              </Link>
            ) : (
              <img
                src={item.src}
                alt={`slide-${index}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider;
