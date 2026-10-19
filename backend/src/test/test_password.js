import { hashPassword, comparePassword } from "../utils/password.js";

const test = async () => {
  const password = "MoviePass123!";

  const hashedPassword = await hashPassword(password);
  console.log("Hashed:", hashedPassword);

  const correctPassword = await comparePassword(password, hashedPassword);
  console.log("Correct password:", correctPassword);

  const wrongPassword = await comparePassword(
    "WrongPassword123!",
    hashedPassword,
  );
  console.log("Wrong password:", wrongPassword);
};

test();
