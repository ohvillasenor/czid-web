import React from "react";

import Content from "~/components/views/landing_page/Content";
import Footer from "~/components/views/landing_page/Footer";
import Header from "~/components/views/landing_page/LandingHeaderV2";
import Hero from "~/components/views/landing_page/Hero";

const LandingV2 = () => {
  return (
    <div>
        <Header />
        <Hero />
        <Content />
        <Footer />
    </div>
  );
};

export default LandingV2;