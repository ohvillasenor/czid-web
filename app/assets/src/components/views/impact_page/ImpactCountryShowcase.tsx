import React, { useState } from "react";
import { ImpactCountryData } from "./ImpactCountryData";
import cs from "./ImpactCountryShowcase.scss";

const PrevArrow = () => (
  <svg
    width="33"
    height="33"
    viewBox="0 0 33 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="16.3927"
      cy="16.3241"
      r="15.006"
      stroke="#3867FA"
      strokeWidth="1.98792"
    />
    <path
      d="M12.4621 16.9098C12.1386 16.5863 12.1386 16.0619 12.4621 15.7384L17.7333 10.4671C18.0568 10.1437 18.5813 10.1437 18.9047 10.4671C19.2282 10.7906 19.2282 11.3151 18.9047 11.6385L14.2192 16.3241L18.9047 21.0097C19.2282 21.3331 19.2282 21.8576 18.9047 22.1811C18.5813 22.5045 18.0568 22.5045 17.7333 22.1811L12.4621 16.9098ZM14.1387 17.1524H13.0478V15.4958H14.1387V17.1524Z"
      fill="#3867FA"
    />
  </svg>
);

const PrevArrowDisabled = () => (
  <svg
    width="33"
    height="33"
    viewBox="0 0 33 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="16.3927"
      cy="16.3241"
      r="15.006"
      stroke="#cccccc"
      strokeWidth="1.98792"
    />
    <path
      d="M12.4621 16.9098C12.1386 16.5863 12.1386 16.0619 12.4621 15.7384L17.7333 10.4671C18.0568 10.1437 18.5813 10.1437 18.9047 10.4671C19.2282 10.7906 19.2282 11.3151 18.9047 11.6385L14.2192 16.3241L18.9047 21.0097C19.2282 21.3331 19.2282 21.8576 18.9047 22.1811C18.5813 22.5045 18.0568 22.5045 17.7333 22.1811L12.4621 16.9098ZM14.1387 17.1524H13.0478V15.4958H14.1387V17.1524Z"
      fill="#cccccc"
    />
  </svg>
);

const NextArrow = () => (
  <svg
    width="33"
    height="33"
    viewBox="0 0 33 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="16.3927"
      cy="16.3241"
      r="15.006"
      stroke="#3867FA"
      strokeWidth="1.98792"
    />
    <path
      d="M20.3028 16.9098C20.6263 16.5863 20.6263 16.0619 20.3028 15.7384L15.0315 10.4671C14.7081 10.1437 14.1836 10.1437 13.8602 10.4671C13.5367 10.7906 13.5367 11.3151 13.8602 11.6385L18.5457 16.3241L13.8602 21.0097C13.5367 21.3331 13.5367 21.8576 13.8602 22.1811C14.1836 22.5045 14.7081 22.5045 15.0315 22.1811L20.3028 16.9098ZM18.6261 17.1524H19.7171V15.4958H18.6261V17.1524Z"
      fill="#3867FA"
    />
  </svg>
);

const NextArrowDisabled = () => (
  <svg
    width="33"
    height="33"
    viewBox="0 0 33 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="16.3927"
      cy="16.3241"
      r="15.006"
      stroke="#cccccc"
      strokeWidth="1.98792"
    />
    <path
      d="M20.3028 16.9098C20.6263 16.5863 20.6263 16.0619 20.3028 15.7384L15.0315 10.4671C14.7081 10.1437 14.1836 10.1437 13.8602 10.4671C13.5367 10.7906 13.5367 11.3151 13.8602 11.6385L18.5457 16.3241L13.8602 21.0097C13.5367 21.3331 13.5367 21.8576 13.8602 22.1811C14.1836 22.5045 14.7081 22.5045 15.0315 22.1811L20.3028 16.9098ZM18.6261 17.1524H19.7171V15.4958H18.6261V17.1524Z"
      fill="#cccccc"
    />
  </svg>
);

