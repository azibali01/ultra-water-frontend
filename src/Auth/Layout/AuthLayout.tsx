import { Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Outlet } from "react-router-dom";
const AuthLayout = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <Stack
      justify="center"
      align="center"
      bg={"#F8F9FA"}
      w="100vw"
      h="100vh"
      px={isSmallScreen ? "md" : "xl"}
      py={isSmallScreen ? "md" : 0}
      style={{
        overflowY: "auto",
      }}
    >
      <Outlet />
    </Stack>
  );
};

export default AuthLayout;
