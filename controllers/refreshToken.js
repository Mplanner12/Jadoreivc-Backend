exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res
        .status(403)
        .json({ message: "Refresh token is invalid or expired" });
    }

    // Generate a new JWT
    const newJwtToken = getJwtToken(storedToken.userId);
    res.cookie("token", newJwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.json({ success: true, token: newJwtToken });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
