import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { ShareButton } from "~ui/controls/buttons";

import cs from "./share_button.scss";

export const ShareButtonPopUp = ({
  onShareClick,
}: {
  onShareClick: () => void;
}) => {
  return (
    <>
      <BasicPopup
        trigger={
          <ShareButton className={cs.controlElement} onClick={onShareClick} />
        }
        content="A shareable URL was copied to your clipboard!"
        on="click"
        hideOnScroll
      />
    </>
  );
};
