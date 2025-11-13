import { useForm } from "@mantine/form";
import {
  TextInput,
  Button,
  Card,
  Title,
  Stack,
  Text,
  PasswordInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router";

import { api } from "../../lib/api";

const Login = () => {
  const { login } = useAuth();
  const [visible, { toggle }] = useDisclosure(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // send both `email` and `username` for compatibility with backends
      const res = await api.post(
        `/auth/login`,
        { email, username: email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.status === 201 || res.status === 200) {
        const token = res.data?.access_token;
        const user = res.data?.user;
        if (token) {
          try {
            localStorage.setItem("ultra-token", token);
          } catch {}
        }
        if (user) {
          login({ id: user.sub ?? user._id ?? "1", email: user.email, name: user.name ?? "User" });
        }
        notifications.show({ message: "Login successful", color: "green" });
        navigate("/dashboard");
      } else {
        notifications.show({ message: "Login failed", color: "red" });
      }
    } catch (err: any) {
      // show backend error message when available for easier debugging
      const resp = err?.response;
      const msg = resp?.data?.message || resp?.data || err?.message || "Login failed";
      // log full error to console for debug
      // eslint-disable-next-line no-console
      console.error('Login error', err);
      notifications.show({ message: String(msg), color: "red" });
    }
  };

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "" },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleError = (errors: typeof form.errors) => {
    if (errors.email) {
      notifications.show({
        message: "Please provide a valid email",
        color: "red",
      });
    }
  };

  return (
    <Stack
      align="center"
      justify="center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Card
        withBorder
        shadow="lg"
        w={440}
        p={40}
        radius="md"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e0e0e0",
        }}
      >
        <Stack align="center" justify="center" gap="lg">
          <Stack align="center" gap="xs">
            <Title
              order={2}
              style={{
                color: "#333",
                fontWeight: 700,
                fontSize: "28px",
              }}
            >
              Ultra Water
            </Title>
            <Text
              size="sm"
              style={{
                color: "#666",
                fontWeight: 500,
              }}
            >
              Sign in to your account
            </Text>
          </Stack>

          <form
            onSubmit={form.onSubmit(() => handleLogin(), handleError)}
            style={{ width: "100%", marginTop: "8px" }}
          >
            <Stack gap="lg">
              <TextInput
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                label="Email"
                placeholder="you@example.com"
                size="md"
                styles={{
                  label: {
                    color: "#333",
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "8px",
                  },
                  input: {
                    backgroundColor: "#ffffff",
                    color: "#333",
                    borderColor: "#ddd",
                    fontSize: "15px",
                    padding: "10px 12px",
                    "&:focus": {
                      borderColor: "#333",
                      boxShadow: "0 0 0 2px rgba(51, 51, 51, 0.1)",
                    },
                    "&::placeholder": {
                      color: "#999",
                    },
                  },
                }}
              />

              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                label="Password"
                placeholder="Enter your password"
                size="md"
                visible={visible}
                onVisibilityChange={toggle}
                styles={{
                  label: {
                    color: "#333",
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "8px",
                  },
                  input: {
                    backgroundColor: "#ffffff",
                    color: "#333",
                    borderColor: "#ddd",
                    fontSize: "15px",
                    padding: "10px 12px",
                    "&:focus": {
                      borderColor: "#333",
                      boxShadow: "0 0 0 2px rgba(51, 51, 51, 0.1)",
                    },
                    "&::placeholder": {
                      color: "#999",
                    },
                  },
                  innerInput: {
                    color: "#333",
                  },
                  visibilityToggle: {
                    color: "#666",
                    "&:hover": {
                      color: "#333",
                    },
                  },
                }}
              />

              <Button
                fullWidth
                mt="md"
                size="md"
                onClick={handleLogin}
                styles={{
                  root: {
                    backgroundColor: "#333",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "15px",
                    height: "44px",
                    border: "none",
                    "&:hover": {
                      backgroundColor: "#000",
                    },
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Stack>
  );
};

export default Login;
