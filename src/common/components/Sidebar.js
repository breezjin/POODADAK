import PropTypes from "prop-types";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import close from "../../assets/icon-close-black.png";
import right from "../../assets/icon-right-black.png";
import kakao from "../../assets/kakao.svg";
import naver from "../../assets/naver.svg";
import { userLoggedOut } from "../../features/login/loginSlice";

const StyledSidebar = styled.div`
  position: relative;
  width: 280px;
  background-color: white;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  .close {
    width: 240px;
    height: 40px;
    font-size: large;
    color: black;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .description {
    width: 240px;
    font-size: small;
    color: gray;
    margin-bottom: 20px;
  }

  .sns-login {
    cursor: pointer;
  }

  .list {
    width: 240px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    cursor: pointer;
  }

  .line {
    width: 230px;
    border-top: 1px solid gray;
  }

  .list-content {
    color: black;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }
`;

function Sidebar({ onClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
  const loggedInUserId = useSelector((state) => state.login.userId);

  function kakaoLogin() {
    window.location.href = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.REACT_APP_KAKAO_REST_API_KEY}&redirect_uri=${process.env.REACT_APP_KAKAO_REST_API_REDIRECT_URL}`;
  }

  function naverLogin() {
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.REACT_APP_NAVER_CLIENT_ID}&state=${process.env.REACT_APP_NAVER_STATE}&redirect_uri=${process.env.REACT_APP_NAVER_CALLBACK_URL}`;
  }

  function handleLogoutClick() {
    localStorage.removeItem("POODADAK_TOKEN");
    dispatch(userLoggedOut());
  }

  return (
    <StyledSidebar>
      <div
        className="close"
        onClick={() => {
          onClick();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={() => {
          onClick();
        }}
      >
        <img src={close} alt="닫기" />
        닫기
      </div>
      {!isLoggedIn && (
        <>
          <div className="description">
            리뷰를 남기거나 SOS를 보내려면 로그인 하셔야 합니다.
          </div>
          <div
            className="sns-login"
            onClick={kakaoLogin}
            role="button"
            tabIndex={0}
            onKeyDown={kakaoLogin}
          >
            <img src={kakao} alt="카카오 로그인" />
          </div>
          <div
            className="sns-login"
            onClick={naverLogin}
            role="button"
            tabIndex={0}
            onKeyDown={naverLogin}
          >
            <img src={naver} alt="네이버 로그인" />
          </div>
        </>
      )}
      {isLoggedIn && (
        <>
          <div
            className="list"
            role="button"
            onClick={() => navigate(`/users/${loggedInUserId}`)}
            tabIndex={0}
            onKeyDown={() => navigate(`/users/${loggedInUserId}`)}
          >
            <hr className="line" />
            <div className="list-content">
              내 리뷰 보러가기
              <img src={right} alt="네이버 로그인" />
            </div>
          </div>
          <div
            className="list"
            role="button"
            onClick={handleLogoutClick}
            tabIndex={0}
            onKeyDown={handleLogoutClick}
          >
            <hr className="line" />
            <div className="list-content">
              로그아웃
              <img src={right} alt="네이버 로그인" />
            </div>
          </div>
        </>
      )}
    </StyledSidebar>
  );
}

Sidebar.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default Sidebar;
