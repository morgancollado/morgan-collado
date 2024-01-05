'use client'
import Carousel from 'react-material-ui-carousel'
import Image from 'next/image'

const CustomCarousel = ({imgs}) => {
    return(
        <Carousel autoPlay={false} navButtonsAlwaysVisible >
            {imgs.map((img, index) => (
              
              <Image
                src={`${img.img}`}
                alt={`${img.alt}`}
                loading="lazy"
                layout="responsive"
                height={550}
                width={550}
                key={index}
              />
            
          ))}
        </Carousel>
    )
}

export default CustomCarousel