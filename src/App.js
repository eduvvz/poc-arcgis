import { useCallback, useEffect, useState } from 'react';
import './app.css';
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

function App() {
  const [sceneView, setSceneView] = useState();
  const [activeSat, setActiveSat] = useState();

  const customContentRender = (sat) => {
    setActiveSat(sat);
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

    view.on('click', (ev) => {
      setActiveSat(undefined);
    })

    const satelliteLayer = new GraphicsLayer();

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
          width: "50px",
          height: "30px",
        },
        popupTemplate: template
      });

      satelliteLayer.add(graphic);

    });

    map.add(satelliteLayer);

    setSceneView(view);
  }, [])

  const moveCamera = useCallback(() => {
    function shiftCamera(sat) {
      const camera = sceneView.camera.clone();
      camera.position.longitude = sat.x;
      camera.position.latitude = sat.y;
      return camera;
    }

    function catchAbortError(error) {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    }

    sceneView
      .goTo(
        shiftCamera(activeSat),
        {
          speedFactor: 1,
          easing: "linear"
        }
      )
      .catch(catchAbortError);
  }, [activeSat, sceneView])

  useEffect(() => {
    if (!sceneView || !activeSat) return;

    moveCamera();
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
