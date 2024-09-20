const getJwtToken = require("../helpers/getJwtToken");

const cookieToken = (user, res, userType) => {
  const token = getJwtToken(user.id); // Using 'id' for JWT
  const options = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: "None",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };

  user.password = undefined;

  res.status(200).cookie("token", token, options).json({
    success: true,
    token,
    user,
    userType,
  });
};

module.exports = cookieToken;