const BrazilSvg1 = () => (
  <svg
    width="126"
    height="125"
    viewBox="0 0 126 125"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M43.3619 2.29464L44.7132 2.0697L44.4879 3.64428L45.8392 4.76899L46.2896 6.11863L45.3888 8.14309L45.1636 10.1676L46.0644 12.8668L48.0913 14.2165L50.7938 13.7666L54.172 12.192L58.0006 12.8668L57.5502 11.0673L59.8023 10.6174L60.4779 9.94262L63.1804 11.5172L64.9821 11.0673L67.4594 11.2923L69.2611 9.26779L69.4863 7.69321L71.9637 5.21887L73.9906 7.46827L74.2158 10.3925L75.567 13.0918L77.1435 13.7666L75.7922 16.2409L73.5401 18.4904L72.6393 19.6151L72.8645 21.6395H74.2158L75.1166 18.9402H78.0443L81.4225 19.1652V20.7398L80.7469 22.3143L79.1704 23.439L81.4225 22.9892L82.5486 20.9647L85.0259 20.5148L90.4309 22.5393L91.7822 23.8889L93.3587 23.439L94.2595 25.2386V26.8131L94.9352 27.488L97.4125 26.5882L100.115 27.488L103.718 28.3877L107.772 28.1628L112.502 31.3119L114.754 33.3364L117.681 35.5858L121.51 36.7105L123.312 39.1849L123.987 43.0089L123.087 47.0578L119.934 50.6568L117.907 52.6813L115.204 55.8305L113.177 59.2046L110.925 60.1043L109.574 61.9038L109.799 64.3782V67.7523L109.123 71.8012L107.997 75.4003L106.196 78.0996L106.421 80.349L103.944 83.2732L102.142 85.9725V88.2219L99.4394 89.5715L98.7637 90.4713V90.9212L96.5116 91.1461L93.3587 90.4713L91.7822 91.371L90.2057 91.596L88.8545 92.4957L88.1788 93.3955H86.3771L82.999 95.8698L81.1973 97.6694L79.3956 98.7941L78.72 101.943L79.1704 104.193L78.4948 107.117L76.2427 109.366L74.6662 112.515L71.7384 117.014L69.2611 118.364L67.4594 121.063L66.3334 123.313L65.2073 123.538L64.7569 121.513L66.1082 120.163L64.7569 118.814L63.8561 117.914L60.2527 115.665L59.8023 114.315L58.451 115.215L56.1989 112.515H54.3972L55.0728 111.166L58.451 107.342L62.2796 104.193L64.3065 102.843L64.7569 99.9188L63.8561 98.3442L62.2796 97.8943L63.1804 94.5202L62.2796 92.4957L60.0275 93.1706L58.9014 87.9969L56.4241 87.3221L52.5955 87.5471L52.8207 83.948L51.6947 80.7988L53.4964 75.4003L52.5955 73.1509L50.7938 71.8012V69.3269H45.1636L44.2627 65.9528L44.9384 65.278L44.4879 62.1288C44.4879 62.1288 42.2358 60.5542 41.7854 60.5542C41.335 60.5542 37.2812 59.6544 37.2812 59.6544L34.5787 57.405C34.5787 57.405 33.2274 58.0799 32.3266 57.63C31.4257 57.1801 28.9484 54.0309 28.9484 54.0309V49.3072L24.6694 50.4319L22.6425 52.9062H20.6156L18.5887 54.7058L14.9853 54.0309L13.8593 54.4808L12.508 53.1312L12.7332 49.5321L10.9315 51.3316H7.77858L7.32816 49.7571L4.85084 49.5321L5.52647 48.1825L1.9231 43.9086L2.59873 41.6592L4.85084 40.7594L4.40041 39.1849L4.85084 36.2606L10.7063 32.8865L13.4088 33.5614L15.8862 23.439L14.9853 20.9647L13.1836 20.0649L13.6341 17.8155L16.3366 17.3656L15.4357 16.016H14.3097V14.4414L19.4895 13.0918L20.1652 14.2165L21.9669 12.417L23.0929 14.8913L25.1198 16.4659L28.0475 15.7911L32.3266 13.7666L34.3535 11.9671L33.4526 10.8424L31.4257 8.14309L30.2997 5.66875L33.2274 6.56851L35.9299 7.24333L37.5064 5.44381L41.1098 4.31911L43.3619 2.29464Z"
      fill="#E6F7ED"
      stroke="#3CB371"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const BrazilSvg2 = () => (
  <svg
    width="126"
    height="125"
    viewBox="0 0 126 125"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M43.3619 2.29464L44.7132 2.0697L44.4879 3.64428L45.8392 4.76899L46.2896 6.11863L45.3888 8.14309L45.1636 10.1676L46.0644 12.8668L48.0913 14.2165L50.7938 13.7666L54.172 12.192L58.0006 12.8668L57.5502 11.0673L59.8023 10.6174L60.4779 9.94262L63.1804 11.5172L64.9821 11.0673L67.4594 11.2923L69.2611 9.26779L69.4863 7.69321L71.9637 5.21887L73.9906 7.46827L74.2158 10.3925L75.567 13.0918L77.1435 13.7666L75.7922 16.2409L73.5401 18.4904L72.6393 19.6151L72.8645 21.6395H74.2158L75.1166 18.9402H78.0443L81.4225 19.1652V20.7398L80.7469 22.3143L79.1704 23.439L81.4225 22.9892L82.5486 20.9647L85.0259 20.5148L90.4309 22.5393L91.7822 23.8889L93.3587 23.439L94.2595 25.2386V26.8131L94.9352 27.488L97.4125 26.5882L100.115 27.488L103.718 28.3877L107.772 28.1628L112.502 31.3119L114.754 33.3364L117.681 35.5858L121.51 36.7105L123.312 39.1849L123.987 43.0089L123.087 47.0578L119.934 50.6568L117.907 52.6813L115.204 55.8305L113.177 59.2046L110.925 60.1043L109.574 61.9038L109.799 64.3782V67.7523L109.123 71.8012L107.997 75.4003L106.196 78.0996L106.421 80.349L103.944 83.2732L102.142 85.9725V88.2219L99.4394 89.5715L98.7637 90.4713V90.9212L96.5116 91.1461L93.3587 90.4713L91.7822 91.371L90.2057 91.596L88.8545 92.4957L88.1788 93.3955H86.3771L82.999 95.8698L81.1973 97.6694L79.3956 98.7941L78.72 101.943L79.1704 104.193L78.4948 107.117L76.2427 109.366L74.6662 112.515L71.7384 117.014L69.2611 118.364L67.4594 121.063L66.3334 123.313L65.2073 123.538L64.7569 121.513L66.1082 120.163L64.7569 118.814L63.8561 117.914L60.2527 115.665L59.8023 114.315L58.451 115.215L56.1989 112.515H54.3972L55.0728 111.166L58.451 107.342L62.2796 104.193L64.3065 102.843L64.7569 99.9188L63.8561 98.3442L62.2796 97.8943L63.1804 94.5202L62.2796 92.4957L60.0275 93.1706L58.9014 87.9969L56.4241 87.3221L52.5955 87.5471L52.8207 83.948L51.6947 80.7988L53.4964 75.4003L52.5955 73.1509L50.7938 71.8012V69.3269H45.1636L44.2627 65.9528L44.9384 65.278L44.4879 62.1288C44.4879 62.1288 42.2358 60.5542 41.7854 60.5542C41.335 60.5542 37.2812 59.6544 37.2812 59.6544L34.5787 57.405C34.5787 57.405 33.2274 58.0799 32.3266 57.63C31.4257 57.1801 28.9484 54.0309 28.9484 54.0309V49.3072L24.6694 50.4319L22.6425 52.9062H20.6156L18.5887 54.7058L14.9853 54.0309L13.8593 54.4808L12.508 53.1312L12.7332 49.5321L10.9315 51.3316H7.77858L7.32816 49.7571L4.85084 49.5321L5.52647 48.1825L1.9231 43.9086L2.59873 41.6592L4.85084 40.7594L4.40041 39.1849L4.85084 36.2606L10.7063 32.8865L13.4088 33.5614L15.8862 23.439L14.9853 20.9647L13.1836 20.0649L13.6341 17.8155L16.3366 17.3656L15.4357 16.016H14.3097V14.4414L19.4895 13.0918L20.1652 14.2165L21.9669 12.417L23.0929 14.8913L25.1198 16.4659L28.0475 15.7911L32.3266 13.7666L34.3535 11.9671L33.4526 10.8424L31.4257 8.14309L30.2997 5.66875L33.2274 6.56851L35.9299 7.24333L37.5064 5.44381L41.1098 4.31911L43.3619 2.29464Z"
      fill="#3867FA"
      fillOpacity="0.15"
      stroke="#3867FA"
      strokeWidth="2"
    />
  </svg>
);

const GambiaSvg = () => (
  <svg
    width="219"
    height="59"
    viewBox="0 0 219 59"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.875 23.125C21.925 21.925 20.9375 19.8333 20.4375 18.9375L97.3438 19.0312C98.0312 15.4271 100.325 7.79375 104 6.09375C108.594 3.96875 111.219 5.21875 111.406 5.3125C111.556 5.3875 113.24 6.69792 114.062 7.34375H115.531L121.25 4.0625L121.938 3.46875L126 1.75L132.969 4.0625L134.812 3.28125C136.094 3.33333 139.45 3.88125 142.625 5.65625C145.8 7.43125 146.49 12.1875 146.438 14.3438L152.094 17.3125C153.74 16.1771 157.881 13.9937 161.281 14.3438C164.681 14.6938 167.594 17.8438 168.625 19.375L169.062 22.6875C169.969 23.125 171.281 25.2188 172.406 25.8125C173.306 26.2875 175.385 27.4479 176.312 27.9688H177.438C177.738 27.9688 178.812 28.6146 179.312 28.9375L181.688 27.9688L185.5 27.6562C186.083 26.8021 187.363 25.0312 187.812 24.7812C188.262 24.5312 190.5 23.5312 191.562 23.0625H192.844L196.219 21.5938L200.906 21.75C201.844 21.1146 203.869 19.8375 204.469 19.8125C205.069 19.7875 207.073 20.5312 208 20.9062L209.594 21.0938C209.854 21.1667 210.4 21.4 210.5 21.75C210.6 22.1 211.875 23.9167 212.5 24.7812C212.969 25.0521 213.975 25.65 214.25 25.875C214.525 26.1 215.156 27.6562 215.438 28.4062C216.052 28.7708 217.3 29.7 217.375 30.5C217.469 31.5 217.062 32.9062 216.656 34.5312C216.25 36.1562 213.844 38.375 212.062 38.7812C210.637 39.1063 207.448 38.9167 206.031 38.7812L202.062 41.0312H197.875L194.281 42.1875C194.531 43.9125 193.01 45.6562 192.219 46.3125H190.594L189.125 45.5938L186.656 46.3125H185.062L183.625 44.7812C182.427 45.0833 179.456 45.6688 177.156 45.5938C174.281 45.5 172.094 43.3125 171.719 43.125C171.419 42.975 170.219 41.2292 169.656 40.375C168.458 40.3125 165.85 40.1063 165 39.7812C164.15 39.4562 162.146 37.125 161.25 36L158.719 37.2812C158.031 37.3542 156.319 37.4562 154.969 37.2812C153.619 37.1063 150.823 35.4583 149.594 34.6562L148.094 31.8438H144.469L141.562 29.5938H137.812C137.125 29.3438 134.981 28.4625 131.906 26.9375C128.831 25.4125 125.812 20.6771 124.688 18.5L121.031 19.8438C120.481 21.2687 118.073 22.9583 116.938 23.625C117.012 24.15 115.573 29.2396 114.844 31.7188C114.294 32.6437 111.135 34.6458 109.625 35.5312L104 36.4688L98.6875 34.8125C97.7292 34.3646 95.525 33.5 94.375 33.625C93.225 33.75 92.1667 35.0521 91.7812 35.6875L89.2812 36.9062L81.9688 35.625L79.0938 36.9062H73.625V50.1562H11.0312L9.0625 51.2188L8.84375 53.375L8.28125 54.1875H6.875L7.625 55.1562L7.125 55.7188L7.46875 56.6875L6.5625 57.0625L6.03125 57.7812C5.88125 57.3312 4.84375 56.8646 4.34375 56.6875L4.84375 53.5938L4.34375 53L3.8125 51.4062L3 50.875C3.6875 50 3.46875 44 3.28125 43.5625C3.13125 43.2125 2.21875 42.4583 1.78125 42.125C1.97917 41.4167 2.325 39.8812 2.125 39.4062C1.925 38.9313 1.52083 37.8125 1.34375 37.3125C1.66667 37.0312 2.325 36.4313 2.375 36.2812C2.425 36.1312 2.52083 35.1562 2.5625 34.6875C3.45833 34.3333 5.3875 33.4875 5.9375 32.9375C6.4875 32.3875 7.375 30.2083 7.75 29.1875C8.02083 29.0417 8.6625 28.6375 9.0625 28.1875C9.4625 27.7375 10.9792 26.9167 11.6875 26.5625L12.4375 27.5L14 27.8125L16.4375 28.1875L20.4375 26.5625C20.8958 25.9167 21.825 24.325 21.875 23.125Z"
      fill="#E6F7ED"
      stroke="#3CB371"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const GuineaSvg = () => (
  <svg
    width="120"
    height="117"
    viewBox="0 0 120 117"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M57.0293 58.5303L57.4909 59.2082L57.524 59.9598L57.3956 60.7903L57.4827 61.6189L57.9973 62.2565L58.927 63.0788L59.9437 63.7746L60.6657 64.0425L61.363 64.2065L63.903 65.4751L64.7163 65.6078H70.1195L72.7063 65.6074L81.5283 65.6059H82.13H94.1402L106.155 65.6039L118.165 65.602L118.472 67.1415L118.488 70.3683L118.55 80.8967L118.563 83.0047L118.613 91.4192L118.675 101.942L118.737 112.464L106.71 112.423L103.779 112.414L94.6872 112.386L82.6689 112.344L81.7431 112.342L70.6419 112.307L66.2594 112.291L65.0923 112.442L64.3044 112.544L64.0928 113.131L64.0884 114.32L63.9432 114.848L63.47 115.308L62.8308 115.449L62.117 115.341L61.4072 115.038L60.743 114.524L59.7012 113.333L59.0371 112.864L58.4147 112.635L57.2206 112.498L57.2827 112.287L57.2273 111.599L56.92 110.573L57.0082 110.096L57.3187 109.846L57.8415 109.664L58.4393 109.556L58.9523 109.522L58.7106 109.311L58.2206 109.144L57.6388 109.037L57.1453 108.998L56.7337 108.87L55.7307 108.301L55.2438 108.177L53.5968 108.532L53.1688 108.424L53.0068 108.021L53.1833 107.588L53.4968 107.237L53.7452 107.078L53.0002 107.392L52.0853 108.197L51.3075 109.089L50.9807 109.67L50.7062 109.957L49.383 110.284L48.3861 110.706L48.0265 110.232L47.399 108.303L47.0722 107.795L46.6376 107.408L45.9938 107.078L45.2617 106.904L44.7388 107.025L44.2683 107.238L42.9907 107.48L41.8045 108.045L41.1966 108.176L40.8436 107.954L39.9026 106.901L39.3864 106.529L39.4649 106.127L39.3638 105.81L38.8441 105.133L39.4715 104.875L39.942 104.402L40.2817 103.815L40.9354 101.76L41.2883 101.031L41.746 100.72L42.3601 100.392L42.922 99.6157L43.3535 98.7055L43.5561 97.9781L43.4515 96.4401L43.6084 95.7814L44.7131 95.2976L46.2948 93.8627L46.991 92.9587L47.1183 92.8916L47.2065 92.6757L47.3928 92.4796L47.579 92.2114L47.6673 91.7831L48.1378 90.6339L48.7848 89.4489L49.6083 88.8113L50.1311 88.9846L50.6344 89.4571L51.3927 89.7234L52.4645 89.5828L53.2227 89.2263L53.922 88.7718L54.8174 88.3287L54.0068 88.3697L52.3665 89.4809L51.6543 89.3111L49.9124 87.6571L49.308 86.5454L49.7199 85.46L52.0791 83.1191L52.1869 82.9688L52.4223 82.521L52.6218 82.2953L53.4453 81.7459L53.7588 81.4289L53.9322 81.1446L54.2754 80.3469L54.4453 80.1017L54.6284 79.9334L54.7592 79.6636L54.9095 78.6925L55.0926 78.4243L55.282 78.2283L55.3671 78.019L55.5893 77.6398L57.0106 76.2338L57.4385 74.8738L57.2816 73.2097L56.1672 69.9267L55.7849 69.1731L55.6608 68.8299L55.6182 68.3902L55.7064 67.9666L55.8927 67.6968L56.0789 67.4957L56.1672 67.2798L56.5006 62.2912L56.3831 61.3854L56.0399 60.6857L55.7197 59.7845L56.2359 59.0864L57.0293 58.5303ZM21.8192 1.87268L22.8844 3.19243L23.2831 3.88003L23.4432 4.73123L23.3811 5.50395L23.2175 6.20639L22.9625 6.83347L22.6388 7.36567L21.1879 8.65731L20.7759 9.77051L19.4429 11.3519L19.3285 11.4862L18.5245 13.647L17.8319 14.1968L17.6425 15.1428L17.5312 15.3588L17.4398 15.4931L16.2864 16.1803L16.1459 16.8285L16.1263 18.6812L15.8745 19.3391L14.0706 21.4207L12.695 23.6822L12.3225 24.134L11.9367 23.8739L11.0152 23.4811L10.8059 23.2211L10.5509 23.3292L9.96917 23.118L8.85479 22.4979L8.5639 22.5979L7.64241 22.8041L7.23712 22.7959L6.80566 22.6077L5.95602 22.0626L5.4332 21.9482L4.57066 21.9189L3.61638 21.6963L2.84523 21.0942L2.52505 19.9127L2.34193 19.4773L1.97606 18.9502L1.71484 18.425L1.84564 17.9784L2.00261 17.6086L2.25095 15.9062L2.52231 15.1257L3.04827 14.1124L3.79678 13.4463L4.74754 13.7099L5.25748 13.417L5.93376 13.4482L7.36519 13.7102L8.04146 13.4369L8.26364 12.7934L8.14923 12.052L7.7865 11.4874L8.28629 11.2187L8.91688 10.7654L9.4725 10.227L9.70795 9.71467L9.98244 5.99359L10.5053 4.57739L11.5576 2.8582L12.9726 1.46309L14.6207 1L14.5325 1.15228L14.3693 1.57124L15.6176 1.83324L16.1665 1.86292L16.5621 1.57124L17.4672 1.84964L18.7678 2.04604L20.1305 2.01012L21.248 1.57124L21.369 1.74812L21.4932 1.81528L21.8192 1.87268Z"
      fill="#3867FA"
      fillOpacity="0.15"
      stroke="#3867FA"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const PakistanSvg = () => (
  <svg
    width="117"
    height="123"
    viewBox="0 0 117 123"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.70508 100.57L7.70508 107.57V108.57L12.2051 107.57H21.2051L23.2051 105.57H26.7051L31.7051 107.57L37.7051 105.57H45.2051L46.2051 107.57L47.2051 108.57L51.7051 113.07L53.2051 118.57L58.7051 121.07L61.2051 117.57H63.7051L65.2051 115.57H70.7051L71.7051 116.57H72.7051L76.2051 115.57H78.7051L81.7051 114.07V111.07L80.2051 105.57L77.7051 101.57H74.7051V98.0697L72.7051 96.0697L70.7051 95.0697V93.0697L72.7051 88.5697L74.7051 86.0697L77.7051 83.5697L78.7051 86.0697L83.7051 85.0697L89.2051 83.5697L91.7051 77.5697L97.7051 72.5697L100.705 66.5697L103.205 65.5697V63.0697L107.205 59.0697L109.205 54.5697V51.0697L111.205 47.0697H115.205V44.5697L109.205 41.5697V40.0697L102.705 38.0697L100.705 33.0697V30.0697V24.0697L103.205 23.0697L104.705 19.5697V17.5697L103.205 16.0697V14.0697L99.2051 13.0697L97.7051 11.5697H94.7051V7.5697L97.7051 5.0697L103.205 4.0697V2.0697L100.705 1.0697H97.7051L92.7051 2.0697L83.7051 7.5697V9.5697L85.2051 14.0697L86.2051 19.5697L83.7051 21.0697L81.7051 23.0697V26.5697L80.2051 30.0697H78.7051L74.7051 28.5697H72.7051L76.2051 35.5697L70.7051 38.5697L69.2051 41.5697V45.5697L67.7051 49.0697L65.2051 51.0697L61.2051 49.0697L54.7051 51.0697V53.5697H51.7051L45.2051 56.5697L44.2051 59.0697V66.5697L34.2051 70.0697L31.7051 69.0697L25.2051 71.0697H20.2051H14.2051L9.70508 69.0697L2.70508 66.5697L4.70508 71.0697L7.70508 75.5697L11.2051 79.0697L16.2051 80.5697L17.2051 82.5697V86.0697V90.5697H21.2051L22.2051 93.0697L18.7051 96.0697L11.2051 98.0697L9.70508 100.57Z"
      fill="#E6F7ED"
      stroke="#3CB371"
      strokeWidth="2"
    />
  </svg>
);

const ImpactCountryShowcase = () => {
  const [selectedCountry, setSelectedCountry] = useState(ImpactCountryData[0]);

  return (
    <div className={cs.countryShowcaseContainer}>
      <section className={cs.countryShowcaseScroller}>
        {ImpactCountryData.map((country, index) => (
          <div
            key={`countryScrollItem-${index}`}
            className={`${cs.countryScrollItem}`}
            onClick={() => setSelectedCountry(country)}
          >
            <div
              className={`${cs.countryScrollItemIndicator} ${
                country === selectedCountry
                  ? cs.countryScrollItemIndicatorActive
                  : ""
              }`}
            ></div>
            <div className={cs.countryScrollItemDescription}>
              <h3>{country.countryName}</h3>
              <p>{country.institution}</p>
            </div>
            <div className={cs.countryScrollItemCycle}>
              <div
                className={`
                  ${cs.countryScrollItemCycleDot} 
                  ${country.cycle === 1 ? cs.cycle1 : cs.cycle2}
                `}
              ></div>
              <span className={cs.countryScrollItemCycleText}>
                Cycle <span>{country.cycle}</span>
              </span>
            </div>
          </div>
        ))}
      </section>
      <div className={cs.countryShowcaseWindow}>
        <div className={cs.countryShowcaseWindowTitleContainer}>
          <div className={cs.countryShowcaseWindowTitleTextContainer}>
            <p className={cs.countryShowcaseWindowCountryName}>
              {selectedCountry.countryName}&nbsp;
              <span
                className={`
                  ${cs.countryShowcaseWindowCountryCycleDot} 
                  ${selectedCountry.cycle === 1 ? cs.cycle1 : cs.cycle2}
                `}
              ></span>
              <span>Cycle {selectedCountry.cycle}</span>
            </p>
            <h2 className={cs.countryShowcaseWindowProjectTitle}>
              {selectedCountry.projectTitle}
            </h2>
          </div>
          <div className={cs.countryShowcaseWindowMapContainer}>
            {selectedCountry.countryName !==
              ("Brazil" || "The Gambia" || "Guinea" || "Pakistan") &&
            selectedCountry?.mapImage?.src ? (
              <img
                className={cs.countryShowcaseWindowMapImage}
                src={selectedCountry.mapImage.src}
                alt={selectedCountry.mapImage.alt || ""}
              />
            ) : null}
            {selectedCountry.countryName === "Brazil" &&
            selectedCountry.cycle === 1 ? (
              <BrazilSvg1 />
            ) : null}
            {selectedCountry.countryName === "Brazil" &&
            selectedCountry.cycle === 2 ? (
              <BrazilSvg2 />
            ) : null}
            {selectedCountry.countryName === "The Gambia" ? (
              <GambiaSvg />
            ) : null}
            {selectedCountry.countryName === "Guinea" ? <GuineaSvg /> : null}
            {selectedCountry.countryName === "Pakistan" ? (
              <PakistanSvg />
            ) : null}
          </div>
        </div>
        <div className={cs.countryShowcaseWindowDescriptionContainer}>
          <div className={cs.countryShowcasePrincipalInvestigatorContainer}>
            {selectedCountry?.headshot ? (
              <img
                src={selectedCountry.headshot.src}
                alt={selectedCountry.headshot.alt || ""}
              />
            ) : null}
            <div>
              <p className={cs.countryShowcasePrincipalInvestigatorName}>
                {selectedCountry.principalInvestigator}
              </p>
              <span className={cs.countryShowcasePrincipalInvestigatorTitle}>
                Principal Investigator
              </span>
            </div>
          </div>
          <p className={cs.countryShowcaseSummary}>{selectedCountry.summary}</p>
          {selectedCountry?.publications ? (
            <div className={cs.countryShowcaseCtaContainer}>
              {selectedCountry.publications.length > 1
                ? selectedCountry.publications.map((publication, index) => (
                    <a
                      className={cs.countryShowcaseCtaLink}
                      href={publication.src}
                      key={`showcaseCtaLink-${index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Publication ({index + 1})
                    </a>
                  ))
                : selectedCountry.publications.map((publication, index) => (
                    <a
                      className={cs.countryShowcaseCtaLink}
                      href={publication.src}
                      key={`showcaseCtaLink-${index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Publication
                    </a>
                  ))}
            </div>
          ) : null}
        </div>
        <div className={cs.countryShowcaseNavContainer}>
          <span
            className={`${cs.countryShowcaseNavButton} ${
              selectedCountry.prevCountryIndex === undefined ? cs.disabled : ""
            }`}
            onClick={() => {
              if (ImpactCountryData[selectedCountry?.prevCountryIndex]) {
                setSelectedCountry(
                  ImpactCountryData[selectedCountry.prevCountryIndex],
                );
              }
            }}
          >
            {ImpactCountryData[selectedCountry.prevCountryIndex] ===
            undefined ? (
              <PrevArrowDisabled />
            ) : (
              <PrevArrow />
            )}
          </span>
          <span
            className={`${cs.countryShowcaseNavButton} ${
              selectedCountry.nextCountryIndex === undefined ? cs.disabled : ""
            }`}
            onClick={() => {
              if (ImpactCountryData[selectedCountry?.nextCountryIndex]) {
                setSelectedCountry(
                  ImpactCountryData[selectedCountry.nextCountryIndex],
                );
              }
            }}
          >
            {ImpactCountryData[selectedCountry.nextCountryIndex] ===
            undefined ? (
              <NextArrowDisabled />
            ) : (
              <NextArrow />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImpactCountryShowcase;
