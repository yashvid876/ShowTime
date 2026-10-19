import bcrypt from "bcrypt";

const hashPassword = async (plaintextPassword) => {
  const saltRounds = 10;
  return await bcrypt.hash(plaintextPassword, saltRounds);
};

const comparePassword = async (plaintextPassword, hashedPassword) => {
  return await bcrypt.compare(plaintextPassword, hashedPassword);
};

export { hashPassword, comparePassword };
