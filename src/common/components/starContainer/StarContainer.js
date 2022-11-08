import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";

import starEmpty from "../../../assets/icon-star-empty.png";
import starFull from "../../../assets/icon-star-full.png";
import starHalf from "../../../assets/icon-star-half.png";

const StyledDiv = styled.div`
  display: flex;
  align-items: center;
  width: ${(props) => props.width};
  margin-left: 0.4rem;

  .star {
    width: 2rem;
  }

  .rating-number {
    font-size: 1.2rem;
    margin-left: 1rem;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  align-items: center;
`;

function StarContainer({ rating, showRatingNumber, onClick, width }) {
  function starClickHandler(starNumber) {
    onClick(starNumber);
  }

  function setStarImageByRating(
    emptyStarThreshold,
    halfStarThreshold,
    ratingInput
  ) {
    let imageSrc = starEmpty;

    if (ratingInput > emptyStarThreshold) {
      if (ratingInput < halfStarThreshold) {
        imageSrc = starHalf;

        return imageSrc;
      }
      imageSrc = starFull;
    }

    return imageSrc;
  }

  return (
    <StyledDiv width={width}>
      <ImageContainer onClick={starClickHandler.bind(this, 1)}>
        <img className="star" src={starFull} alt="star" />
      </ImageContainer>
      <ImageContainer onClick={starClickHandler.bind(this, 2)}>
        <img
          className="star"
          src={setStarImageByRating(1, 2, rating)}
          alt="star"
        />
      </ImageContainer>
      <ImageContainer onClick={starClickHandler.bind(this, 3)}>
        <img
          className="star"
          src={setStarImageByRating(2, 3, rating)}
          alt="star"
        />
      </ImageContainer>
      <ImageContainer onClick={starClickHandler.bind(this, 4)}>
        <img
          className="star"
          src={setStarImageByRating(3, 4, rating)}
          alt="star"
        />
      </ImageContainer>
      <ImageContainer onClick={starClickHandler.bind(this, 5)}>
        <img
          className="star"
          src={setStarImageByRating(4, 5, rating)}
          alt="star"
        />
      </ImageContainer>
      {showRatingNumber && <div className="rating-number">{`(${rating})`}</div>}
    </StyledDiv>
  );
}

StarContainer.propTypes = {
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  showRatingNumber: PropTypes.bool,
  onClick: PropTypes.func,
  width: PropTypes.string,
};

StarContainer.defaultProps = {
  showRatingNumber: true,
  onClick: () => {},
  width: "20%",
};

export default StarContainer;
