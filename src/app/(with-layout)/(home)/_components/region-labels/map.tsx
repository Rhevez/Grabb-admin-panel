"use client";

import jsVectorMap from "jsvectormap";
import { useEffect } from "react";

import "@/js/us-aea-en";

export default function Map() {
  useEffect(() => {
    const map = new jsVectorMap({
      selector: "#mapOne",
      map: "us_aea_en",
      zoomButtons: true,
      regionStyle: {
        initial: {
          fill: "#C8D0D8",
        },
        hover: {
          fillOpacity: 1,
          fill: "#3056D3",
        },
      },
      regionLabelStyle: {
        initial: {
          fontWeight: "semibold",
          fill: "#fff",
        },
        hover: {
          cursor: "pointer",
        },
      },
      labels: {
        regions: {
          render(code: string) {
            return code.split("-")[1];
          },
        },
      },
    });

    return () => {
      const mapEl = document.getElementById("mapOne");
      if (mapEl) {
        mapEl.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="h-[422px] w-full relative overflow-hidden rounded-lg">
      <div id="mapOne" className="mapOne map-btn h-full w-full absolute inset-0" />
    </div>
  );
}

