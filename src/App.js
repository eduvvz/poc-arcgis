import { useCallback, useEffect, useState } from 'react';
import './App.css';
import arcsConfig from "@arcgis/core/config";
import Map from "@arcgis/core/Map";
import SceneView from "@arcgis/core/views/SceneView";
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'

const API_KEY = 'AAPK3b61d42d64cc44189158ec124c883a6fV8iaj5IIjZDZ-3pZzaygOLlXJcYA7hgeh7EzL_GQiegvZDnxCtA5nBUkotaklvUv';

const satellites_mock = [
  {
    name: 'sat 1',
    x: -46.625290,
    y: -23.533773,
    z: 500000
  },
  { name: 'sat 2', x: -101.299591, y: 47.116386, z: 500000 },
  { name: 'sat 3', x: -61.603478, y: 4.326175, z: 500000 },
  { name: 'sat 4', x: -75.941156, y: 34.645240, z: 500000 },
  { name: 'sat 5', x: -80.030353, y: 38.868616, z: 500000 }
];

const cruises_mock = [
  {
    name: 'cruise 1',
    x: -92.600786,
    y: 28.598917,
    z: 50000,
    paths: [
      [-92.600786, 28.598917],
      [-84.764734, 24.253481],
      [-79.690918, 23.885950],
      [-80.134593, 25.616391]
    ],
  },
];

function App() {
  const [sceneView, setSceneView] = useState();
  const [activeSat, setActiveSat] = useState();
  const [activeCruise, setActiveCruise] = useState();

  const customContentRender = (sat) => {
    setActiveSat(sat);
    return <div id="popup-render-custom" />
  }

  const customContentRenderCruizer = (cru) => {
    setActiveCruise(cru);
    return <div id="popup-render-custom" />
  }

  useEffect(() => {
    arcsConfig.apiKey = API_KEY;

    const map = new Map({
      basemap: "arcgis-navigation-night", //Basemap layer service
      ground: "world-elevation", //Elevation service
    });

    const view = new SceneView({
      container: "viewDiv",
      map: map,
      zoom: 3.5,
      center: [-101.299591, 47.116386],
      viewingMode: 'global',
    });

    view.on('click', () => {
      setActiveSat(undefined);
      setActiveCruise(undefined);
    })

    const satelliteLayer = new GraphicsLayer();
    const cruiseLayer = new GraphicsLayer();

    cruises_mock.forEach(cru => {
      const template = {
        content: () => customContentRenderCruizer(cru),
      }

      let graphic = new Graphic({
        geometry: {
          type: "point",
          x: cru.x,
          y: cru.y,
          z: cru.z
        },
        symbol: {
          type: "picture-marker",
          url: require("./cruise-ship.png"),
          width: "30px",
          height: "10px",
        },
        popupTemplate: template
      });

      cruiseLayer.add(graphic);
    });

    satellites_mock.forEach(sat => {

      const template = {
        content: () => customContentRender(sat),
      }

      let graphic = new Graphic({
        geometry: {
          type: "point", // Autocasts as new Point()
          x: sat.x,
          y: sat.y,
          z: sat.z
        },
        symbol: {
          type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
          url: require("./satellite.png"),
          width: "40px",
          height: "20px",
        },
        popupTemplate: template
      });

      satelliteLayer.add(graphic);

    });

    map.addMany([cruiseLayer, satelliteLayer]);

    setSceneView(view);
  }, [])

  const showCruisePath = useCallback(() => {
    const polylineGraphic = new Graphic({
      geometry: {
        type: "polyline",
        paths: activeCruise.paths,
      },
      symbol: {
        type: "simple-line",
        color: "white",
        width: "2px",
        style: "long-dash",
        join: "bevel",
      },
    });

    const lastPath = activeCruise.paths.slice(-1).pop();

    const markGraphic = new Graphic({
      geometry: {
        type: "point",
        x: lastPath[0],
        y: lastPath[1],
        z: 50000
      },
      symbol: {
        type: "picture-marker",
        url: require("./pin.png"),
        width: "30px",
        height: "30px",
      },
    });

    sceneView.graphics.addMany([polylineGraphic, markGraphic]);
  }, [sceneView, activeCruise])

  const moveCamera = useCallback((x, y) => {
    function shiftCamera() {
      const camera = sceneView.camera.clone();
      camera.position.longitude = x;
      camera.position.latitude = y;
      return camera;
    }

    function catchAbortError(error) {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    }

    sceneView
      .goTo(
        shiftCamera(),
        {
          speedFactor: 1,
          easing: "linear"
        }
      )
      .catch(catchAbortError);
  }, [sceneView])

  useEffect(() => {
    if (!sceneView || !activeCruise) {
      console.log(sceneView?.graphics)
      sceneView?.graphics.removeAll();
      return;
    };

    moveCamera(activeCruise.x, activeCruise.y);
    showCruisePath();
  }, [activeCruise, moveCamera, sceneView, showCruisePath])

  useEffect(() => {
    if (!sceneView || !activeSat) return;

    moveCamera(activeSat.x, activeSat.y);
  }, [activeSat, moveCamera, sceneView])

  return (
    <>
      {activeSat && (
        <div id="modal">
          <p>name: <b>{activeSat.name}</b></p>
        </div>
      )}
      <div id="viewDiv" />
    </>
  );
}

export default App;
