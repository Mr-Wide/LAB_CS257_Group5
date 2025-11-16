import React from "react";

interface BackgroundVideoProps {
  videoSrc: string;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ videoSrc }) => (
  <div className="background-video">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="background-video__video"
    >
      <source src={videoSrc} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div className="background-video__overlay" />
  </div>
);
