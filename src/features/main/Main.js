/* eslint-disable new-cap */
import React, { useEffect, useState, useCallback } from "react";
import { Rings } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import pinSosToilet from "../../assets/icon-pin-sos.svg";
import pinToilet from "../../assets/icon-pin.svg";
import pinCurrent from "../../assets/pin-current-small.gif";
import getLiveChatroomByUserId from "../../common/api/getLiveChatroomByUserId";
import { getMyLngLat, makePosionToLngLat } from "../../common/api/getMyGeo";
import getPathToToiletInfo from "../../common/api/getPathToToiletInfo";
import { getNearToilets, getMapToilets } from "../../common/api/getToilets";
import ButtonFull from "../../common/components/buttons/ButtonFull";
import ButtonSmall from "../../common/components/buttons/ButtonSmall";
import HeaderMain from "../../common/components/headers/HeaderMain";
import Modal from "../../common/components/modal/Modal";
import Sidebar from "../../common/components/Sidebar";
import { userEnteredChatroom } from "../chat/chatSlice";
import ToiletCard from "../toilet/ToiletCard";
import {
  nearToiletsUpdated,
  selectedToiletUpdated,
} from "../toilet/toiletSlice";
import { userLocationUpdated, mainStartUpdated } from "./mainSlice";
import Start from "./Start";

