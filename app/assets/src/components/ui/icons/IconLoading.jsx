import React from "react";
import PropTypes from "prop-types";

const IconLoading = ({ className }) => {
  return (
    <svg className={className} width="32px" height="32px" viewBox="0 0 32 32">
      <g stroke="none" strokeWidth="1">
        <path d="M22.37,19.8902839 C23.7506878,19.8902839 24.87,21.0095961 24.87,22.3902839 C24.87,23.7710077 23.7507238,24.8902839 22.37,24.8902839 C20.9892762,24.8902839 19.87,23.7710077 19.87,22.3902839 C19.87,21.0095601 20.9892762,19.8902839 22.37,19.8902839 Z M8.64839886,20.5289492 C9.61954789,20.5289492 10.4067977,21.3161991 10.4067977,22.2873481 C10.4067977,23.2584971 9.61954789,24.045747 8.64839886,24.045747 C7.67724982,24.045747 6.89,23.2584971 6.89,22.2873481 C6.89,21.3161991 7.67724982,20.5289492 8.64839886,20.5289492 Z M25.43,13.3 C26.8107255,13.3 27.93,14.4192745 27.93,15.8 C27.93,17.1807255 26.8107255,18.3 25.43,18.3 C24.0492745,18.3 22.93,17.1807255 22.93,15.8 C22.93,14.4192745 24.0492745,13.3 25.43,13.3 Z M5.88148678,13.772023 C6.92061624,13.772023 7.76297355,14.6143803 7.76297355,15.6535098 C7.76297355,16.6926392 6.92061624,17.5349965 5.88148678,17.5349965 C4.84235731,17.5349965 4,16.6926392 4,15.6535098 C4,14.6143803 4.84235731,13.772023 5.88148678,13.772023 Z M22.8867333,6.64013796 C24.2601023,6.64013796 25.3734665,7.75348618 25.3734665,9.12687122 C25.3734665,10.5002715 24.2601336,11.6136045 22.8867333,11.6136045 C21.5133329,11.6136045 20.4,10.5002715 20.4,9.12687122 C20.4,7.75347089 21.5133329,6.64013796 22.8867333,6.64013796 Z M8.95732666,6.73842757 C10.093571,6.73842757 11.0146533,7.65950986 11.0146533,8.79575423 C11.0146533,9.9319986 10.093571,10.8530809 8.95732666,10.8530809 C7.82108229,10.8530809 6.9,9.9319986 6.9,8.79575423 C6.9,7.65950986 7.82108229,6.73842757 8.95732666,6.73842757 Z M15.9865546,4 C17.221785,4 18.2231091,5.00132411 18.2231091,6.23655456 C18.2231091,7.471785 17.221785,8.47310912 15.9865546,8.47310912 C14.7513241,8.47310912 13.75,7.471785 13.75,6.23655456 C13.75,5.00132411 14.7513241,4 15.9865546,4 Z" />
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="rotate"
          from="0 16 16"
          to="360 16 16"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </g>
    </svg>
  );
};

IconLoading.propTypes = {
  className: PropTypes.string,
};

export default IconLoading;
