const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomChars = (length) =>
  Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export const generateTrackingId = () => {
  const date = new Date();
  const yymmdd = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `CF-${yymmdd}-${randomChars(6)}`;
};