const StyledMain = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 5rem);
  display: flex;
  flex-direction: column;

  .loader {
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .map-container {
    flex-grow: 1;
    width: 100%;
    min-height: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .full-button {
    display: flex;
  }

  .card {
    position: absolute;
    bottom: 60px;
    width: 100%;
    z-index: 1;
    margin-bottom: 4px;

    .close {
      display: flex;
      justify-content: center;
      margin-top: 4px;
    }
  }
  .start,
  .sidebar {
    position: absolute;
    z-index: 2;
    top: 48px;
    right: 0;
    width: 100%;
    height: calc(100% - 48px);
    background-color: #0000004b;
    display: flex;
    justify-content: end;
  }
`;

const { Tmapv2 } = window;
const ANI_TYPE = Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE;

function Main() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const defaultLocation = [126.97796919, 37.566535];

  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [toiletMarkers, setToiletMarkers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [toiletMarkersCluster, setToiletMarkersCluster] = useState(null);
  const [selectedToiletDistance, setSelectedToiletDistance] = useState(null);
  const [selectedToiletTime, setSelectedToiletTime] = useState(null);
  const [drawPathInfos, setDrawPathInfos] = useState([]);
  const [drawPathResults, setDrawPathResults] = useState([]);
  const [pathMarkers, setPathMarkers] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [onSideBar, setOnSideBar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const gotUserLocation = useSelector((state) => state.main.gotUserLocation);
  const currentLocation = useSelector((state) => state.main.userLocation);
  const isMainStarted = useSelector((state) => state.main.isMainStarted);
  const nearToilets = useSelector((state) => state.toilet.nearToilets);
  const selectedToilet = useSelector((state) => state.toilet.selectedToilet);
  const userId = useSelector((state) => state.login.userId);

  const adjMap = map;
  const adjCurrentMarker = currentMarker;
  const adjToiletMarkers = toiletMarkers;
  const adjDrawPathInfos = drawPathInfos;
  const adjDrawPathResults = drawPathResults;
  const adjPathMarkers = pathMarkers;
  const adjPolyline = polyline;

  const forceSetMapCenter = useCallback(
    async (center) => {
      const newLocation = await new Tmapv2.LatLng(center[1], center[0]);
      if (adjMap) {
        adjMap.setCenter(newLocation);
      }
    },
    [adjMap]
  );

  // 초기 랜더링 시 티맵을 불러옵니다.
  useEffect(() => {
    async function makeMap() {
      const startLocation = gotUserLocation ? currentLocation : defaultLocation;
      const tMap = await new Tmapv2.Map("TMapApp", {
        center: new Tmapv2.LatLng(startLocation[1], startLocation[0]),
        width: "100%",
        height: "100%",
        zoom: 17,
        draggable: true,
        httpsMode: true,
      });
      tMap.setZoomLimit(15, 19);
      setMap(tMap);
    }
    makeMap();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 위치제공 정보에 동의하면 내 위치를 최초로 파악 후 마커를 찍고 지도를 내 위치로 이동합니다.
  useEffect(() => {
    async function setMyMarker() {
      const myMarker = await new Tmapv2.Marker({
        position: new Tmapv2.LatLng(defaultLocation[1], defaultLocation[0]),
        icon: pinCurrent,
        map: adjMap,
        httpsMode: true,
      });
      setCurrentMarker(myMarker);
      forceSetMapCenter(defaultLocation[1], defaultLocation[0]);
    }
    if (gotUserLocation) setMyMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjMap, forceSetMapCenter, gotUserLocation]);

  // 내 현재 위치가 바뀔 때마다 마커 위치를 변경합니다.
  useEffect(() => {
    async function checkCurrentMarker(location) {
      const newLocation = new Tmapv2.LatLng(location[1], location[0]);
      adjCurrentMarker.setPosition(newLocation);
    }
    if (gotUserLocation) {
      checkCurrentMarker(currentLocation);
    }
  }, [adjCurrentMarker, currentLocation, gotUserLocation]);

  // 내 현재 위치가 바뀔 때마다 주변 화장실 정보를 redux에 구성합니다. (내 주변 화장실 리스트용)
  useEffect(() => {
    async function getNearToiletList() {
      const newNearToilets = [];
      const tInfos = [];

      if (!gotUserLocation) return;

      const lat = currentLocation[1];
      const lng = currentLocation[0];
      const newToilets = await getNearToilets(lat, lng);

      if (newToilets) {
        newToilets.forEach((toilet) => {
          const tlat = toilet.location.coordinates[0];
          const tlng = toilet.location.coordinates[1];
          const data = getPathToToiletInfo(currentLocation, [tlat, tlng]);
          tInfos.push(data);
        });

        const newPathToToiletInfos = await Promise.all(tInfos);
        for (let i = 0; i < newToilets.length; i += 1) {
          const newToilet = newToilets[i];
          newToilet.tDistance =
            newPathToToiletInfos[i].features[0].properties.totalDistance;
          newToilet.tTime = (
            newPathToToiletInfos[i].features[0].properties.totalTime / 60
          ).toFixed(0);
          newNearToilets.push(newToilet);
        }

        dispatch(nearToiletsUpdated(newNearToilets));
      }
    }
    getNearToiletList();
  }, [currentLocation, dispatch, gotUserLocation]);

  // 2초마다 맵의 center를 체크하고 값이 변경됐을 경우 맵 안의 화장실들을 다시 가져와 핀을 찍습니다.
  useEffect(() => {
    async function drawToiletMarkers(toiletsArray, anitype) {
      adjToiletMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      setToiletMarkers([]);

      if (!toiletsArray) return;

      toiletsArray.forEach((toilet) => {
        const lat = toilet.location.coordinates[1];
        const lng = toilet.location.coordinates[0];
        const marker = new Tmapv2.Marker({
          position: new Tmapv2.LatLng(lat, lng),
          icon: toilet.isSOS ? pinSosToilet : pinToilet,
          animation: anitype,
          animationLength: 300,
          map: adjMap,
          httpsMode: true,
        });
        marker.addListener("click", () => {
          dispatch(selectedToiletUpdated(toilet));
        });
        marker.addListener("touchstart", () => {
          dispatch(selectedToiletUpdated(toilet));
        });
        if (!adjToiletMarkers.includes(marker)) {
          setToiletMarkers(
            (current) => !current.includes(marker) && [...current, marker]
          );
        }
      });
      setToiletMarkersCluster(
        new Tmapv2.extension.MarkerCluster({
          markers: adjToiletMarkers,
          map: adjMap,
          httpsMode: true,
        })
      );
    }

    const checkMapCenter = setInterval(async () => {
      if (!adjMap || !isMainStarted) return;

      const currentCenter = adjMap.getCenter();
      const lat = currentCenter.lat();
      const lng = currentCenter.lng();
      const newMapCenter = [lat, lng];

      const currentBounds = adjMap.getBounds();
      const distance = currentCenter.distanceTo(currentBounds.getNorthEast());

      if (JSON.stringify(mapCenter) !== JSON.stringify(newMapCenter)) {
        setMapCenter(newMapCenter);
        const newToilets = await getMapToilets(lat, lng, distance);
        drawToiletMarkers(newToilets, ANI_TYPE);
      }
    }, 2000);

    return () => {
      clearInterval(checkMapCenter);
    };
  }, [adjMap, adjToiletMarkers, dispatch, isMainStarted, mapCenter]);

  // 화장실을 선택할 경우 해당 카드가 노출되고, 현재 위치부터 화장실까지 경로를 그려 안내해 줍니다.
  useEffect(() => {
    async function drawLine(arrPoint) {
      const newPolyline = await new Tmapv2.Polyline({
        path: await arrPoint,
        strokeColor: "#DD0000",
        strokeWeight: 6,
        map: adjMap,
        httpsMode: true,
      });
      setPolyline(newPolyline);
      setDrawPathResults((current) => [...current, adjPolyline]);
    }
    // async function drawLine(arrPoint) {
    //   const newPolyline = new Tmapv2.Polyline({
    //     path: await arrPoint,
    //     strokeColor: "#DD0000",
    //     strokeWeight: 6,
    //     map: adjMap,
    //     httpsMode: true,
    //   });
    //   setPolyline(newPolyline);
    //   setDrawPathResults((current) => [...current, newPolyline]);
    // }

    async function makeDrawInfo() {
      if (adjDrawPathResults.length > 0) {
        adjDrawPathResults.forEach((result) => {
          if (result) result.setMap(null);
        });
        setDrawPathResults([]);
      }
      if (adjPathMarkers.length > 0) {
        adjPathMarkers.forEach((marker) => {
          if (marker) marker.setMap(null);
        });
        setPathMarkers([]);
      }
      setDrawPathInfos([]);

      const lat = selectedToilet.location.coordinates[0];
      const lng = selectedToilet.location.coordinates[1];
      const result = await getPathToToiletInfo(currentLocation, [lat, lng]);
      const data = result.features;
      setSelectedToiletDistance(data[0].properties.totalDistance);
      setSelectedToiletTime((data[0].properties.totalTime / 60).toFixed(0));

      data.forEach((feature) => {
        const { geometry } = feature;

        if (geometry.type === "LineString") {
          geometry.coordinates.forEach((element) => {
            const newPoint = new Tmapv2.LatLng(
              new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
                new Tmapv2.Point(element[0], element[1])
              )._lat,
              new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
                new Tmapv2.Point(element[0], element[1])
              )._lng
            );
            setDrawPathInfos((current) => [...current, newPoint]);
          });
        } else {
          const markerImg = "https://topopen.tmap.co.kr/imgs/point.png";
          // eslint-disable-next-line new-cap
          const convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
            new Tmapv2.Point(geometry.coordinates[0], geometry.coordinates[1])
          );
          const pathInfoObj = {
            markerImg,
            lat: convertPoint._lat,
            lng: convertPoint._lng,
            pointType: "P",
          };
          const newPathMarker = new Tmapv2.Marker({
            position: new Tmapv2.LatLng(pathInfoObj.lat, pathInfoObj.lng),
            icon: pathInfoObj.markerImg,
            iconSize: new Tmapv2.Size(8, 8),
            map: adjMap,
          });
          setPathMarkers((current) => [...current, newPathMarker]);
        }
      });
      drawLine(adjDrawPathInfos);
    }

    makeDrawInfo();

    // 중요 ** 티맵 Call 수량을 결정하는 중요한 세팅 입니다. 변경이 필요하다 싶으면 팀원소집 필수!!!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToilet, adjPolyline]);

  useEffect(() => {
    async function checkLiveChatAndUpdateState() {
      if (userId) {
        const { myChatroom } = await getLiveChatroomByUserId(userId);

        if (myChatroom) {
          dispatch(userEnteredChatroom(myChatroom));
        }
      }
    }
    checkLiveChatAndUpdateState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function getLocation() {
    setIsLoading(true);
    try {
      const position = await getMyLngLat();
      const lngLat = makePosionToLngLat(position);
      dispatch(userLocationUpdated(lngLat));
      forceSetMapCenter(lngLat);
      setIsLoading(false);
      dispatch(mainStartUpdated());
    } catch (error) {
      setIsLoading(false);
      const newChildren = `위치정보제공 동의를 진행하지 않으면 정확한 거리정보를 제공받을 수 없습니다. 그래도 지도를 통해 화장실들을 볼 수는 있습니다.\n\n위치정보제공 동의를 다시 하시려면 새로고침해서 다시 접속해주시기 바랍니다.`;
      setModal(newChildren);
      setOpenModal(true);
      dispatch(mainStartUpdated());
    }
  }

  function toggleSidebar() {
    if (isMainStarted) {
      setOnSideBar((current) => !current);
    }
  }

  return (
    <StyledMain>
      <HeaderMain onClick={toggleSidebar} isMainStarted={!isMainStarted} />
      <div className="map-container">
        <div id="TMapApp" />
        <div className="full-button">
          <ButtonFull type="button" onClick={() => getLocation()}>
            내 위치로 이동
          </ButtonFull>
          <ButtonFull
            type="button"
            onClick={() => navigate("/toilets", { state: nearToilets })}
          >
            주변 화장실 리스트
          </ButtonFull>
        </div>
      </div>

      {isLoading && (
        <div className="loader">
          <Rings
            height="100%"
            width="200%"
            color="#bc955c"
            ariaLabel="loading"
          />
        </div>
      )}

      {openModal && (
        <Modal
          onModalCloseClick={() => {
            setOpenModal(false);
          }}
        >
          {modal}
        </Modal>
      )}

      {selectedToilet && (
        <div className="card">
          <ToiletCard
            toilet={selectedToilet}
            distance={selectedToiletDistance}
            time={selectedToiletTime}
          />
          <div className="close">
            <ButtonSmall
              type="button"
              onClick={() => dispatch(selectedToiletUpdated(null))}
            >
              카드 닫기
            </ButtonSmall>
          </div>
        </div>
      )}

      {!isMainStarted && (
        <div className="start">
          <Start onClick={getLocation} />
        </div>
      )}

      {onSideBar && gotUserLocation && (
        <div className="sidebar">
          <Sidebar onClick={toggleSidebar} />
        </div>
      )}
    </StyledMain>
  );
}

export default Main;
