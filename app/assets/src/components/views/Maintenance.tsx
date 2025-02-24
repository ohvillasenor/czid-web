import React from "react";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import ImgMicrobeSecondary from "~ui/illustrations/ImgMicrobeSecondary";
import cs from "./maintenance.scss";

class Maintenance extends React.Component {
  render() {
    return (
      <div className={cs.maintenance}>
        <BlankScreenMessage
          message={`CZ ID is currently undergoing some scheduled maintenance. Sorry
          for the inconvenience!`}
          textWidth={300}
          tagline={`We'll be back online soon.`}
          icon={<ImgMicrobeSecondary className={cs.imgMicrobe} />}
        />
      </div>
    );
  }
}

export default Maintenance;
