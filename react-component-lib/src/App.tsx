import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import styles from "./swiper.module.css";

import "swiper/css";
import "swiper/css/effect-cards";

const currentCards = [
  {
    cardContent: "111",
    id: "1",
    backgroundColor: "#000000",
  },
  {
    cardContent: "222",
    id: "2",
    backgroundColor: "#f00",
  },
  {
    cardContent: "333",
    id: "3",
    backgroundColor: "#0f0",
  },
  {
    cardContent: "444",
    id: "4",
    backgroundColor: "#00f",
  },
];

function App() {
  return (
    <>
      <div className={styles.container}>
        <Swiper
          modules={[EffectCards]}
          className={styles.swiper}
          effect="cards"
          cardsEffect={{
            perSlideOffset: 10,
            perSlideRotate: 10,
            slideShadows: false,
          }}
        >
          {currentCards.map((card) => {
            return (
              <SwiperSlide style={{ backgroundColor: card.backgroundColor }}>
                <div className={styles.slideContent}>{card.cardContent}</div>
              </SwiperSlide>
            );
          })}
        </Swiper>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}

export default App;
