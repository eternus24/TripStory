import foodImg from "../../assets/thumbs/food.jpg";
import cafeImg from "../../assets/thumbs/cafe.jpg";
import spotImg from "../../assets/thumbs/spot.jpg";

export function getThumbForCategory(categoryText = "") {
  const lower = categoryText.toLowerCase();

  if (lower.includes("카페") || lower.includes("cafe")) {
    return cafeImg;
  }
  if (
    lower.includes("음식") ||
    lower.includes("식당") ||
    lower.includes("분식") ||
    lower.includes("맛집") ||
    lower.includes("restaurant")
  ) {
    return foodImg;
  }
  // 관광명소 / 랜드마크같은 경우
  if (
    lower.includes("관광") ||
    lower.includes("관광명소") ||
    lower.includes("명소") ||
    lower.includes("랜드마크") ||
    lower.includes("관광지")
  ) {
    return spotImg;
  }

  // 기본
  return spotImg;
}